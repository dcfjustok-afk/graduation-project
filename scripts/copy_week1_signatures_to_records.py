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


def week_number(path: Path) -> int:
    match = WEEK_RE.match(path.name)
    if not match:
        raise ValueError(path.name)
    return int(match.group(1))


def find_record_table(root: ET.Element) -> ET.Element:
    body = root.find(f"{W}body")
    if body is None:
        raise RuntimeError("document.xml 缺少 w:body")
    for table in body.findall(f"{W}tbl"):
        rows = table.findall(f"{W}tr")
        if rows and "周 次" in text_of(rows[0]) and "学 生" in text_of(rows[0]) and "地 点" in text_of(rows[0]):
            return table
    raise RuntimeError("未找到记录表")


def parse_docx(path: Path) -> tuple[ET.Element, ET.Element, dict[str, bytes]]:
    with zipfile.ZipFile(path, "r") as zf:
        document = ET.fromstring(zf.read("word/document.xml"))
        rels = ET.fromstring(zf.read("word/_rels/document.xml.rels"))
        media = {name: zf.read(name) for name in zf.namelist() if name.startswith("word/media/") and not name.endswith("/")}
    return document, rels, media


def relationship_map(rels: ET.Element) -> dict[str, ET.Element]:
    return {rel.attrib["Id"]: rel for rel in rels.findall(f"{REL}Relationship") if "Id" in rel.attrib}


def next_relationship_id(rels: ET.Element) -> str:
    max_id = 0
    for rel in rels.findall(f"{REL}Relationship"):
        rid = rel.attrib.get("Id", "")
        match = re.match(r"rId(\d+)$", rid)
        if match:
            max_id = max(max_id, int(match.group(1)))
    return f"rId{max_id + 1}"


def next_media_name(existing_names: set[str], source_name: str) -> str:
    suffix = Path(source_name).suffix or ".bin"
    index = 1
    while True:
        candidate = f"word/media/signature{index}{suffix}"
        if candidate not in existing_names:
            return candidate
        index += 1


def relationship_target_to_zip_name(target: str) -> str:
    return posixpath.normpath(posixpath.join("word/_rels", "..", target))


def collect_source_signature() -> tuple[ET.Element, dict[str, tuple[str, bytes, str]]]:
    source_path = RECORD_DIR / "第1周记录本.docx"
    document, rels, media = parse_docx(source_path)
    table = find_record_table(document)
    rows = table.findall(f"{W}tr")
    if len(rows) < 4:
        raise RuntimeError("第1周记录表行数不足")

    signature_row = copy.deepcopy(rows[-1])
    source_rels = relationship_map(rels)
    rel_payloads: dict[str, tuple[str, bytes, str]] = {}

    for element in signature_row.iter():
        for attr_name, attr_value in list(element.attrib.items()):
            if attr_name in {f"{OFFICE_REL}id", f"{OFFICE_REL}embed", f"{OFFICE_REL}link"}:
                source_rel = source_rels.get(attr_value)
                if source_rel is None:
                    continue
                target = source_rel.attrib["Target"]
                target_zip_name = relationship_target_to_zip_name(target)
                if target_zip_name in media:
                    rel_type = source_rel.attrib["Type"]
                    rel_payloads[attr_value] = (target, media[target_zip_name], rel_type)

    return signature_row, rel_payloads


def update_document(target_path: Path, source_row: ET.Element, source_rel_payloads: dict[str, tuple[str, bytes, str]]) -> None:
    with zipfile.ZipFile(target_path, "r") as zin:
        document = ET.fromstring(zin.read("word/document.xml"))
        rels = ET.fromstring(zin.read("word/_rels/document.xml.rels"))
        existing_names = set(zin.namelist())
        original_items = [(item, zin.read(item.filename)) for item in zin.infolist()]

    target_row = copy.deepcopy(source_row)
    id_mapping: dict[str, str] = {}
    new_media: dict[str, bytes] = {}

    for old_id, (old_target, data, rel_type) in source_rel_payloads.items():
        new_id = next_relationship_id(rels)
        while new_id in id_mapping.values():
            number = int(new_id[3:]) + 1
            new_id = f"rId{number}"
        source_zip_name = relationship_target_to_zip_name(old_target)
        new_zip_name = next_media_name(existing_names | set(new_media.keys()), source_zip_name)
        existing_names.add(new_zip_name)
        new_target = posixpath.relpath(new_zip_name, "word")

        new_rel = ET.Element(f"{REL}Relationship")
        new_rel.set("Id", new_id)
        new_rel.set("Type", rel_type)
        new_rel.set("Target", new_target)
        rels.append(new_rel)

        id_mapping[old_id] = new_id
        new_media[new_zip_name] = data

    for element in target_row.iter():
        for attr_name, attr_value in list(element.attrib.items()):
            if attr_name in {f"{OFFICE_REL}id", f"{OFFICE_REL}embed", f"{OFFICE_REL}link"} and attr_value in id_mapping:
                element.set(attr_name, id_mapping[attr_value])

    table = find_record_table(document)
    rows = table.findall(f"{W}tr")
    if len(rows) < 4:
        raise RuntimeError(f"{target_path.name}: 记录表行数不足")
    table.remove(rows[-1])
    table.append(target_row)

    document_xml = ET.tostring(document, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
    rels_xml = ET.tostring(rels, encoding="utf-8", xml_declaration=True, short_empty_elements=True)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        tmp_path = Path(tmp.name)
    try:
        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item, data in original_items:
                if item.filename == "word/document.xml":
                    data = document_xml
                elif item.filename == "word/_rels/document.xml.rels":
                    data = rels_xml
                zout.writestr(item, data)
            for name, data in new_media.items():
                zout.writestr(name, data)
        shutil.move(str(tmp_path), target_path)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def main() -> None:
    source_row, source_rel_payloads = collect_source_signature()
    if len(source_rel_payloads) < 2:
        raise RuntimeError("第1周签名图片关系少于 2 个，请检查签名是否已插入")

    targets = sorted(
        [p for p in RECORD_DIR.glob("第*周记录本.docx") if WEEK_RE.match(p.name) and week_number(p) != 1],
        key=week_number,
    )
    for path in targets:
        update_document(path, source_row, source_rel_payloads)
    print(f"updated {len(targets)} files")


if __name__ == "__main__":
    main()
