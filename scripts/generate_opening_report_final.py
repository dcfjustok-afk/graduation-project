from __future__ import annotations

from pathlib import Path

from generate_rewritten_graduation_docs import paragraph, page_break, table, write_docx


ROOT = Path(__file__).resolve().parents[1]
DOC_DIR = ROOT / "doc"


REFERENCES = [
    "KENT K, SOUPPAYAM P. Guide to computer security log management[R]. Gaithersburg: National Institute of Standards and Technology, 2006. DOI: 10.6028/NIST.SP.800-92.",
    "韩菊茹, 纪兆轩, 李一鸣, 等. 基于区块链的可信日志存储与验证系统[J]. 计算机工程, 2019, 45(5): 13-17.",
    "袁勇, 王飞跃. 区块链技术发展现状与展望[J]. 自动化学报, 2016, 42(4): 481-494.",
    "钱卫宁, 邵奇峰, 朱燕超, 等. 区块链与可信数据管理: 问题与方法[J]. 软件学报, 2018, 29(1): 150-159.",
    "刘敖迪, 杜学绘, 王娜, 等. 区块链技术及其在信息安全领域的研究进展[J]. 软件学报, 2018, 29(7): 2092-2115.",
    "YAGA D, MELL P, ROBY N, et al. Blockchain technology overview[R]. Gaithersburg: National Institute of Standards and Technology, 2018. DOI: 10.6028/NIST.IR.8202.",
    "LEMIEUX V L. Trusting records: is Blockchain technology the answer?[J]. Records Management Journal, 2016, 26(2): 110-139.",
    "LIANG X, SHETTY S, TOSH D, et al. ProvChain: a blockchain-based data provenance architecture in cloud environment with enhanced privacy and availability[C]//2017 17th IEEE/ACM International Symposium on Cluster, Cloud and Grid Computing. Piscataway: IEEE, 2017: 468-477.",
    "吕建富, 赖英旭, 刘静. 基于链上链下相结合的日志安全存储与检索[J]. 计算机科学, 2020, 47(3): 298-303.",
    "SCHNEIER B, KELSEY J. Secure audit logs to support computer forensics[J]. ACM Transactions on Information and System Security, 1999, 2(2): 159-176.",
    "SHEKHTMAN L, WAISBARD E. EngraveChain: a blockchain-based tamper-proof distributed log system[J]. Future Internet, 2021, 13(6): 143.",
    "OpenZeppelin. Access Control: OpenZeppelin Contracts 5.x[EB/OL]. [2026-05-06]. https://docs.openzeppelin.com/contracts/5.x/access-control.",
]


SECTIONS = [
    (
        "1、背景介绍",
        [
            "随着政务服务、企业管理、自动化运维和任务调度系统的广泛应用，信息系统在运行过程中会持续产生大量任务日志。日志记录了任务标识、执行时间、来源路径、日志级别、执行结果、异常错误和操作状态等关键内容，是系统安全审计、故障排查、责任追溯和运行分析的重要依据。当系统发生异常或安全事件时，日志往往是还原执行过程、定位问题来源和判断责任边界的基础材料。",
            "传统日志管理方式通常将日志原文保存在服务器文件系统、数据库或集中日志平台中。该方式部署简单、查询方便，也便于与业务系统集成，但在可信审计场景下存在明显不足：日志原文、哈希记录和审计结果往往处于同一管理域内，一旦管理权限被滥用、数据库被攻击或内部人员试图掩盖异常操作，日志内容可能被修改、删除或伪造，事后难以提供独立可信证据证明日志是否保持原始状态。",
            "区块链具有记录可追溯、历史数据难以篡改和交易可验证等特点，为构建可信日志存证机制提供了新的技术路径。对于任务日志场景而言，直接将完整日志写入区块链会带来较高存储成本和隐私暴露风险，因此更适合采用“链下保存日志原文、链上保存哈希摘要”的混合存储方式。审计时，系统重新计算链下日志哈希，并与数据库保存的期望哈希以及链上合约记录进行比对，从而判断日志内容是否被篡改。本课题据此设计并实现基于区块链的可信任务日志审计系统。",
        ],
    ),
    (
        "2、研究现状",
        [
            "现有日志审计研究主要围绕日志集中采集、统一检索、异常检测、审计追溯和安全存储展开。集中式日志平台能够提升查询效率和运维可观察性，但在日志完整性证明方面仍然依赖中心化数据库或平台自身的可信性。为了增强日志防篡改能力，相关研究引入哈希链、数字签名、安全时间戳和访问控制等机制，使日志修改更容易被发现。",
            "区块链存证研究为可信日志审计提供了新的方向。区块链不适合保存大量原始日志，但适合保存日志摘要、业务标识、提交时间和提交者等证据信息。链上记录可作为链下日志的独立证明源，后续审计时只需重新计算日志哈希并与链上记录比对，即可判断链下数据是否与存证时一致。国内外已有研究探讨了基于区块链的日志存储、数据溯源、数字取证和云数据审计等方向。",
            "从工程实现角度看，现有方案仍存在若干可改进之处。第一，部分方案更偏重理论模型，缺少可运行的采集、存储、上链、审计、告警和展示闭环。第二，日志采集端常被简化为手工提交，缺少增量读取、偏移量保存和失败重试能力。第三，审计判断通常只比较链下哈希与链上哈希，未充分区分当前日志内容、数据库存证记录和链上证据之间的关系。第四，实验验证和前端展示不足，难以直观说明系统在日志批量提交、批量审计和篡改检测场景下的表现。因此，本课题拟在已有研究基础上完成一个面向毕业设计场景的轻量化可信日志审计原型系统。",
        ],
    ),
    (
        "3、课题研究内容",
        [
            "3.1 可信日志存证模型设计。研究任务日志在存储成本、隐私保护和可信审计方面的需求，设计链下日志原文与链上哈希摘要相结合的混合存储模型。日志原文保存在 SQLite 数据库中，日志哈希、任务标识、写入时间和提交者保存在 LogRegistry 智能合约中，使链上记录成为独立于数据库的审计依据。",
            "3.2 三方哈希比对审计机制设计。系统在日志提交阶段计算 expectedHash 并保存到 log_hash_records 表，同时将哈希写入链上；审计阶段重新读取 logs 表中的 log_content 计算 actualHash，再结合链上 onChainHash 进行比对。三方一致时审计状态为 passed，哈希不一致时为 failed，链上记录缺失或合约不可用时为 pending，并在 failed 场景下生成异常告警。",
            "3.3 系统工程实现。系统采用 Monorepo 组织，包含 apps/agent、apps/server、apps/web、packages/contracts 和 packages/shared 等模块。Agent 负责日志增量采集和状态同步；Server 负责日志接收、哈希计算、数据库读写、合约交互、审计执行和告警生成；LogRegistry 负责链上存证；Web 前端负责展示系统总览、日志中心、审计管理和告警管理。",
            "3.4 测试与实验验证。围绕可信审计闭环设计合约测试、后端 API 回归、Agent 采集验证、前端构建验证、日志批量提交实验、批量审计实验和篡改检测实验。通过这些实验验证系统是否能够稳定完成日志存证、审计判断和异常告警。",
        ],
    ),
    (
        "4、技术路线",
        [
            "4.1 理论调研与机制设计。首先调研日志审计、哈希完整性校验、区块链存证、智能合约访问控制和前后端分离系统开发等相关资料；随后根据任务日志场景设计链上链下混合存储模型、三方哈希比对机制、数据库表结构和系统总体架构。",
            "4.2 区块链与后端实现。基于 Hardhat 搭建本地区块链环境，使用 Solidity 编写 LogRegistry 合约，并使用 OpenZeppelin AccessControl 实现 LOGGER_ROLE 权限控制；基于 Node.js、Express、TypeScript 和 SQLite 实现后端服务，完成日志入库、SHA-256 哈希计算、链上写入、历史合约地址回溯、合约代码存在性校验、审计记录和告警记录生成。",
            "4.3 Agent 与前端实现。实现独立日志采集 Agent，支持增量读取、偏移量持久化、失败重试和状态同步；基于 React、TypeScript 和 Ant Design 实现前端展示页面，展示系统总览、日志列表、审计状态、告警信息和相关统计图表。",
            "4.4 测试与论文整理。通过合约单元测试验证权限控制、日志写入和任务维度查询；通过后端脚本验证日志提交、审计触发、审计记录查询和告警查询；通过 Agent 验证新增日志采集和真实提交链路；通过性能脚本观察批量日志提交和批量审计耗时；通过篡改检测实验验证日志内容被修改后系统是否能够生成 failed 审计结果和 hash_mismatch 告警，最后整理为论文和答辩材料。",
        ],
    ),
    (
        "5、关键技术介绍",
        [
            "5.1 区块链存证与智能合约。区块链在本课题中不承担日志原文存储，而是作为日志摘要证据的可信登记环境。LogRegistry 合约保存 taskId、logHash、createdAt 和 submitter，并提供按任务 ID 查询链上记录的方法。通过 LOGGER_ROLE 控制写入地址，避免任意账户写入伪造存证记录。",
            "5.2 哈希摘要与三方比对。SHA-256 哈希摘要用于表达日志内容的完整性状态。系统将提交时计算得到的哈希作为 expectedHash，将审计时重新计算得到的哈希作为 actualHash，将链上读取到的哈希作为 onChainHash。通过三方比对，系统能够发现日志原文被修改、数据库记录不一致或链上证据缺失等情况。",
            "5.3 后端分层与链上链下协同。后端采用 routes、controllers、services、repositories、db 和 blockchain 分层结构。日志提交时，后端先保存链下原文，再计算哈希并调用合约；审计时，后端读取链下日志、数据库哈希和链上记录，统一生成审计结论。该结构使接口处理、业务编排、数据库访问和合约调用保持清晰边界。",
            "5.4 日志采集 Agent 与可视化展示。Agent 通过偏移量记录实现增量读取，避免重复采集历史日志，并通过重试队列降低网络异常造成的数据丢失风险。前端页面通过统计卡片、日志列表、审计状态和告警信息展示系统运行结果，使可信审计过程更直观。",
        ],
    ),
    (
        "6、要解决的技术问题",
        [
            "6.1 日志可信证据如何保存。需要解决日志原文体积大、内容可能敏感且不适合直接上链的问题，设计链下保存原文、链上保存哈希摘要的轻量存证方案。",
            "6.2 链上链下数据如何保持可追溯。需要记录 log_id、task_id、log_hash、contract_address、transaction_hash 和 block_number 等信息，保证审计阶段能够找到日志对应的链上证据，并能够处理本地链多次部署后的历史合约地址问题。",
            "6.3 审计结果如何判定。需要建立数据库哈希、当前日志重算哈希和链上哈希之间的比对规则，区分审计通过、哈希不一致和链上证据不可用等状态，并将异常转化为告警记录。",
            "6.4 系统如何验证。需要通过合约测试、接口回归、Agent 采集验证、性能实验和篡改检测实验说明系统闭环可运行，并用实验结果支撑论文结论。",
        ],
    ),
]


SCHEDULE = [
    ["序号", "各阶段名称", "起止日期"],
    ["1", "文献调研、选题确认与问题分析", "2025年12月10日 ~ 2025年12月31日"],
    ["2", "需求分析、总体架构设计与开题报告撰写", "2026年1月1日 ~ 2026年1月15日"],
    ["3", "LogRegistry 智能合约、部署脚本与合约测试", "2026年1月16日 ~ 2026年2月10日"],
    ["4", "后端服务、SQLite 数据库与日志采集 Agent 开发", "2026年2月11日 ~ 2026年3月10日"],
    ["5", "前端审计页面、告警页面与系统联调", "2026年3月11日 ~ 2026年3月31日"],
    ["6", "功能测试、性能实验、篡改检测、论文定稿与答辩准备", "2026年4月1日 ~ 2026年5月10日"],
]


def build_elements() -> list[str]:
    elements = [
        paragraph("毕业设计（论文）开题报告", align="center", bold=True, size=34, after=120),
        paragraph("（参考样张）", align="center", size=22, after=380),
        paragraph("课 题 名 称 ： 基于区块链的可信任务日志审计系统设计与实现", align="center", size=24, after=130),
        paragraph("学       院 ： 信息与智能科学学院", align="center", size=24, after=115),
        paragraph("专       业 ： 软件工程", align="center", size=24, after=115),
        paragraph("姓       名 ： 戴驰峰", align="center", size=24, after=115),
        paragraph("学       号 ： 221310610", align="center", size=24, after=115),
        paragraph("指 导 教 师 ： 卢婷", align="center", size=24, after=460),
        paragraph("二〇二六年一月六日", align="center", size=24),
        page_break(),
        paragraph("基于区块链的可信任务日志审计系统设计与实现", align="center", bold=True, size=28, after=160),
    ]

    for title, paras in SECTIONS:
        elements.append(paragraph(title, bold=True, size=24, before=70, after=70))
        elements.extend(paragraph(item, first_line=True, after=45) for item in paras)

    elements.extend(
        [
            paragraph("7、日程安排", bold=True, size=24, before=80, after=80),
            table(SCHEDULE, widths=[780, 5200, 3150]),
            paragraph("8、参考文献", bold=True, size=24, before=80, after=80),
            *[paragraph(f"[{index + 1}] {ref}", after=15, size=20) for index, ref in enumerate(REFERENCES)],
            paragraph("注：“开题报告样张”仅供参考，具体内容各学院根据各自特点统一确定。", after=10, size=18),
        ]
    )
    return elements


def build_markdown() -> str:
    md = "# 毕业设计（论文）开题报告\n\n"
    md += "课题名称：基于区块链的可信任务日志审计系统设计与实现  \n"
    md += "学院：信息与智能科学学院  \n专业：软件工程  \n姓名：戴驰峰  \n学号：221310610  \n指导教师：卢婷  \n"
    md += "日期：二〇二六年一月六日\n\n"
    md += "# 基于区块链的可信任务日志审计系统设计与实现\n\n"
    for title, paras in SECTIONS:
        md += f"## {title}\n\n" + "\n\n".join(paras) + "\n\n"
    md += "## 7、日程安排\n\n| 序号 | 各阶段名称 | 起止日期 |\n| --- | --- | --- |\n"
    md += "\n".join(f"| {row[0]} | {row[1]} | {row[2]} |" for row in SCHEDULE[1:])
    md += "\n\n## 8、参考文献\n\n"
    md += "\n".join(f"[{index + 1}] {ref}" for index, ref in enumerate(REFERENCES))
    md += "\n\n注：“开题报告样张”仅供参考，具体内容各学院根据各自特点统一确定。\n"
    return md


def main() -> None:
    docx_path = DOC_DIR / "221310610_戴驰峰_毕业设计论文开题报告.docx"
    md_path = DOC_DIR / "221310610_戴驰峰_毕业设计论文开题报告.md"
    write_docx(docx_path, build_elements())
    md_path.write_text(build_markdown(), encoding="utf-8")
    print(docx_path)
    print(md_path)


if __name__ == "__main__":
    main()
