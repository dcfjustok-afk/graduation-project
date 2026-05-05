from __future__ import annotations

import re
import shutil
from datetime import datetime
from pathlib import Path

from docx import Document


DOCX_PATH = Path("output/Graduation-thesis.docx")

NEW_CN_ABSTRACT = (
    "随着信息系统在业务处理、自动化运维和任务执行场景中的应用增多，日志数据已成为审计和"
    "追溯的重要依据。传统中心化日志将原文、哈希记录和审计结果保存在同一管理域内，"
    "被篡改、删除或伪造后，后续校验缺少独立可信证据。针对该问题，本文设计并实现基于区块链的"
    "可信任务日志审计系统。系统采用链下保存原文、链上保存哈希摘要的混合存储模型，由 Agent 增量"
    "采集日志，Server 完成 SQLite 入库、SHA-256 哈希计算和 LogRegistry 合约写入，Web 前端展示日志、审计"
    "与告警结果。审计阶段重新计算 actualHash，并与 expectedHash、onChainHash 三方比对；哈希不一致"
    "时生成 failed 记录和 hash_mismatch 告警。引入合约代码存在性校验和历史合约地址回溯，减少本地"
    "链重启和多次部署造成的误判。实验表明，LogRegistry 合约 8 项测试全部通过；100 次批量提交成功率"
    "为 100%，平均响应时间 107.03 ms，吞吐量约 9.33 条/秒；"
    "100、500、1000 条批量审计 5 轮均成功；篡改检测能识别日志内容被修改并生成告警。"
)

NEW_EN_ABSTRACT = (
    "With the increasing use of information systems in business processing, automated operation and maintenance, "
    "and task execution, log data has become an important basis for security auditing, fault diagnosis, and "
    "responsibility tracing. In traditional centralized log management, original logs, hash records, and audit "
    "results are usually stored within the same management domain. Once logs are tampered with, deleted, or forged, "
    "later verification lacks independent and reliable evidence. To address this problem, this thesis designs and "
    "implements a blockchain-based trusted task log auditing system. The system adopts a hybrid storage model in "
    "which original logs are stored off-chain and log hash digests are stored on-chain. The Agent performs "
    "incremental log collection, the Server stores logs in SQLite, calculates SHA-256 hashes, and calls the "
    "LogRegistry smart contract, while the Web frontend displays logs, audit results, and alert information. During "
    "auditing, actualHash is recalculated from the current log content and compared with expectedHash stored in the "
    "database and onChainHash queried from the smart contract. If the hashes are inconsistent, a failed audit record "
    "and a hash_mismatch alert are generated. The system also introduces contract code existence verification and "
    "historical contract address tracing to reduce misjudgment caused by local chain restarts and repeated contract "
    "deployments. Experimental results show that all 8 LogRegistry contract tests passed. In 100 batch log "
    "submissions, the success rate was 100%, the average response time was about 107.03 ms, and the throughput was "
    "about 9.33 records per second. Batch audits for 100, 500, and 1000 records were successfully completed in five "
    "rounds, and the tamper detection experiment showed that modified log content could be identified and an alert "
    "could be generated."
)


def main() -> None:
    if not DOCX_PATH.exists():
        raise FileNotFoundError(DOCX_PATH)

    backup = DOCX_PATH.with_name(
        f"{DOCX_PATH.stem}-before-frontmatter-pass3-{datetime.now().strftime('%Y%m%d-%H%M%S')}{DOCX_PATH.suffix}"
    )
    shutil.copy2(DOCX_PATH, backup)

    doc = Document(DOCX_PATH)
    paragraphs = [p for p in doc.paragraphs if p.text.strip()]
    paragraphs[1].text = NEW_CN_ABSTRACT
    paragraphs[4].text = NEW_EN_ABSTRACT
    doc.save(DOCX_PATH)

    en_words = re.findall(r"[A-Za-z]+(?:[-'][A-Za-z]+)?", NEW_EN_ABSTRACT)
    print(f"backup={backup}")
    print(f"cn_abstract_chars={len(NEW_CN_ABSTRACT)}")
    print(f"en_abstract_words={len(en_words)}")


if __name__ == "__main__":
    main()
