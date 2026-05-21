from __future__ import annotations

import copy
import re
import shutil
import tempfile
import zipfile
from datetime import date, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET


RECORD_DIR = Path(__file__).resolve().parents[1] / "doc" / "记录本"
WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{WORD_NS}}}"
WEEK_RE = re.compile(r"^第(\d+)周记录本\.docx$")
FIRST_FRIDAY = date(2025, 11, 14)


ET.register_namespace("w", WORD_NS)


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
        items = [(item, zf.read(item.filename)) for item in zf.infolist()]
    return document, items


def get_record_table(document: ET.Element) -> ET.Element:
    body = document.find(f"{W}body")
    if body is None:
        raise RuntimeError("缺少 w:body")
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


def replace_tc_pr(target: ET.Element, source: ET.Element) -> None:
    target_pr = target.find(f"{W}tcPr")
    source_pr = source.find(f"{W}tcPr")
    if source_pr is None:
        return
    if target_pr is not None:
        index = list(target).index(target_pr)
        target.remove(target_pr)
        target.insert(index, copy.deepcopy(source_pr))
    else:
        target.insert(0, copy.deepcopy(source_pr))


def clear_keep_first_paragraph_style_and_set_text(cell: ET.Element, source_cell: ET.Element, value: str) -> None:
    source_paragraphs = source_cell.findall(f"{W}p")
    source_paragraph = source_paragraphs[0] if source_paragraphs else None
    source_run = source_paragraph.find(f"{W}r") if source_paragraph is not None else None

    paragraphs = cell.findall(f"{W}p")
    if paragraphs:
        paragraph = paragraphs[0]
        for extra in paragraphs[1:]:
            cell.remove(extra)
    else:
        paragraph = ET.SubElement(cell, f"{W}p")

    old_ppr = paragraph.find(f"{W}pPr")
    if old_ppr is not None:
        paragraph.remove(old_ppr)
    if source_paragraph is not None and source_paragraph.find(f"{W}pPr") is not None:
        paragraph.insert(0, copy.deepcopy(source_paragraph.find(f"{W}pPr")))

    for child in list(paragraph):
        if child.tag != f"{W}pPr":
            paragraph.remove(child)

    run = ET.SubElement(paragraph, f"{W}r")
    if source_run is not None and source_run.find(f"{W}rPr") is not None:
        run.append(copy.deepcopy(source_run.find(f"{W}rPr")))
    text = ET.SubElement(run, f"{W}t")
    text.text = value


def replace_cell_contents_with_source(cell: ET.Element, source_cell: ET.Element) -> None:
    replace_tc_pr(cell, source_cell)
    for child in list(cell):
        if child.tag != f"{W}tcPr":
            cell.remove(child)
    source_children = [child for child in list(source_cell) if child.tag != f"{W}tcPr"]
    for child in source_children:
        cell.append(copy.deepcopy(child))


def write_docx(path: Path, items, document_xml: bytes) -> None:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".docx", dir=path.parent) as tmp:
        temp_path = Path(tmp.name)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item, data in items:
                if item.filename == "word/document.xml":
                    data = document_xml
                zout.writestr(item, data)
        shutil.move(str(temp_path), path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def main() -> None:
    source_document, _ = parse_docx(RECORD_DIR / "第1周记录本.docx")
    source_table = get_record_table(source_document)
    source_last_cells = source_table.findall(f"{W}tr")[-1].findall(f"{W}tc")
    source_date_label = source_last_cells[2]
    source_date_value = source_last_cells[3]

    targets = sorted(
        [p for p in RECORD_DIR.glob("第*周记录本.docx") if WEEK_RE.match(p.name)],
        key=week_number,
    )

    updated = 0
    for path in targets:
        week = week_number(path)
        document, items = parse_docx(path)
        table = get_record_table(document)
        last_cells = table.findall(f"{W}tr")[-1].findall(f"{W}tc")

        replace_cell_contents_with_source(last_cells[2], source_date_label)
        friday = FIRST_FRIDAY + timedelta(days=7 * (week - 1))
        date_text = f"{friday.year}.{friday.month:02d}.{friday.day:02d}"
        replace_tc_pr(last_cells[3], source_date_value)
        clear_keep_first_paragraph_style_and_set_text(last_cells[3], source_date_value, date_text)

        document_xml = ET.tostring(document, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
        write_docx(path, items, document_xml)
        updated += 1

    print(f"updated {updated} files")


if __name__ == "__main__":
    main()
