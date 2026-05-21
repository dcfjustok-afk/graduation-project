from __future__ import annotations

import copy
import posixpath
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


RECORD_DIR = Path(__file__).resolve().parents[1] / "doc" / "记录本"
WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
W = f"{{{WORD_NS}}}"
REL = f"{{{REL_NS}}}"
OFFICE_REL = f"{{{OFFICE_REL_NS}}}"
WEEK_RE = re.compile(r"^第(\d+)周记录本\.docx$")


ET.register_namespace("w", WORD_NS)
ET.register_namespace("r", OFFICE_REL_NS)
ET.register_namespace("", REL_NS)


def text_of(element: ET.Element) -> str:
    return "".join(t.text or "" for t in element.iter(f"{W}t"))


def compact(text: str) -> str:
    return "".join(text.split())


def week_number(path: Path) -> int:
    match = WEEK_RE.match(path.name)
    if not match:
        raise ValueError(path.name)
    return int(match.group(1))


def parse_docx(path: Path):
    with zipfile.ZipFile(path, "r") as zf:
        document = ET.fromstring(zf.read("word/document.xml"))
        rels = ET.fromstring(zf.read("word/_rels/document.xml.rels"))
        media = {name: zf.read(name) for name in zf.namelist() if name.startswith("word/media/") and not name.endswith("/")}
        items = [(item, zf.read(item.filename)) for item in zf.infolist()]
    return document, rels, media, items


def get_record_table(body: ET.Element) -> ET.Element:
    tables = body.findall(f"{W}tbl")
    for table in tables:
        rows = table.findall(f"{W}tr")
        if not rows:
            continue
        row0 = compact(text_of(rows[0]))
        if "周次" in row0 and "学生" in row0 and "地点" in row0:
            return table
    if len(tables) >= 2:
        return tables[1]
    raise RuntimeError("未找到记录表")


def child_index(parent: ET.Element, child: ET.Element) -> int:
    children = list(parent)
    for index, item in enumerate(children):
        if item is child:
            return index
    raise ValueError("child not found")


def clear_and_set_cell_text(cell: ET.Element, value: str) -> None:
    paragraphs = cell.findall(f"{W}p")
    if not paragraphs:
        paragraph = ET.SubElement(cell, f"{W}p")
    else:
        paragraph = paragraphs[0]
        for extra in paragraphs[1:]:
            cell.remove(extra)

    p_pr = paragraph.find(f"{W}pPr")
    for child in list(paragraph):
        if child is not p_pr:
            paragraph.remove(child)

    run = ET.SubElement(paragraph, f"{W}r")
    text = ET.SubElement(run, f"{W}t")
    text.text = value


def copy_paragraph_content(source_cell: ET.Element, target_cell: ET.Element) -> None:
    source_paragraphs = source_cell.findall(f"{W}p")
    target_paragraphs = target_cell.findall(f"{W}p")
    if not source_paragraphs:
        clear_and_set_cell_text(target_cell, "")
        return
    if not target_paragraphs:
        target_paragraph = ET.SubElement(target_cell, f"{W}p")
    else:
        target_paragraph = target_paragraphs[0]
        for extra in target_paragraphs[1:]:
            target_cell.remove(extra)

    target_p_pr = target_paragraph.find(f"{W}pPr")
    for child in list(target_paragraph):
        if child is not target_p_pr:
            target_paragraph.remove(child)

    source_first = source_paragraphs[0]
    for child in list(source_first):
        if child.tag != f"{W}pPr":
            target_paragraph.append(copy.deepcopy(child))

    for source_extra in source_paragraphs[1:]:
        target_cell.append(copy.deepcopy(source_extra))


def rel_map(rels: ET.Element) -> dict[str, ET.Element]:
    return {rel.attrib["Id"]: rel for rel in rels.findall(f"{REL}Relationship") if "Id" in rel.attrib}


def next_relationship_id(rels: ET.Element, used: set[str]) -> str:
    max_id = 0
    for rel in rels.findall(f"{REL}Relationship"):
        rid = rel.attrib.get("Id", "")
        match = re.match(r"rId(\d+)$", rid)
        if match:
            max_id = max(max_id, int(match.group(1)))
    max_id += 1
    while f"rId{max_id}" in used:
        max_id += 1
    used.add(f"rId{max_id}")
    return f"rId{max_id}"


def rel_target_to_zip_name(target: str) -> str:
    if target.startswith("../"):
        return posixpath.normpath(posixpath.join("word", target[3:]))
    return posixpath.normpath(posixpath.join("word", target))


def next_media_name(existing: set[str], source_name: str) -> str:
    suffix = Path(source_name).suffix or ".bin"
    index = 1
    while True:
        candidate = f"word/media/week1_signature{index}{suffix}"
        if candidate not in existing:
            existing.add(candidate)
            return candidate
        index += 1


def collect_related_media(table: ET.Element, source_rels: ET.Element, source_media: dict[str, bytes]):
    source_rel_map = rel_map(source_rels)
    payloads: dict[str, tuple[str, str, bytes]] = {}
    for element in table.iter():
        for attr, value in list(element.attrib.items()):
            if attr in {f"{OFFICE_REL}id", f"{OFFICE_REL}embed", f"{OFFICE_REL}link"}:
                relationship = source_rel_map.get(value)
                if relationship is None:
                    continue
                target = relationship.attrib.get("Target", "")
                zip_name = rel_target_to_zip_name(target)
                if zip_name in source_media:
                    payloads[value] = (relationship.attrib.get("Type", ""), target, source_media[zip_name])
    return payloads


def remap_relationships(table: ET.Element, target_rels: ET.Element, target_existing_names: set[str], payloads) -> dict[str, bytes]:
    used_ids = {rel.attrib.get("Id", "") for rel in target_rels.findall(f"{REL}Relationship")}
    id_mapping: dict[str, str] = {}
    new_media: dict[str, bytes] = {}

    for old_id, (rel_type, old_target, data) in payloads.items():
        source_zip = rel_target_to_zip_name(old_target)
        new_zip = next_media_name(target_existing_names, source_zip)
        new_id = next_relationship_id(target_rels, used_ids)
        new_target = posixpath.relpath(new_zip, "word")

        rel = ET.Element(f"{REL}Relationship")
        rel.set("Id", new_id)
        rel.set("Type", rel_type)
        rel.set("Target", new_target)
        target_rels.append(rel)

        id_mapping[old_id] = new_id
        new_media[new_zip] = data

    for element in table.iter():
        for attr, value in list(element.attrib.items()):
            if attr in {f"{OFFICE_REL}id", f"{OFFICE_REL}embed", f"{OFFICE_REL}link"} and value in id_mapping:
                element.set(attr, id_mapping[value])

    return new_media


def write_docx(path: Path, items, document_xml: bytes, rels_xml: bytes, new_media: dict[str, bytes]) -> None:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx", dir=path.parent) as tmp:
        temp_path = Path(tmp.name)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as zout:
            existing = set()
            for item, data in items:
                if item.filename == "word/document.xml":
                    data = document_xml
                elif item.filename == "word/_rels/document.xml.rels":
                    data = rels_xml
                zout.writestr(item, data)
                existing.add(item.filename)
            for name, data in new_media.items():
                if name not in existing:
                    zout.writestr(name, data)
        shutil.move(str(temp_path), path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def main() -> None:
    source_path = RECORD_DIR / "第1周记录本.docx"
    source_document, source_rels, source_media, _ = parse_docx(source_path)
    source_body = source_document.find(f"{W}body")
    if source_body is None:
        raise RuntimeError("第1周缺少 w:body")
    source_table = get_record_table(source_body)
    source_table_template = copy.deepcopy(source_table)
    source_payloads = collect_related_media(source_table_template, source_rels, source_media)

    target_paths = sorted(
        [p for p in RECORD_DIR.glob("第*周记录本.docx") if WEEK_RE.match(p.name) and week_number(p) != 1],
        key=week_number,
    )

    updated = 0
    skipped: list[str] = []
    for path in target_paths:
        try:
            document, rels, _media, items = parse_docx(path)
            body = document.find(f"{W}body")
            if body is None:
                raise RuntimeError(f"{path.name}: 缺少 w:body")
            old_table = get_record_table(body)
            old_rows = old_table.findall(f"{W}tr")
            if len(old_rows) < 3:
                raise RuntimeError(f"{path.name}: 记录表行数不足")

            new_table = copy.deepcopy(source_table_template)
            new_rows = new_table.findall(f"{W}tr")
            old_row1_cells = old_rows[0].findall(f"{W}tc")
            old_row2_cells = old_rows[1].findall(f"{W}tc")
            old_row3_cells = old_rows[2].findall(f"{W}tc")
            new_row1_cells = new_rows[0].findall(f"{W}tc")
            new_row2_cells = new_rows[1].findall(f"{W}tc")
            new_row3_cells = new_rows[2].findall(f"{W}tc")

            for index in (1, 3, 5):
                copy_paragraph_content(old_row1_cells[index], new_row1_cells[index])
            copy_paragraph_content(old_row2_cells[1], new_row2_cells[1])
            copy_paragraph_content(old_row3_cells[1], new_row3_cells[1])

            existing_names = {item.filename for item, _data in items}
            new_media = remap_relationships(new_table, rels, existing_names, source_payloads)

            table_index = child_index(body, old_table)
            body.remove(old_table)
            body.insert(table_index, new_table)

            document_xml = ET.tostring(document, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
            rels_xml = ET.tostring(rels, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
            write_docx(path, items, document_xml, rels_xml, new_media)
            updated += 1
        except PermissionError:
            skipped.append(path.name)

    print(f"rebuilt {updated} files")
    if skipped:
        print("skipped locked files:")
        for name in skipped:
            print(name)


if __name__ == "__main__":
    main()
