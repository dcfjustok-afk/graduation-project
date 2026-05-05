# 论文正文精简记录

处理文件：`output/Graduation-thesis.docx`

## 处理目标

在不改变论文技术事实、不删除核心机制和实验数据的前提下，对篇幅较长、重复说明较多的内容进行压缩，使论文页数适当减少。

## 已执行处理

1. 压缩英文 Abstract，保留研究背景、系统方法、审计机制、实验数据和结论。
2. 压缩“1.4 论文组织结构”，将原逐章说明压缩为一个综合段落，并删除重复的逐章段落。
3. 对第 1、2、4、5、6 章中的部分非核心长段落进行句级压缩，减少重复解释和过长过渡。
4. 保留第 3 章核心机制主体内容，仅删除少量重复收束段落。
5. 保留关键实验数据：
   - 合约测试 8 项全部通过。
   - 日志批量提交 100 次全部成功。
   - 平均响应时间约 107.03 ms。
   - 吞吐量约 9.33 条/秒。
   - 批量审计平均耗时约 3067.77/15659.44/35032.13 ms。
   - 篡改检测结果 `auditStatus=failed`、`alertGenerated=true`。

## 精简结果

- 精简前正文段落数：404。
- 精简后正文段落数：386。
- 精简前正文字符量约：63591。
- 精简后正文字符量约：56040。
- 约减少字符量：7551。
- “本节关键信息摘要”与“本章关键信息摘要”均保持为 0。

## 备份文件

本次精简过程中生成的主要备份文件包括：

- `output/Graduation-thesis-before-auto-condense.docx`
- `output/Graduation-thesis-before-auto-condense-2.docx`
- `output/Graduation-thesis-before-auto-condense-3.docx`
- `output/Graduation-thesis-before-remove-duplicate-org.docx`

