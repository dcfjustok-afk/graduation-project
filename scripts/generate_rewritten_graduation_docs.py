from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
DOC_DIR = ROOT / "doc"


@dataclass(frozen=True)
class DocBuild:
    docx_path: Path
    md_path: Path
    elements: list[str]
    markdown: str


def x(text: str) -> str:
    return escape(text, {"'": "&apos;", '"': "&quot;"})


def run(text: str, *, bold: bool = False, size: int = 21) -> str:
    bold_xml = "<w:b/>" if bold else ""
    return (
        "<w:r><w:rPr>"
        '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="SimSun"/>'
        f'{bold_xml}<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
        "</w:rPr>"
        f'<w:t xml:space="preserve">{x(text)}</w:t>'
        "</w:r>"
    )


def paragraph(
    text: str = "",
    *,
    align: str | None = None,
    bold: bool = False,
    size: int = 21,
    first_line: bool = False,
    after: int = 80,
    before: int = 0,
) -> str:
    props = [f'<w:spacing w:before="{before}" w:after="{after}" w:line="300" w:lineRule="auto"/>']
    if align:
        props.append(f'<w:jc w:val="{align}"/>')
    if first_line:
        props.append('<w:ind w:firstLine="420"/>')
    return f"<w:p><w:pPr>{''.join(props)}</w:pPr>{run(text, bold=bold, size=size)}</w:p>"


def empty_paragraph(after: int = 80) -> str:
    return paragraph("", after=after)


def page_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def table(rows: list[list[str | list[str]]], widths: list[int] | None = None) -> str:
    grid = ""
    if widths:
        grid = "<w:tblGrid>" + "".join(f'<w:gridCol w:w="{w}"/>' for w in widths) + "</w:tblGrid>"

    body: list[str] = []
    for row in rows:
        cells: list[str] = []
        for index, cell in enumerate(row):
            width_xml = f'<w:tcW w:w="{widths[index]}" w:type="dxa"/>' if widths and index < len(widths) else ""
            cell_body = "".join(cell) if isinstance(cell, list) else "".join(
                paragraph(line, after=30) for line in str(cell).splitlines()
            )
            cells.append(
                "<w:tc>"
                f"<w:tcPr>{width_xml}<w:tcMar>"
                '<w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>'
                '<w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/>'
                "</w:tcMar></w:tcPr>"
                f"{cell_body}"
                "</w:tc>"
            )
        body.append("<w:tr>" + "".join(cells) + "</w:tr>")

    return (
        "<w:tbl><w:tblPr>"
        '<w:tblW w:w="0" w:type="auto"/>'
        '<w:tblBorders>'
        '<w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
        '<w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
        '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
        '<w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        "</w:tblBorders>"
        '<w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>'
        '<w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>'
        "</w:tblPr>"
        f"{grid}{''.join(body)}"
        "</w:tbl>"
    )


def boxed(content: list[str]) -> str:
    return table([[content]], widths=[9100])


def document_xml(elements: Iterable[str]) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        "<w:body>"
        + "".join(elements)
        + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
        'w:header="708" w:footer="708" w:gutter="0"/>'
        '<w:cols w:space="708"/><w:docGrid w:linePitch="312"/></w:sectPr>'
        "</w:body></w:document>"
    )


def styles_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        '<w:docDefaults><w:rPrDefault><w:rPr>'
        '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="SimSun"/>'
        '<w:sz w:val="21"/><w:szCs w:val="21"/>'
        "</w:rPr></w:rPrDefault></w:docDefaults>"
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal">'
        '<w:name w:val="Normal"/><w:qFormat/>'
        "</w:style>"
        "</w:styles>"
    )


def write_docx(path: Path, elements: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(path, "w", ZIP_DEFLATED) as zf:
        zf.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/word/document.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '<Override PartName="/word/styles.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
            '<Override PartName="/word/settings.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
            "</Types>",
        )
        zf.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
            'Target="word/document.xml"/>'
            "</Relationships>",
        )
        zf.writestr(
            "word/_rels/document.xml.rels",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
        )
        zf.writestr("word/document.xml", document_xml(elements))
        zf.writestr("word/styles.xml", styles_xml())
        zf.writestr(
            "word/settings.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:defaultTabStop w:val="420"/>'
            '<w:characterSpacingControl w:val="doNotCompress"/>'
            "</w:settings>",
        )


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


def ref_lines() -> list[str]:
    return [f"[{i + 1}] {item}" for i, item in enumerate(REFERENCES)]


def build_new_task_book() -> DocBuild:
    purpose = [
        "本课题面向任务日志在安全审计、责任追溯和运行排查中的可信性需求，要求学生从实际工程系统出发，综合运用软件工程、数据库、网络安全、密码学哈希、区块链和前后端开发知识，完成一个可运行、可验证、可展示的可信任务日志审计系统。",
        "课题要求围绕“日志原文可查询、日志证据可追溯、日志篡改可发现”的目标，建立链下日志存储与链上哈希存证相结合的系统方案。系统不直接将日志原文写入区块链，而是将原文保存在链下数据库，将任务标识、日志哈希、提交者和时间等关键证据信息写入智能合约，以兼顾存储成本、隐私保护和审计可信性。",
        "课题要求学生完成从需求分析、总体设计、模块实现、联调测试到论文撰写的完整毕业设计过程。最终成果应能够说明日志采集、链下存储、链上存证、三方哈希比对、异常告警和前端展示之间的数据关系，并通过测试和实验验证系统有效性。",
        "论文要求论证清晰、结构完整、图表规范、参考文献真实有效，能够准确解释 LogRegistry 智能合约、Agent 增量采集、后端审计流程、SQLite 数据模型、React 前端展示和实验验证结果。系统代码要求模块边界清楚，具备基本可维护性和可复现实验能力。",
    ]

    contents = [
        "完成可信任务日志审计系统的需求分析。围绕任务执行日志的采集、存证、审计、告警和展示需求，分析传统中心化日志系统在防篡改、证据独立性和审计可追溯性方面的不足，明确系统功能需求和非功能需求。",
        "完成链上链下混合存储与审计机制设计。设计 SQLite 保存日志原文、LogRegistry 智能合约保存日志哈希的存证模型，明确 logs、log_hash_records、audit_records、alerts 和 agent_states 等数据表之间的关系，设计 expectedHash、actualHash 和 onChainHash 三方比对规则。",
        "完成智能合约与区块链交互模块。基于 Solidity、Hardhat、Ethers 和 OpenZeppelin AccessControl 实现 LogRegistry 合约，支持日志哈希写入、按任务 ID 查询、角色权限控制、合约部署和合约单元测试。",
        "完成后端服务与链下数据管理。基于 Node.js、Express、TypeScript 和 SQLite 实现日志接收、哈希计算、链上写入、历史合约地址回溯、合约代码存在性校验、审计任务执行、告警生成和统计查询接口。",
        "完成日志采集 Agent 与前端可视化。Agent 支持日志文件增量读取、偏移量持久化、失败重试和状态同步；Web 前端展示系统总览、日志中心、审计管理、告警管理以及相关趋势和分布信息。",
        "完成系统测试、性能实验和论文支撑材料。通过合约测试、接口回归、Agent 采集验证、100 条日志批量提交实验、100/500/1000 条批量审计实验和篡改检测实验，整理实验数据、截图、论文图表和答辩材料。",
    ]

    works = [
        "完成外文原文阅读与不少于 20000 字符的中文翻译，翻译内容应与区块链、日志审计、链上存证或相关安全审计方向相关。",
        "完成开题报告、任务书、中期检查、实验记录、系统说明、操作手册、答辩 PPT 和演示脚本等毕业设计过程材料。",
        "完成系统需求分析文档，给出功能需求、非功能需求、业务流程、系统数据流和关键技术路线。",
        "完成系统总体架构设计，明确 Agent、Server、SQLite、LogRegistry 和 Web 前端的职责边界及调用关系。",
        "完成数据库设计和智能合约设计，形成链下数据表、链上存证结构、权限控制策略和任务维度查询方案。",
        "完成系统编码实现和集成调试，保证日志能够完成“采集—入库—哈希计算—上链—审计—告警—展示”的闭环。",
        "完成测试与实验验证，记录合约测试、后端 API 验证、Agent 验证、前端构建、性能实验和篡改检测实验结果。",
        "完成毕业论文定稿，论文正文应覆盖相关理论、机制设计、需求分析、总体设计、系统实现、实验验证、总结与展望等内容。",
    ]

    schedule = [
        ["序号", "设计（论文）各阶段名称", "日期", "备注"],
        ["1", "课题确认、文献检索与可信日志审计需求调研", "2025年12月10日 ~ 2025年12月31日", "完成资料准备"],
        ["2", "系统需求分析、技术路线确定与开题报告撰写", "2026年1月1日 ~ 2026年1月15日", "完成开题"],
        ["3", "链上存证机制设计、LogRegistry 合约开发与测试", "2026年1月16日 ~ 2026年2月10日", "完成合约模块"],
        ["4", "后端服务、SQLite 数据模型与日志采集 Agent 实现", "2026年2月11日 ~ 2026年3月10日", "打通核心链路"],
        ["5", "Web 前端、审计告警页面与系统联调", "2026年3月11日 ~ 2026年3月31日", "完成展示功能"],
        ["6", "功能测试、性能实验、篡改检测实验与论文撰写", "2026年4月1日 ~ 2026年5月10日", "完成定稿答辩"],
    ]

    page2 = [
        paragraph("一、毕业设计（论文）的目的与要求：", bold=True, size=22),
        *[paragraph(item, first_line=True, after=35) for item in purpose],
        empty_paragraph(30),
        paragraph("二、毕业设计（论文）的内容：", bold=True, size=22),
        *[paragraph(f"{i + 1}．{item}", first_line=True, after=25) for i, item in enumerate(contents)],
    ]

    page3 = [
        paragraph("三、毕业设计（论文）课题应完成的工作：", bold=True, size=22),
        *[paragraph(f"{i + 1}．{item}", first_line=True, after=25) for i, item in enumerate(works)],
        empty_paragraph(30),
        paragraph("四、毕业设计（论文）进程的安排：", bold=True, size=22),
        table(schedule, widths=[720, 3800, 3050, 1500]),
    ]

    page4 = [
        paragraph("五、应收集的资料及主要参考文献：", bold=True, size=22),
        *[paragraph(line, after=5, size=19) for line in ref_lines()],
        paragraph("（参考文献格式参照 GB/T 7714-2015。）", after=20, size=19),
        empty_paragraph(20),
        paragraph("六、任务执行日期：", bold=True, size=22),
        paragraph("自 2025 年 12 月 10 日起，至 2026 年 5 月 11 日止。", first_line=True, after=120),
        paragraph("学生（签字）__________________", align="right", after=70),
        paragraph("指导教师（签字）__________________", align="right", after=70),
        paragraph("系 主 任（签字）__________________", align="right", after=90),
    ]

    elements = [
        paragraph("毕业设计（论文）任务书", align="center", bold=True, size=34, after=120),
        paragraph("（全新撰写版）", align="center", size=22, after=420),
        paragraph("课 题 名 称 ：  基于区块链的可信任务日志审计系统", align="center", size=24, after=100),
        paragraph("设计与实现", align="center", size=24, after=170),
        paragraph("学         院 ：  信息与智能科学学院", align="center", size=24, after=120),
        paragraph("专         业 ：  软件工程", align="center", size=24, after=120),
        paragraph("姓         名 ：  戴驰峰", align="center", size=24, after=120),
        paragraph("学         号 ：  221310610", align="center", size=24, after=120),
        paragraph("指 导 教 师 ：  卢婷", align="center", size=24, after=520),
        paragraph("二〇二五年十二月十日", align="center", size=24),
        page_break(),
        boxed(page2),
        page_break(),
        boxed(page3),
        page_break(),
        boxed(page4),
    ]

    md = "# 毕业设计（论文）任务书（全新撰写版）\n\n"
    md += "课题名称：基于区块链的可信任务日志审计系统设计与实现  \n学院：信息与智能科学学院  \n专业：软件工程  \n姓名：戴驰峰  \n学号：221310610  \n指导教师：卢婷  \n日期：二〇二五年十二月十日\n\n"
    md += "## 一、毕业设计（论文）的目的与要求\n\n" + "\n\n".join(purpose) + "\n\n"
    md += "## 二、毕业设计（论文）的内容\n\n" + "\n".join(f"{i + 1}．{item}" for i, item in enumerate(contents)) + "\n\n"
    md += "## 三、毕业设计（论文）课题应完成的工作\n\n" + "\n".join(f"{i + 1}．{item}" for i, item in enumerate(works)) + "\n\n"
    md += "## 四、毕业设计（论文）进程的安排\n\n| 序号 | 设计（论文）各阶段名称 | 日期 | 备注 |\n| --- | --- | --- | --- |\n"
    md += "\n".join(f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} |" for row in schedule[1:])
    md += "\n\n## 五、应收集的资料及主要参考文献\n\n" + "\n".join(ref_lines()) + "\n\n"
    md += "## 六、任务执行日期\n\n自 2025 年 12 月 10 日起，至 2026 年 5 月 11 日止。\n"

    return DocBuild(
        docx_path=DOC_DIR / "221310610_戴驰峰_毕业设计论文任务书-全新撰写版.docx",
        md_path=DOC_DIR / "221310610_戴驰峰_毕业设计论文任务书-全新撰写版.md",
        elements=elements,
        markdown=md,
    )


def build_new_opening_report() -> DocBuild:
    sections = [
        (
            "1、背景介绍",
            [
                "任务日志是信息系统运行过程中的基础证据。无论是自动化任务调度、后端接口调用、运维脚本执行，还是业务系统异常排查，日志都会记录任务标识、执行时间、来源路径、日志级别、执行结果和错误信息等关键内容。对于安全审计而言，日志不仅用于定位故障，也用于还原事件发生过程、判断责任边界和支撑后续处置。因此，日志本身是否真实、完整、可追溯，直接影响审计结论是否可信。",
                "传统日志系统通常将日志原文保存在数据库、文件系统或集中日志平台中。这类方案易于部署和查询，但日志原文、审计依据和管理权限往往集中在同一信任域内。当数据库被攻击、管理员权限被滥用或内部人员试图掩盖异常操作时，日志可能被修改、删除或伪造。若审计依据仍保存在同一中心化系统中，事后很难证明某条日志是否保持了提交时的原始状态。",
                "区块链的交易记录、时间顺序和哈希链接结构能够为链下数据提供外部可信参照。对于日志审计场景，直接将完整日志上链会带来存储成本和隐私暴露问题，更可行的方式是链下保存日志原文，链上保存日志哈希和任务标识。审计时系统重新计算链下日志哈希，并与数据库保存的期望哈希以及链上合约记录进行比对，从而判断日志内容是否发生变化。本课题据此设计并实现基于区块链的可信任务日志审计系统。",
            ],
        ),
        (
            "2、研究现状",
            [
                "现有日志审计研究主要围绕日志集中采集、统一检索、异常检测、审计追溯和安全存储展开。集中式日志平台能够提升查询效率和运维可观察性，但在日志完整性证明方面仍然依赖中心化数据库或平台自身的可信性。为了增强日志防篡改能力，相关研究引入哈希链、数字签名、安全时间戳和访问控制等机制，使日志修改更容易被发现。",
                "区块链存证研究为可信日志审计提供了新的方向。区块链不适合保存大量原始日志，但适合保存日志摘要、业务标识、提交时间和提交者等证据信息。链上记录可作为链下日志的独立证明源，后续审计时只需重新计算日志哈希并与链上记录比对，即可判断链下数据是否与存证时一致。国内外已有研究探讨了基于区块链的日志存储、数据溯源、数字取证和云数据审计等方向。",
                "从工程实现角度看，现有方案仍存在若干可改进之处。第一，部分方案更偏重理论模型，缺少可运行的采集、存储、上链、审计、告警和展示闭环。第二，日志采集端常被简化为手工提交，缺少增量读取、偏移量保存和失败重试能力。第三，审计判断通常只比较链下哈希与链上哈希，未充分区分当前日志内容、数据库存证记录和链上证据之间的关系。第四，实验验证和前端展示不足，难以直观说明系统在日志批量提交、批量审计和篡改检测场景下的表现。",
            ],
        ),
        (
            "3、课题研究内容",
            [
                "3.1 可信日志存证模型设计。设计链下日志原文与链上哈希摘要相结合的混合存储模型。日志原文保存在 SQLite 数据库中，日志哈希、任务标识、写入时间和提交者保存在 LogRegistry 智能合约中，使链上记录成为独立于数据库的审计依据。",
                "3.2 三方哈希比对审计机制设计。系统在日志提交阶段计算 expectedHash 并保存到 log_hash_records 表，同时将哈希写入链上；审计阶段重新读取 logs 表中的 log_content 计算 actualHash，再结合链上 onChainHash 进行比对。三方一致时审计状态为 passed，哈希不一致时为 failed，链上记录缺失或合约不可用时为 pending。",
                "3.3 系统工程实现。系统采用 Monorepo 组织，包含 apps/agent、apps/server、apps/web、packages/contracts 和 packages/shared 等模块。Agent 负责日志增量采集和状态同步；Server 负责日志接收、哈希计算、数据库读写、合约交互、审计执行和告警生成；LogRegistry 负责链上存证；Web 前端负责展示系统总览、日志中心、审计管理和告警管理。",
                "3.4 测试与实验验证。围绕可信审计闭环设计合约测试、后端 API 回归、Agent 采集验证、前端构建验证、日志批量提交实验、批量审计实验和篡改检测实验。通过这些实验验证系统是否能够稳定完成日志存证、审计判断和异常告警。",
            ],
        ),
        (
            "4、技术路线",
            [
                "本课题技术路线按照“理论调研—机制设计—系统实现—实验验证—论文总结”的顺序展开。首先调研日志审计、哈希完整性校验、区块链存证、智能合约访问控制和前后端分离系统开发等相关资料；随后根据任务日志场景设计链上链下混合存储模型、三方哈希比对机制、数据库表结构和系统总体架构。",
                "在系统实现阶段，先基于 Hardhat 搭建本地区块链环境，使用 Solidity 编写 LogRegistry 合约，并使用 OpenZeppelin AccessControl 实现 LOGGER_ROLE 权限控制；再基于 Node.js、Express、TypeScript 和 SQLite 实现后端服务，完成日志入库、SHA-256 哈希计算、链上写入、历史合约地址回溯、合约代码存在性校验、审计记录和告警记录生成；随后实现独立日志采集 Agent，支持增量读取、偏移量持久化、失败重试和状态同步；最后基于 React、TypeScript 和 Ant Design 实现前端展示页面。",
                "在验证阶段，通过合约单元测试验证权限控制、日志写入和任务维度查询；通过后端脚本验证日志提交、审计触发、审计记录查询和告警查询；通过 Agent 验证新增日志采集和真实提交链路；通过性能脚本观察批量日志提交和批量审计耗时；通过篡改检测实验验证日志内容被修改后系统是否能够生成 failed 审计结果和 hash_mismatch 告警。",
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

    schedule = [
        ["序号", "各阶段名称", "起止日期"],
        ["1", "文献调研、选题确认与问题分析", "2025年12月10日 ~ 2025年12月31日"],
        ["2", "需求分析、总体架构设计与开题报告撰写", "2026年1月1日 ~ 2026年1月15日"],
        ["3", "LogRegistry 智能合约、部署脚本与合约测试", "2026年1月16日 ~ 2026年2月10日"],
        ["4", "后端服务、SQLite 数据库与日志采集 Agent 开发", "2026年2月11日 ~ 2026年3月10日"],
        ["5", "前端审计页面、告警页面与系统联调", "2026年3月11日 ~ 2026年3月31日"],
        ["6", "功能测试、性能实验、篡改检测、论文定稿与答辩准备", "2026年4月1日 ~ 2026年5月10日"],
    ]

    elements = [
        paragraph("毕业设计（论文）开题报告", align="center", bold=True, size=34, after=120),
        paragraph("（全新撰写版）", align="center", size=22, after=360),
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

    for title, paras in sections:
        elements.append(paragraph(title, bold=True, size=24, before=70, after=70))
        elements.extend(paragraph(item, first_line=True, after=45) for item in paras)

    elements.extend(
        [
            paragraph("7、日程安排", bold=True, size=24, before=80, after=80),
            table(schedule, widths=[780, 5200, 3150]),
            paragraph("8、参考文献", bold=True, size=24, before=80, after=80),
            *[paragraph(line, after=15, size=20) for line in ref_lines()],
        ]
    )

    md = "# 毕业设计（论文）开题报告（全新撰写版）\n\n"
    md += "课题名称：基于区块链的可信任务日志审计系统设计与实现  \n学院：信息与智能科学学院  \n专业：软件工程  \n姓名：戴驰峰  \n学号：221310610  \n指导教师：卢婷  \n日期：二〇二六年一月六日\n\n"
    md += "# 基于区块链的可信任务日志审计系统设计与实现\n\n"
    for title, paras in sections:
        md += f"## {title}\n\n" + "\n\n".join(paras) + "\n\n"
    md += "## 7、日程安排\n\n| 序号 | 各阶段名称 | 起止日期 |\n| --- | --- | --- |\n"
    md += "\n".join(f"| {row[0]} | {row[1]} | {row[2]} |" for row in schedule[1:])
    md += "\n\n## 8、参考文献\n\n" + "\n".join(ref_lines()) + "\n"

    return DocBuild(
        docx_path=DOC_DIR / "221310610_戴驰峰_毕业设计论文开题报告-全新撰写版.docx",
        md_path=DOC_DIR / "221310610_戴驰峰_毕业设计论文开题报告-全新撰写版.md",
        elements=elements,
        markdown=md,
    )


def main() -> None:
    for build in [build_new_task_book(), build_new_opening_report()]:
        write_docx(build.docx_path, build.elements)
        build.md_path.write_text(build.markdown, encoding="utf-8")
        print(build.docx_path)
        print(build.md_path)


if __name__ == "__main__":
    main()
