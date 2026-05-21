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


def set_grid_widths(table: ET.Element, widths: list[str]) -> None:
    grid = table.find(f"{W}tblGrid")
    if grid is None:
        grid = ET.Element(f"{W}tblGrid")
        table.insert(1, grid)
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = ET.SubElement(grid, f"{W}gridCol")
        col.set(f"{W}w", width)


def set_tc_width(cell: ET.Element, width: str) -> None:
    pr = cell.find(f"{W}tcPr")
    if pr is None:
        pr = ET.Element(f"{W}tcPr")
        cell.insert(0, pr)
    tcw = pr.find(f"{W}tcW")
    if tcw is None:
        tcw = ET.Element(f"{W}tcW")
        pr.insert(0, tcw)
    tcw.set(f"{W}w", width)
    tcw.set(f"{W}type", "dxa")


def ensure_no_wrap(run: ET.Element) -> None:
    rpr = run.find(f"{W}rPr")
    if rpr is None:
        rpr = ET.Element(f"{W}rPr")
        run.insert(0, rpr)
    if rpr.find(f"{W}noProof") is None:
        rpr.append(ET.Element(f"{W}noProof"))
    if rpr.find(f"{W}noWrap") is None:
        rpr.append(ET.Element(f"{W}noWrap"))


def fix_document(document: ET.Element, source_grid: list[str], source_widths: list[str]) -> None:
    table = get_record_table(document)
    set_grid_widths(table, source_grid)
    last_cells = table.findall(f"{W}tr")[-1].findall(f"{W}tc")
    # Keep the same cell widths as week 1 after the user's manual adjustment.
    for cell, width in zip(last_cells, source_widths):
        set_tc_width(cell, width)

    # Date value cell. Ensure the run cannot wrap in Word/WPS.
    date_cell = last_cells[3]
    for run in date_cell.iter(f"{W}r"):
        ensure_no_wrap(run)
    for text in date_cell.iter(f"{W}t"):
        text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


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
    source_grid = [col.get(f"{W}w", "0") for col in source_table.find(f"{W}tblGrid").findall(f"{W}gridCol")]
    source_widths = []
    for cell in source_table.findall(f"{W}tr")[-1].findall(f"{W}tc"):
        pr = cell.find(f"{W}tcPr")
        tcw = pr.find(f"{W}tcW") if pr is not None else None
        source_widths.append(tcw.get(f"{W}w", "0") if tcw is not None else "0")

    targets = sorted(
        [p for p in RECORD_DIR.glob("第*周记录本.docx") if WEEK_RE.match(p.name)],
        key=week_number,
    )
    updated = 0
    skipped: list[str] = []
    for path in targets:
        try:
            document, items = parse_docx(path)
            fix_document(document, source_grid, source_widths)
            document_xml = ET.tostring(document, encoding="utf-8", xml_declaration=True, short_empty_elements=True)
            write_docx(path, items, document_xml)
            updated += 1
        except PermissionError:
            skipped.append(path.name)

    print(f"updated {updated} files")
    if skipped:
        print("skipped locked files:")
        for item in skipped:
            print(item)


if __name__ == "__main__":
    main()
