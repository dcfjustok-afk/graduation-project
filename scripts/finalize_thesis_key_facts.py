from __future__ import annotations

from pathlib import Path

from docx import Document


DOCX_PATH = Path("output/Graduation-thesis.docx")


REPLACEMENTS = {
    "本系统在链上读写前增加合约代码存在性校验，通过 Ethers 提供的链上代码读取能力判断目标地址是否存在合约字节码。若返回结果表明地址不存在合约代码，系统不继续执行写入或查询，而是将链上记录视为不可用状态。": "本系统在链上读写前增加合约代码存在性校验，通过 Ethers 的 provider.getCode(address) 判断目标地址是否存在合约字节码。若返回结果表明地址不存在合约代码，系统不继续执行写入或查询，而是将链上记录视为不可用状态。",
    "实验针对 100、500 和 1000 条日志分别执行 5 轮批量审计，三组实验均能完成审计流程，平均耗时分别约为、15659.44 ms 和 ms。": "实验针对 100、500 和 1000 条日志分别执行 5 轮批量审计，三组实验均能完成审计流程，平均耗时分别约为 3067.77 ms、15659.44 ms 和 35032.13 ms。",
}


def main() -> None:
    doc = Document(DOCX_PATH)
    changed = 0
    for paragraph in doc.paragraphs:
        text = paragraph.text
        for old, new in REPLACEMENTS.items():
            if old in text:
                paragraph.text = text.replace(old, new)
                text = paragraph.text
                changed += 1
    doc.save(DOCX_PATH)
    print(f"changed={changed}")


if __name__ == "__main__":
    main()
