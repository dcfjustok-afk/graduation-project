from __future__ import annotations

from pathlib import Path

from docx import Document


DOCX_PATH = Path("output/Graduation-thesis.docx")


STANDALONE_CAPTIONS_TO_REMOVE = {
    "图 5-1 系统总览页面截图",
    "图 5-2 审计管理与告警管理页面截图",
}


INLINE_REPLACEMENTS = {
    "。图 3-3 三方哈希比对流程": "。",
    "。图 4-1 系统总体架构图": "。",
}


def delete_paragraph(paragraph) -> None:
    element = paragraph._element
    parent = element.getparent()
    if parent is not None:
        parent.remove(element)
    paragraph._p = paragraph._element = None


def main() -> None:
    doc = Document(DOCX_PATH)
    removed = 0
    replaced = 0

    for paragraph in list(doc.paragraphs):
        text = paragraph.text.strip()
        if text in STANDALONE_CAPTIONS_TO_REMOVE:
            delete_paragraph(paragraph)
            removed += 1
            continue
        new_text = paragraph.text
        for old, new in INLINE_REPLACEMENTS.items():
            if old in new_text:
                new_text = new_text.replace(old, new)
                replaced += 1
        if new_text != paragraph.text:
            paragraph.text = new_text

    doc.save(DOCX_PATH)
    print(f"removed={removed}")
    print(f"replaced={replaced}")


if __name__ == "__main__":
    main()
