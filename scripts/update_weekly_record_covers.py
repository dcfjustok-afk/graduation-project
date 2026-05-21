from __future__ import annotations

import re
import shutil
from pathlib import Path

import win32com.client


RECORD_DIR = Path(__file__).resolve().parents[1] / "doc" / "记录本"
TEMPLATE_NAME = "信息与智能科学学院毕业设计记录本（学生）.docx"
TEMP_TEMPLATE_NAME = "_template_cover_source.doc"


def normalize_cell_text(text: str) -> str:
    return text.replace("\r", "").replace("\x07", "").strip()


def find_record_table(doc):
    for i in range(1, doc.Tables.Count + 1):
        table = doc.Tables(i)
        try:
            row_text = "|".join(
                normalize_cell_text(table.Cell(1, c).Range.Text)
                for c in range(1, min(table.Columns.Count, 6) + 1)
            )
        except Exception:
            continue
        if "周 次" in row_text and "学 生" in row_text and "地 点" in row_text:
            return table
    raise RuntimeError("未找到包含“周 次 / 学 生 / 地 点”的记录表")


def week_number(path: Path) -> int:
    match = re.match(r"^第(\d+)周记录本\.docx$", path.name)
    if not match:
        raise ValueError(path.name)
    return int(match.group(1))


def main() -> None:
    template = RECORD_DIR / TEMPLATE_NAME
    temp_template = RECORD_DIR / TEMP_TEMPLATE_NAME
    shutil.copyfile(template, temp_template)

    week_docs = sorted(
        [p for p in RECORD_DIR.glob("第*周记录本.docx") if re.match(r"^第\d+周记录本\.docx$", p.name)],
        key=week_number,
    )
    if not week_docs:
        raise RuntimeError("没有找到第x周记录本.docx")

    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    try:
        template_doc = word.Documents.Open(str(temp_template), False, True)
        try:
            source_table = find_record_table(template_doc)
            cover_range = template_doc.Range(0, source_table.Range.Start)
            cover_range.Copy()

            for doc_path in week_docs:
                target_doc = word.Documents.Open(str(doc_path), False, False)
                try:
                    target_table = find_record_table(target_doc)
                    target_cover = target_doc.Range(0, target_table.Range.Start)
                    target_cover.Delete()
                    target_doc.Range(0, 0).Paste()
                    target_doc.Save()
                finally:
                    target_doc.Close(False)
        finally:
            template_doc.Close(False)
    finally:
        word.Quit()
        if temp_template.exists():
            temp_template.unlink()

    print(f"updated {len(week_docs)} files")


if __name__ == "__main__":
    main()
