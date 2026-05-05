from __future__ import annotations

from pathlib import Path

from docx import Document


DOCX_PATH = Path("output/Graduation-thesis.docx")
OUT_PATH = Path("output/thesis-current-text-for-polish.md")


def main() -> None:
    doc = Document(DOCX_PATH)
    lines: list[str] = []
    for index, paragraph in enumerate(doc.paragraphs, start=1):
        text = paragraph.text.strip()
        if not text:
            if paragraph._element.xpath(".//w:drawing") or paragraph._element.xpath(".//w:pict"):
                lines.append(f"[{index:03d}] <图片段落>")
            continue
        lines.append(f"[{index:03d}] {text}")
    OUT_PATH.write_text("\n\n".join(lines), encoding="utf-8")
    print(OUT_PATH.as_posix())


if __name__ == "__main__":
    main()
