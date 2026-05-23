from __future__ import annotations

import copy
import posixpath
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
RECORD_DIR = ROOT / "doc" / "记录本"
OUTPUT_PATH = ROOT / "output" / "毕业设计记录本（1-26周合并版）.docx"

WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
W14_NS = "http://schemas.microsoft.com/office/word/2010/wordml"
VML_NS = "urn:schemas-microsoft-com:vml"
OFFICE_NS = "urn:schemas-microsoft-com:office:office"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
PIC_NS = "http://schemas.openxmlformats.org/drawingml/2006/picture"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

W = f"{{{WORD_NS}}}"
REL = f"{{{REL_NS}}}"
OFFICE_REL = f"{{{OFFICE_REL_NS}}}"
W14 = f"{{{W14_NS}}}"
V = f"{{{VML_NS}}}"
O = f"{{{OFFICE_NS}}}"
WP = f"{{{WP_NS}}}"
PIC = f"{{{PIC_NS}}}"
A = f"{{{A_NS}}}"

WEEK_RE = re.compile(r"^第(\d+)周记录本\.docx$")

ET.register_namespace("w", WORD_NS)
ET.register_namespace("r", OFFICE_REL_NS)
ET.register_namespace("w14", W14_NS)
ET.register_namespace("v", VML_NS)
ET.register_namespace("o", OFFICE_NS)
ET.register_namespace("wp", WP_NS)
ET.register_namespace("pic", PIC_NS)
ET.register_namespace("a", A_NS)
ET.register_namespace("", REL_NS)


class IdAllocator:
    def __init__(self, document: ET.Element) -> None:
        self._para_ids: set[str] = set()
        self._docpr_ids: set[int] = set()
        self._shape_ids: set[int] = set()
        self._next_hex = 1
        self._next_docpr = 1
        self._next_shape = 1
        self._scan(document)

    def _scan(self, root: ET.Element) -> None:
        for element in root.iter():
            para_id = element.attrib.get(f"{W14}paraId")
            if para_id:
                self._para_ids.add(para_id.upper())
            text_id = element.attrib.get(f"{W14}textId")
            if text_id:
                self._para_ids.add(text_id.upper())

            if element.tag == f"{WP}docPr":
                docpr = element.attrib.get("id")
                if docpr and docpr.isdigit():
                    self._docpr_ids.add(int(docpr))
            if element.tag == f"{PIC}cNvPr":
                c_nv_pr = element.attrib.get("id")
                if c_nv_pr and c_nv_pr.isdigit():
                    self._docpr_ids.add(int(c_nv_pr))

            shape_id = element.attrib.get("id")
            if element.tag == V + "shape" and shape_id:
                match = re.match(r"^_x0000_i(\d+)$", shape_id)
                if match:
                    self._shape_ids.add(int(match.group(1)))

        if self._docpr_ids:
            self._next_docpr = max(self._docpr_ids) + 1
        if self._shape_ids:
            self._next_shape = max(self._shape_ids) + 1

    def new_para_id(self) -> str:
        while True:
            value = f"{self._next_hex:08X}"
            self._next_hex += 1
            if value not in self._para_ids:
                self._para_ids.add(value)
                return value

    def new_docpr_id(self) -> str:
        while self._next_docpr in self._docpr_ids:
            self._next_docpr += 1
        value = self._next_docpr
        self._docpr_ids.add(value)
        self._next_docpr += 1
        return str(value)

    def new_shape_id(self) -> str:
        while self._next_shape in self._shape_ids:
            self._next_shape += 1
        value = self._next_shape
        self._shape_ids.add(value)
        self._next_shape += 1
        return f"_x0000_i{value}"


def week_number(path: Path) -> int:
    match = WEEK_RE.match(path.name)
    if not match:
        raise ValueError(path.name)
    return int(match.group(1))


def parse_docx(path: Path) -> tuple[ET.Element, ET.Element, dict[str, bytes], list[tuple[zipfile.ZipInfo, bytes]]]:
    with zipfile.ZipFile(path, "r") as zf:
        document = ET.fromstring(zf.read("word/document.xml"))
        rels = ET.fromstring(zf.read("word/_rels/document.xml.rels"))
        media = {
            name: zf.read(name)
            for name in zf.namelist()
            if name.startswith("word/media/") and not name.endswith("/")
        }
        items = [(item, zf.read(item.filename)) for item in zf.infolist()]
    return document, rels, media, items


def get_body(document: ET.Element) -> ET.Element:
    body = document.find(f"{W}body")
    if body is None:
        raise RuntimeError("document.xml 缺少 w:body")
    return body


def child_index(parent: ET.Element, child: ET.Element) -> int:
    for index, item in enumerate(list(parent)):
        if item is child:
            return index
    raise ValueError("child not found")


def find_first_page_break_paragraph(body: ET.Element) -> ET.Element:
    for paragraph in body.findall(f"{W}p"):
        for br in paragraph.iter(f"{W}br"):
            if br.attrib.get(f"{W}type") == "page":
                return paragraph
    raise RuntimeError("未找到页面分隔段落")


def element_text(element: ET.Element) -> str:
    return "".join(text.text or "" for text in element.iter(f"{W}t"))


def find_week_record_table_index(body: ET.Element) -> int:
    for index, child in enumerate(list(body)):
        if child.tag != f"{W}tbl":
            continue
        text = element_text(child)
        if "周 次" in text or "周次" in text:
            return index
    raise RuntimeError("未找到周记录表格")


def collect_related_payloads(
    elements: list[ET.Element],
    source_rels: ET.Element,
    source_media: dict[str, bytes],
) -> dict[str, tuple[str, str, str | None, bytes | None]]:
    rel_lookup = {
        rel.attrib["Id"]: rel
        for rel in source_rels.findall(f"{REL}Relationship")
        if rel.attrib.get("Id")
    }

    payloads: dict[str, tuple[str, str, str | None, bytes | None]] = {}
    for element in elements:
        for node in element.iter():
            for attr_name in (f"{OFFICE_REL}id", f"{OFFICE_REL}embed", f"{OFFICE_REL}link"):
                old_id = node.attrib.get(attr_name)
                if not old_id or old_id in payloads:
                    continue
                rel = rel_lookup.get(old_id)
                if rel is None:
                    continue
                rel_type = rel.attrib.get("Type", "")
                target = rel.attrib.get("Target", "")
                target_mode = rel.attrib.get("TargetMode")
                media_bytes: bytes | None = None
                if target_mode != "External":
                    zip_name = rel_target_to_zip_name(target)
                    media_bytes = source_media.get(zip_name)
                payloads[old_id] = (rel_type, target, target_mode, media_bytes)
    return payloads


def rel_target_to_zip_name(target: str) -> str:
    if target.startswith("../"):
        return posixpath.normpath(posixpath.join("word", target[3:]))
    return posixpath.normpath(posixpath.join("word", target))


def next_relationship_id(rels: ET.Element, used_ids: set[str]) -> str:
    max_id = 0
    for rel in rels.findall(f"{REL}Relationship"):
        rid = rel.attrib.get("Id", "")
        match = re.match(r"rId(\d+)$", rid)
        if match:
            max_id = max(max_id, int(match.group(1)))

    candidate = max_id + 1
    while f"rId{candidate}" in used_ids:
        candidate += 1
    rid = f"rId{candidate}"
    used_ids.add(rid)
    return rid


def make_media_name(existing: set[str], week_no: int, old_rel_id: str, source_zip_name: str) -> str:
    suffix = Path(source_zip_name).suffix or ".bin"
    safe_rel = re.sub(r"[^0-9A-Za-z]+", "_", old_rel_id)
    candidate = f"word/media/week{week_no:02d}_{safe_rel}{suffix}"
    counter = 2
    while candidate in existing:
        candidate = f"word/media/week{week_no:02d}_{safe_rel}_{counter}{suffix}"
        counter += 1
    existing.add(candidate)
    return candidate


def remap_block_relationships(
    elements: list[ET.Element],
    source_rels: ET.Element,
    source_media: dict[str, bytes],
    target_rels: ET.Element,
    target_media_names: set[str],
    week_no: int,
) -> dict[str, bytes]:
    payloads = collect_related_payloads(elements, source_rels, source_media)
    used_ids = {rel.attrib.get("Id", "") for rel in target_rels.findall(f"{REL}Relationship")}
    id_mapping: dict[str, str] = {}
    new_media: dict[str, bytes] = {}

    for old_id, (rel_type, target, target_mode, media_bytes) in payloads.items():
        new_id = next_relationship_id(target_rels, used_ids)
        new_target = target
        if media_bytes is not None:
            source_zip_name = rel_target_to_zip_name(target)
            new_zip_name = make_media_name(target_media_names, week_no, old_id, source_zip_name)
            new_target = posixpath.relpath(new_zip_name, "word")
            new_media[new_zip_name] = media_bytes

        rel = ET.Element(f"{REL}Relationship")
        rel.set("Id", new_id)
        rel.set("Type", rel_type)
        rel.set("Target", new_target)
        if target_mode is not None:
            rel.set("TargetMode", target_mode)
        target_rels.append(rel)
        id_mapping[old_id] = new_id

    for element in elements:
        for node in element.iter():
            for attr_name in (f"{OFFICE_REL}id", f"{OFFICE_REL}embed", f"{OFFICE_REL}link"):
                old_id = node.attrib.get(attr_name)
                if old_id and old_id in id_mapping:
                    node.set(attr_name, id_mapping[old_id])

    return new_media


def retag_copied_block(elements: list[ET.Element], allocator: IdAllocator) -> None:
    for element in elements:
        for node in element.iter():
            para_id = node.attrib.get(f"{W14}paraId")
            if para_id is not None:
                node.set(f"{W14}paraId", allocator.new_para_id())

            text_id = node.attrib.get(f"{W14}textId")
            if text_id is not None:
                node.set(f"{W14}textId", allocator.new_para_id())

            if node.tag == f"{WP}docPr" and node.attrib.get("id", "").isdigit():
                node.set("id", allocator.new_docpr_id())

            if node.tag == f"{PIC}cNvPr" and node.attrib.get("id", "").isdigit():
                node.set("id", allocator.new_docpr_id())

            if node.tag == V + "shape" and node.attrib.get("id"):
                node.set("id", allocator.new_shape_id())


def write_docx(
    path: Path,
    items: list[tuple[zipfile.ZipInfo, bytes]],
    document_xml: bytes,
    rels_xml: bytes,
    new_media: dict[str, bytes],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
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


def extract_second_page_block(document: ET.Element) -> list[ET.Element]:
    body = get_body(document)
    children = list(body)
    try:
        page_break_p = find_first_page_break_paragraph(body)
        start_index = child_index(body, page_break_p) + 1
    except RuntimeError:
        start_index = find_week_record_table_index(body)
    return [
        copy.deepcopy(child)
        for child in children[start_index:]
        if child.tag != f"{W}sectPr"
    ]


def trim_document_to_first_page(document: ET.Element) -> None:
    body = get_body(document)
    page_break_p = find_first_page_break_paragraph(body)
    page_break_index = child_index(body, page_break_p)
    for child in list(body)[page_break_index + 1 :]:
        if child.tag != f"{W}sectPr":
            body.remove(child)


def merge_weekly_record_book() -> Path:
    week_paths = sorted(
        [path for path in RECORD_DIR.glob("第*周记录本.docx") if WEEK_RE.match(path.name)],
        key=week_number,
    )
    if len(week_paths) != 26:
        raise RuntimeError(f"expected 26 weekly record books, found {len(week_paths)}")

    base_path = RECORD_DIR / "第1周记录本.docx"
    base_document, base_rels, base_media, base_items = parse_docx(base_path)
    trim_document_to_first_page(base_document)
    allocator = IdAllocator(base_document)

    base_body = get_body(base_document)
    separator_template = copy.deepcopy(find_first_page_break_paragraph(base_body))

    # Append each week's second page in order, including week 1.
    for week_path in week_paths:
        document, rels, media, _items = parse_docx(week_path)
        block = extract_second_page_block(document)
        if not block:
            continue

        retag_copied_block(block, allocator)
        new_media = remap_block_relationships(
            block,
            rels,
            media,
            base_rels,
            set(base_media) | set(),
            week_number(week_path),
        )
        base_media.update(new_media)

        for element in block:
            base_body.insert(len(base_body) - 1, element)

        if week_path != week_paths[-1]:
            separator = copy.deepcopy(separator_template)
            retag_copied_block([separator], allocator)
            base_body.insert(len(base_body) - 1, separator)

    document_xml = ET.tostring(base_document, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
    rels_xml = ET.tostring(base_rels, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
    write_docx(OUTPUT_PATH, base_items, document_xml, rels_xml, base_media)
    return OUTPUT_PATH


def main() -> None:
    output = merge_weekly_record_book()
    print(f"merged weekly record book written to {output}")


if __name__ == "__main__":
    main()
