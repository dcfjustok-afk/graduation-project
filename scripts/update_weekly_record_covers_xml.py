from __future__ import annotations

import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import win32com.client


RECORD_DIR = Path(__file__).resolve().parents[1] / "doc" / "记录本"
TEMPLATE_NAME = "信息与智能科学学院毕业设计记录本（学生）.docx"
TEMP_DOC_NAME = "_template_cover_source_for_xml.doc"
TEMP_DOCX_NAME = "_template_cover_source_for_xml.docx"
WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{WORD_NS}}}"


def ns_attr(name: str) -> str:
    return f"{W}{name}"


def text_of(element: ET.Element) -> str:
    return "".join(t.text or "" for t in element.iter(f"{W}t"))


def is_record_table(element: ET.Element) -> bool:
    if element.tag != f"{W}tbl":
        return False
    rows = element.findall(f"{W}tr")
    if not rows:
        return False
    row_text = text_of(rows[0])
    return "周 次" in row_text and "学 生" in row_text and "地 点" in row_text


def find_record_table_index(body: ET.Element) -> int:
    children = list(body)
    for index, child in enumerate(children):
        if is_record_table(child):
            return index
    raise RuntimeError("未找到包含“周 次 / 学 生 / 地 点”的记录表")


def convert_template_to_docx() -> Path:
    source = RECORD_DIR / TEMPLATE_NAME
    temp_doc = RECORD_DIR / TEMP_DOC_NAME
    temp_docx = RECORD_DIR / TEMP_DOCX_NAME
    for p in (temp_doc, temp_docx):
        if p.exists():
            p.unlink()
    shutil.copyfile(source, temp_doc)

    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    try:
        doc = word.Documents.Open(str(temp_doc), False, False)
        try:
            doc.SaveAs2(str(temp_docx), FileFormat=16)
        finally:
            doc.Close(False)
    finally:
        word.Quit()
        if temp_doc.exists():
            temp_doc.unlink()
    return temp_docx


def read_document_xml(docx_path: Path) -> bytes:
    with zipfile.ZipFile(docx_path, "r") as zf:
        return zf.read("word/document.xml")


def write_document_xml(docx_path: Path, document_xml: bytes) -> None:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
        tmp_path = Path(tmp.name)
    try:
        with zipfile.ZipFile(docx_path, "r") as zin, zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = document_xml if item.filename == "word/document.xml" else zin.read(item.filename)
                zout.writestr(item, data)
        shutil.move(str(tmp_path), docx_path)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def get_cover_children(template_docx: Path) -> list[ET.Element]:
    ET.register_namespace("w", WORD_NS)
    root = ET.fromstring(read_document_xml(template_docx))
    body = root.find(f"{W}body")
    if body is None:
        raise RuntimeError("模板 document.xml 缺少 w:body")
    idx = find_record_table_index(body)
    return [ET.fromstring(ET.tostring(child, encoding="utf-8")) for child in list(body)[:idx]]


def update_cover(docx_path: Path, cover_children: list[ET.Element]) -> None:
    ET.register_namespace("w", WORD_NS)
    root = ET.fromstring(read_document_xml(docx_path))
    body = root.find(f"{W}body")
    if body is None:
        raise RuntimeError(f"{docx_path.name}: document.xml 缺少 w:body")
    children = list(body)
    idx = find_record_table_index(body)
    tail = children[idx:]

    for child in children:
        body.remove(child)
    for child in cover_children:
        body.append(ET.fromstring(ET.tostring(child, encoding="utf-8")))
    for child in tail:
        body.append(child)

    xml = ET.tostring(root, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
    write_document_xml(docx_path, xml)


def week_number(path: Path) -> int:
    match = re.match(r"^第(\d+)周记录本\.docx$", path.name)
    if not match:
        raise ValueError(path.name)
    return int(match.group(1))


def main() -> None:
    template_docx = convert_template_to_docx()
    try:
        cover_children = get_cover_children(template_docx)
        week_docs = sorted(
            [p for p in RECORD_DIR.glob("第*周记录本.docx") if re.match(r"^第\d+周记录本\.docx$", p.name)],
            key=week_number,
        )
        for path in week_docs:
            update_cover(path, cover_children)
        print(f"updated {len(week_docs)} files")
    finally:
        if template_docx.exists():
            template_docx.unlink()


if __name__ == "__main__":
    main()
