from __future__ import annotations

import copy
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


RECORD_DIR = Path(__file__).resolve().parents[1] / "doc" / "记录本"
WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{WORD_NS}}}"
WEEK_RE = re.compile(r"^第(\d+)周记录本\.docx$")


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


def get_tc_pr(cell: ET.Element) -> ET.Element:
    tc_pr = cell.find(f"{W}tcPr")
    if tc_pr is None:
        tc_pr = ET.Element(f"{W}tcPr")
        cell.insert(0, tc_pr)
    return tc_pr


def replace_tc_pr_except_text_sensitive(target: ET.Element, source: ET.Element) -> None:
    target_pr = get_tc_pr(target)
    source_pr = source.find(f"{W}tcPr")
    if source_pr is None:
        return
    parent = target
    index = list(parent).index(target_pr)
    parent.remove(target_pr)
    parent.insert(index, copy.deepcopy(source_pr))


def ensure_paragraph_jc(paragraph: ET.Element, value: str) -> None:
    p_pr = paragraph.find(f"{W}pPr")
    if p_pr is None:
        p_pr = ET.Element(f"{W}pPr")
        paragraph.insert(0, p_pr)
    jc = p_pr.find(f"{W}jc")
    if jc is None:
        jc = ET.Element(f"{W}jc")
        p_pr.append(jc)
    jc.set(f"{W}val", value)


def ensure_run_size(run: ET.Element, value: str) -> None:
    r_pr = run.find(f"{W}rPr")
    if r_pr is None:
        r_pr = ET.Element(f"{W}rPr")
        run.insert(0, r_pr)
    for tag in ("sz", "szCs"):
        el = r_pr.find(f"{W}{tag}")
        if el is None:
            el = ET.Element(f"{W}{tag}")
            r_pr.append(el)
        el.set(f"{W}val", value)


def replace_run_properties(target_run: ET.Element, source_run: ET.Element) -> None:
    target_rpr = target_run.find(f"{W}rPr")
    source_rpr = source_run.find(f"{W}rPr")
    if source_rpr is None:
        return
    if target_rpr is not None:
        target_run.remove(target_rpr)
    target_run.insert(0, copy.deepcopy(source_rpr))


def replace_paragraph_properties(target_paragraph: ET.Element, source_paragraph: ET.Element) -> None:
    target_ppr = target_paragraph.find(f"{W}pPr")
    source_ppr = source_paragraph.find(f"{W}pPr")
    if source_ppr is None:
        return
    if target_ppr is not None:
        target_paragraph.remove(target_ppr)
    target_paragraph.insert(0, copy.deepcopy(source_ppr))


def apply_source_paragraph_style_to_cell(target_cell: ET.Element, source_cell: ET.Element) -> None:
    source_paragraphs = source_cell.findall(f"{W}p")
    target_paragraphs = target_cell.findall(f"{W}p")
    if not source_paragraphs:
        return

    for idx, paragraph in enumerate(target_paragraphs):
        source_paragraph = source_paragraphs[min(idx, len(source_paragraphs) - 1)]
        replace_paragraph_properties(paragraph, source_paragraph)

        source_runs = source_paragraph.findall(f"{W}r")
        source_run = source_runs[0] if source_runs else None
        if source_run is None:
            continue
        for run in paragraph.findall(f"{W}r"):
            replace_run_properties(run, source_run)


def ensure_paragraph_default_size(paragraph: ET.Element, value: str) -> None:
    p_pr = paragraph.find(f"{W}pPr")
    if p_pr is None:
        p_pr = ET.Element(f"{W}pPr")
        paragraph.insert(0, p_pr)
    r_pr = p_pr.find(f"{W}rPr")
    if r_pr is None:
        r_pr = ET.Element(f"{W}rPr")
        p_pr.append(r_pr)
    for tag in ("sz", "szCs"):
        el = r_pr.find(f"{W}{tag}")
        if el is None:
            el = ET.Element(f"{W}{tag}")
            r_pr.append(el)
        el.set(f"{W}val", value)


def sync_location_cells(source_rows, target_rows) -> None:
    source_cells = source_rows[0].findall(f"{W}tc")
    target_cells = target_rows[0].findall(f"{W}tc")
    for idx in (4, 5):
        replace_tc_pr_except_text_sensitive(target_cells[idx], source_cells[idx])
        apply_source_paragraph_style_to_cell(target_cells[idx], source_cells[idx])


def sync_next_task_row(source_rows, target_rows) -> None:
    source_cells = source_rows[2].findall(f"{W}tc")
    target_cells = target_rows[2].findall(f"{W}tc")
    for idx in (0, 1):
        replace_tc_pr_except_text_sensitive(target_cells[idx], source_cells[idx])
        apply_source_paragraph_style_to_cell(target_cells[idx], source_cells[idx])


def sync_previous_task_row(source_rows, target_rows) -> None:
    source_cells = source_rows[1].findall(f"{W}tc")
    target_cells = target_rows[1].findall(f"{W}tc")
    for idx in (0, 1):
        replace_tc_pr_except_text_sensitive(target_cells[idx], source_cells[idx])
        apply_source_paragraph_style_to_cell(target_cells[idx], source_cells[idx])


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
    source_rows = source_table.findall(f"{W}tr")

    targets = sorted(
        [p for p in RECORD_DIR.glob("第*周记录本.docx") if WEEK_RE.match(p.name) and week_number(p) != 1],
        key=week_number,
    )
    updated = 0
    for path in targets:
        document, items = parse_docx(path)
        table = get_record_table(document)
        rows = table.findall(f"{W}tr")
        sync_location_cells(source_rows, rows)
        sync_previous_task_row(source_rows, rows)
        sync_next_task_row(source_rows, rows)
        document_xml = ET.tostring(document, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
        write_docx(path, items, document_xml)
        updated += 1
    print(f"updated {updated} files")


if __name__ == "__main__":
    main()
