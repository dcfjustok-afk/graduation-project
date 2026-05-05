from __future__ import annotations

from pathlib import Path

from docx import Document


DOCX_PATH = Path("output/Graduation-thesis.docx")


CHINESE_ABSTRACT = (
    "随着信息系统在业务处理和自动化任务中的广泛应用，日志数据已成为安全审计、故障排查和责任追溯的重要依据。针对传统中心化日志易被篡改、删除或伪造，审计结果缺少可信依据的问题，本文设计并实现了一种基于区块链的可信任务日志审计系统。系统采用“链下保存日志原文、链上保存日志哈希摘要”的混合存储模型，由 Agent 完成日志增量采集，Server 负责日志入库、SHA-256 哈希计算和 LogRegistry 智能合约调用，SQLite 保存日志、存证、审计和告警记录，Web 前端展示日志、审计和告警结果。审计阶段，系统重新计算日志原文得到 actualHash，并与数据库中的 expectedHash、链上的 onChainHash 进行三方比对；当哈希不一致时，生成 failed 审计记录和 hash_mismatch 告警。实验结果表明，LogRegistry 合约测试 8 项全部通过；日志批量提交 100 次成功率为 100%，平均响应时间约 107.03 ms，吞吐量约 9.33 条/秒；系统能够识别日志篡改并生成告警。"
)


ENGLISH_ABSTRACT = (
    "With the widespread use of information systems in automated tasks and business operations, log data has become an important basis for security auditing, fault diagnosis, and responsibility tracing. To address the problem that centralized logs may be tampered with, deleted, or forged without reliable audit evidence, this thesis designs and implements a blockchain-based trusted task log auditing system. The system adopts a hybrid model in which original logs are stored off-chain and log hash digests are stored on-chain. The Agent performs incremental log collection, the Server stores logs in SQLite, calculates SHA-256 hashes, and writes evidence to the LogRegistry smart contract, while the Web frontend displays logs, audit records, and alerts. During auditing, actualHash is recalculated from the log content and compared with expectedHash in the database and onChainHash from the smart contract. If the hashes are inconsistent, a failed audit record and a hash_mismatch alert are generated. Experimental results show that all 8 contract tests passed, 100 batch log submissions achieved a 100% success rate with an average response time of about 107.03 ms and a throughput of about 9.33 records per second, and the system can detect log tampering and generate alerts."
)


SECTION_REPLACEMENTS = {
    "3.4.3 合约代码存在性校验机制": [
        "在本地 Hardhat 链和多次部署场景中，合约地址的有效性会直接影响审计结果。若本地链重启，原合约地址可能不再存在字节码；若系统仍按照旧地址执行写入或查询，可能造成空地址误判，使实验结果缺少可靠依据。因此，系统在链上读写前增加合约代码存在性校验，将地址有效性检查作为链上交互的前置步骤。",
        "具体而言，系统通过 Ethers 的 provider.getCode(address) 读取目标地址上的合约字节码。若返回结果表明该地址不存在合约代码，系统不继续执行写入或查询，而是将相关链上记录视为不可用状态，并在审计中进入 pending 或异常说明流程。该机制能够避免本地链重启后仍使用历史地址造成误判，也使合约部署状态与审计结果之间的关系更加清晰。",
        "合约代码存在性校验并不改变 LogRegistry 的业务逻辑，而是增强链上交互的健壮性。通过在写入和读取前确认目标地址确实部署了合约，系统能够降低错误配置、链重启和地址失效对实验结果的影响，从而提高可信日志审计闭环的可复现性和说明力。",
    ],
    "5.6.2 批量审计性能实验": [
        "批量审计性能实验用于观察系统在不同数据规模下执行审计任务的耗时情况。审计过程需要读取 logs 表中的日志原文，重新计算 actualHash，读取 log_hash_records 中的 expectedHash，并根据 taskId 和合约地址查询链上 onChainHash，最后完成三方比对并写入 audit_records。实验分别针对 100 条、500 条和 1000 条数据集执行批量审计，每个规模重复 5 轮，5 轮均全部成功。实验结果显示，100 条数据集平均耗时约为 3067.77 ms，500 条数据集平均耗时约为 15659.44 ms，1000 条数据集平均耗时约为 35032.13 ms。",
        "从结果分析看，批量审计耗时由数据库读取、哈希重算、链上记录查询、比对判断和审计结果写入共同构成。随着审计数据规模从 100 条增加到 1000 条，总耗时同步上升，说明当前原型系统仍存在批量审计优化空间。但三组数据 5 轮均执行成功，表明系统在实验规模下能够稳定完成审计闭环。",
    ],
}


def non_empty_paragraphs(doc: Document):
    return [(idx, p) for idx, p in enumerate(doc.paragraphs) if p.text.strip()]


def set_after_heading(doc: Document, heading: str, replacement: list[str]) -> None:
    entries = non_empty_paragraphs(doc)
    start_pos = None
    for pos, (_idx, paragraph) in enumerate(entries):
        if paragraph.text.strip() == heading:
            start_pos = pos
            break
    if start_pos is None:
        raise ValueError(f"heading not found: {heading}")

    body_positions: list[int] = []
    for pos in range(start_pos + 1, len(entries)):
        text = entries[pos][1].text.strip()
        if is_heading(text):
            break
        body_positions.append(pos)

    if not body_positions:
        raise ValueError(f"section has no body: {heading}")

    for offset, pos in enumerate(body_positions):
        paragraph = entries[pos][1]
        if offset < len(replacement):
            paragraph.text = replacement[offset]
        else:
            remove_paragraph(paragraph)


def is_heading(text: str) -> bool:
    text = text.strip()
    if text in {"摘要", "Abstract", "致谢", "参考文献"}:
        return True
    if text.startswith("关键词：") or text.startswith("Keywords:"):
        return True
    if text.startswith("第 ") and "章" in text:
        return True
    parts = text.split(maxsplit=1)
    if not parts:
        return False
    marker = parts[0]
    return marker.count(".") >= 1 and all(part.isdigit() for part in marker.split("."))


def remove_paragraph(paragraph) -> None:
    element = paragraph._element
    parent = element.getparent()
    if parent is not None:
        parent.remove(element)
    paragraph._p = paragraph._element = None


def main() -> None:
    doc = Document(DOCX_PATH)

    set_after_heading(doc, "摘要", [CHINESE_ABSTRACT])
    set_after_heading(doc, "Abstract", [ENGLISH_ABSTRACT])

    for heading, replacement in SECTION_REPLACEMENTS.items():
        set_after_heading(doc, heading, replacement)

    doc.save(DOCX_PATH)
    print(f"repaired={DOCX_PATH}")


if __name__ == "__main__":
    main()
