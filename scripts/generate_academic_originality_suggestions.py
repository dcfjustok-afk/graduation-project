from __future__ import annotations

from pathlib import Path

from docx import Document


DOCX_PATH = Path("output/Graduation-thesis.docx")
OUT_PATH = Path("output/论文合规润色与原创性增强建议.md")


SUGGESTIONS = [
    {
        "section": "1.1 研究背景及意义",
        "issue": "背景段落容易出现泛泛描述。",
        "suggestion": "可补充本系统面向“任务日志”而非一般业务日志的原因，例如任务执行链路中日志用于定位任务状态、异常原因和责任追溯。",
        "safe_action": "增加真实场景说明，不要编造行业数据或参考文献。",
    },
    {
        "section": "1.2 国内外研究现状",
        "issue": "研究现状如果只有概括性表述，容易显得模板化。",
        "suggestion": "后续补真实参考文献时，可按区块链存证、日志完整性校验、智能合约访问控制三类分别引用，并在每类后说明与本文系统实现的关系。",
        "safe_action": "只加入已经查证的文献，不要生成虚构作者、年份或期刊。",
    },
    {
        "section": "3.1.1 链下日志存储与链上哈希存证模型",
        "issue": "该节是核心机制，建议突出设计取舍。",
        "suggestion": "结合图 3-1 说明为什么日志原文留在 SQLite，哈希摘要写入 LogRegistry；可强调隐私、链上成本、审计可信性之间的平衡。",
        "safe_action": "用系统真实字段 logs、log_hash_records、taskId、logHash 进行说明。",
    },
    {
        "section": "3.4.1 三方哈希比对",
        "issue": "三方比对是论文核心创新点之一，应避免只写概念。",
        "suggestion": "结合图 3-3 明确 expectedHash、actualHash、onChainHash 的来源，并说明三者不一致时如何定位是链下日志变化、数据库记录异常还是链上证据不可用。",
        "safe_action": "保留 passed、failed、pending 的真实状态定义。",
    },
    {
        "section": "3.4.2 与 3.4.3",
        "issue": "历史合约地址回溯和合约代码存在性校验属于工程改进，应写出问题来源。",
        "suggestion": "可说明本地 Hardhat 链重启、多次部署 LogRegistry 后，如果只依赖当前环境变量合约地址，会导致历史日志审计误判；provider.getCode(address) 用于确认地址是否真实存在合约字节码。",
        "safe_action": "只描述已有工程改进，不扩展为生产级安全机制。",
    },
    {
        "section": "4.4 与 4.6",
        "issue": "架构图和数据流图插入后，正文应与图保持一致。",
        "suggestion": "检查图 4-1 和图 4-2 中的模块名称是否与正文一致，例如 Agent、Server、SQLite、LogRegistry、Web；若图中有额外组件，应删除或在图中修改。",
        "safe_action": "以论文真实技术栈为准，不加入 Redis、Kafka、MySQL 等未实现组件。",
    },
    {
        "section": "5.4",
        "issue": "前端截图容易被认为只是展示页面，建议联系系统闭环。",
        "suggestion": "在图 5-1、图 5-2 附近说明页面展示的数据来自后端 API，并与 logs、audit_records、alerts 等表对应，体现前端不是独立展示，而是闭环结果呈现。",
        "safe_action": "使用真实接口和真实页面功能，不编造登录、权限审批等未实现功能。",
    },
    {
        "section": "5.6",
        "issue": "实验部分需要保持数据准确。",
        "suggestion": "图 5-3 附近应再次核对 100/500/1000 条批量审计平均耗时是否与正文一致，即 3067.77/15659.44/35032.13 ms。",
        "safe_action": "不要为了图表美观修改实验数据。",
    },
    {
        "section": "6.2 系统创新点",
        "issue": "创新点表述不宜夸大。",
        "suggestion": "建议使用“工程实现改进”“机制组合设计”“原型系统验证”等表达，避免写成“理论突破”“首次提出”等没有证据支撑的说法。",
        "safe_action": "保持本科论文客观语气。",
    },
]


def main() -> None:
    doc = Document(DOCX_PATH)
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    full = "\n".join(paragraphs)

    figure_captions = [p for p in paragraphs if p.startswith("图 ")]

    lines: list[str] = []
    lines.append("# 论文合规润色与原创性增强建议")
    lines.append("")
    lines.append("## 说明")
    lines.append("")
    lines.append("本文档用于帮助提升论文的学术表达质量、工程细节密度和原创说明程度。")
    lines.append("不建议、也不应以规避检测为目标修改论文；更稳妥的做法是补充真实项目过程、真实实验依据、真实设计取舍和规范引用。")
    lines.append("")
    lines.append("## 当前文档检查结果")
    lines.append("")
    lines.append(f"- 论文文件：`{DOCX_PATH.as_posix()}`")
    lines.append(f"- 段落数：{len(paragraphs)}")
    lines.append(f"- 插图图题数量：{len(figure_captions)}")
    lines.append(f"- 是否仍含“本节关键信息摘要”：{'是' if '本节关键信息摘要' in full else '否'}")
    lines.append(f"- 是否出现第一人称“我/我们”：{'是' if ('我' in full or '我们' in full) else '否'}")
    lines.append("")

    lines.append("## 已插入图片图题")
    lines.append("")
    for caption in figure_captions:
        lines.append(f"- {caption}")
    lines.append("")

    lines.append("## 建议逐项处理的位置")
    lines.append("")
    lines.append("| 序号 | 章节位置 | 可能问题 | 合规增强建议 | 注意事项 |")
    lines.append("|---:|---|---|---|---|")
    for index, item in enumerate(SUGGESTIONS, start=1):
        lines.append(
            f"| {index} | {item['section']} | {item['issue']} | {item['suggestion']} | {item['safe_action']} |"
        )
    lines.append("")

    lines.append("## 推荐修改方式")
    lines.append("")
    lines.append("1. 对每张图增加一两句与正文相连的解释，说明图中模块如何对应系统真实实现。")
    lines.append("2. 在第 3 章保留并突出 LogRegistry、LOGGER_ROLE、三方哈希比对、历史合约地址回溯、provider.getCode(address) 等真实工程点。")
    lines.append("3. 在第 5 章把测试与实验写得更像项目记录，例如说明测试对象、验证路径、输入数据规模和输出结果。")
    lines.append("4. 检查参考文献，确保第 1、2 章中的研究现状和技术介绍有真实来源支撑。")
    lines.append("5. 避免堆叠“具有重要意义、提高了可靠性、增强了安全性”等空泛句，优先写具体字段、接口、表、合约方法和实验数据。")
    lines.append("")

    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(OUT_PATH.as_posix())


if __name__ == "__main__":
    main()
