from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from docx import Document


DOCX_PATH = Path("output/Graduation-thesis.docx")
PROMPT_PATH = Path("image/论文新增插图AI生成提示词-无标题版.md")
REPORT_PATH = Path("output/论文新增图片位置修改报告.md")


DOC_REPLACEMENTS = {
    "图 5-3 篡改检测实验闭环示意图": "图 5-7 篡改检测实验闭环示意图",
    "图 5-3 展示了从日志修改到 failed 审计记录和 hash_mismatch 告警生成的闭环过程。":
        "图 5-7 展示了从日志修改到 failed 审计记录和 hash_mismatch 告警生成的闭环过程。",
    "image/fig-5-3-tamper-detection-loop.png": "image/fig-5-7-tamper-detection-loop.png",
}


PROMPT_REPLACEMENTS = {
    "图 5-3 篡改检测实验闭环示意图": "图 5-7 篡改检测实验闭环示意图",
    "图 5-3": "图 5-7",
    "fig-5-3-tamper-detection-loop.png": "fig-5-7-tamper-detection-loop.png",
}


REPORT_REPLACEMENTS = {
    "图 5-3 篡改检测实验闭环示意图": "图 5-7 篡改检测实验闭环示意图",
    "fig-5-3-tamper-detection-loop.png": "fig-5-7-tamper-detection-loop.png",
}


def replace_in_docx() -> int:
    doc = Document(DOCX_PATH)
    changed = 0
    for paragraph in doc.paragraphs:
        old_text = paragraph.text
        new_text = old_text
        for old, new in DOC_REPLACEMENTS.items():
            new_text = new_text.replace(old, new)
        if new_text != old_text:
            paragraph.text = new_text
            changed += 1
    doc.save(DOCX_PATH)
    return changed


def replace_in_text_file(path: Path, replacements: dict[str, str]) -> int:
    if not path.exists():
        return 0
    text = path.read_text(encoding="utf-8")
    old_text = text
    for old, new in replacements.items():
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8")
    return int(text != old_text)


def main() -> None:
    backup = DOCX_PATH.with_name(
        f"{DOCX_PATH.stem}-before-fix-image-numbering-{datetime.now().strftime('%Y%m%d-%H%M%S')}{DOCX_PATH.suffix}"
    )
    shutil.copy2(DOCX_PATH, backup)
    doc_changed = replace_in_docx()
    prompt_changed = replace_in_text_file(PROMPT_PATH, PROMPT_REPLACEMENTS)
    report_changed = replace_in_text_file(REPORT_PATH, REPORT_REPLACEMENTS)
    print(f"backup={backup}")
    print(f"doc_changed={doc_changed}")
    print(f"prompt_changed={prompt_changed}")
    print(f"report_changed={report_changed}")


if __name__ == "__main__":
    main()
