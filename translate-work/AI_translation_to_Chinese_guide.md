# 使用 AI 将 LaTeX 外文论文翻译为中文 PDF 的操作指南

本文档用于指导你把 `D:\aaaaProject\graduation-project\translate-work` 下的外文 LaTeX 论文翻译成中文，并最终编译为 PDF。当前原文项目目录为：

```text
D:\aaaaProject\graduation-project\translate-work
├─ arXiv-2502.13513v1        # 原始英文 LaTeX 论文
│  ├─ Main.tex               # 主入口文件
│  ├─ bibliography.tex       # 参考文献，直接使用 thebibliography，不是 .bib 文件
│  └─ Sections               # 正文章节与图片资源
└─ Chinese                   # 建议放置中文译文项目
```

> 我已检查当前机器环境：暂时没有在 PATH 中找到 `xelatex` 和 `latexmk`。因此在生成 PDF 前，需要先安装 LaTeX 发行版，或使用 Overleaf 等在线 LaTeX 环境，并把编译器设置为 XeLaTeX。

## 0. 总体思路

不要直接让 AI 一次性翻译整篇论文。更稳的方式是：

1. 复制一份完整 LaTeX 项目到 `Chinese` 目录。
2. 修改 `Chinese\Main.tex`，让它支持中文编译。
3. 按章节让 AI 翻译 `Sections/*.tex`。
4. 每翻译 1 到 2 个章节就编译一次，及时修复 LaTeX 错误。
5. 全文翻译完成后，让 AI 做术语统一、学术润色、LaTeX 结构检查。
6. 使用 XeLaTeX 编译得到最终中文 PDF。

推荐使用能读取和修改本地文件的 AI 编程助手完成主体工作，例如 Codex、Cursor、VS Code 里的 AI 助手。普通聊天式 AI 也可以使用，但需要你手动复制文件内容，效率会低一些。

## 1. 准备工作

### 1.1 复制原文项目

在 PowerShell 中执行：

```powershell
cd D:\aaaaProject\graduation-project\translate-work
Copy-Item -Recurse -Force .\arXiv-2502.13513v1\* .\Chinese\
```

复制后，中文翻译只改 `Chinese` 目录，不要直接改原始英文目录。

### 1.2 建议先建立版本记录

如果当前目录还没有 Git 仓库，可以在 `translate-work` 下执行：

```powershell
cd D:\aaaaProject\graduation-project\translate-work
git init
git add .
git commit -m "backup original latex paper before translation"
```

这样翻译或编译过程中出错时，方便对比和回退。

### 1.3 安装 LaTeX 编译环境

中文 LaTeX 建议使用 XeLaTeX 编译。

Windows 上可以二选一：

- MiKTeX：<https://miktex.org/download>
- TeX Live Windows：<https://tug.org/texlive/windows.html>

安装后重新打开 PowerShell，检查：

```powershell
where xelatex
where latexmk
```

如果能看到可执行文件路径，说明环境变量配置成功。

如果暂时不想本地安装，也可以把 `Chinese` 文件夹压缩上传到 Overleaf，然后在 Overleaf 菜单中把 Compiler 设置为 `XeLaTeX`。注意：Overleaf 是 Linux 环境，文件名大小写敏感；当前主文件里有一行 `\input{Sections/appendix}`，而实际文件名是 `Appendix.tex`，上传 Overleaf 前建议改成：

```latex
\input{Sections/Appendix}
```

## 2. 修改中文 LaTeX 主文件

目标文件：

```text
D:\aaaaProject\graduation-project\translate-work\Chinese\Main.tex
```

在 `\documentclass[lettersize,journal]{IEEEtran}` 后面加入中文支持：

```latex
\usepackage[UTF8,fontset=windows]{ctex}
```

如果使用 Overleaf 或本机字体报错，可以改成：

```latex
\usepackage[UTF8,fontset=fandol]{ctex}
```

建议把标题翻译为中文，例如：

```latex
\title{幻影事件：揭示区块链日志伪造问题}
```

作者、单位、ORCID、参考文献通常保持英文即可。外文文献翻译作业一般重点是正文翻译，不必强行翻译作者单位和参考文献列表。

如果你希望图、表、算法、章节引用显示为中文，可以在 `\usepackage[capitalize]{cleveref}` 后增加：

```latex
\crefformat{section}{第#2#1#3节}
\Crefformat{section}{第#2#1#3节}
\crefformat{figure}{图#2#1#3}
\Crefformat{figure}{图#2#1#3}
\crefformat{table}{表#2#1#3}
\Crefformat{table}{表#2#1#3}
\crefformat{algorithm}{算法#2#1#3}
\Crefformat{algorithm}{算法#2#1#3}
```

这一步可以先不做，等正文翻译完成后再统一处理。

## 3. 需要翻译的文件顺序

建议按下面顺序处理：

```text
Chinese\Main.tex                    # 只翻译标题，保留作者和宏包结构
Chinese\Sections\0_Abstract.tex
Chinese\Sections\1_Introduction.tex
Chinese\Sections\2_Background.tex
Chinese\Sections\3_Threat.tex
Chinese\Sections\4_Vector.tex
Chinese\Sections\5_Detection.tex
Chinese\Sections\6_Evaluation.tex
Chinese\Sections\7_Related.tex
Chinese\Sections\8_Discussion.tex
Chinese\Sections\9_Conclusion.tex
Chinese\Sections\Acknowledgments.tex
Chinese\Sections\Appendix.tex
```

一般不建议翻译：

```text
Chinese\bibliography.tex
Chinese\Sections\Picture\*
```

参考文献保留原文更符合学术引用习惯，图片文件名也必须保持不变，否则 LaTeX 会找不到图片。

## 4. 翻译时必须遵守的规则

给 AI 下达任务时，一定要强调下面这些规则：

1. 只翻译自然语言正文，不破坏 LaTeX 结构。
2. 保留所有 LaTeX 命令，例如 `\section{}`、`\subsection{}`、`\label{}`、`\cite{}`、`\ref{}`、`\cref{}`、`\emph{}`、`\textbf{}`、`\begin{}`、`\end{}`。
3. 保留所有引用键，例如 `\cite{bitcoin}`、`\label{sec:threat}`。
4. 保留数学公式、变量名、合约函数名、代码、URL、图片路径、文件名。
5. 图题 `\caption{}`、表格中的文字、章节标题可以翻译；但 `\label{}` 不翻译。
6. 数字、单位、百分比、金额、日期要保持准确。
7. 专有名词第一次出现时可以使用“中文译名（英文原文）”，之后用中文译名。
8. 译文要使用正式、流畅的中文学术论文风格，不要口语化。
9. 如果遇到含义不确定的术语，不要编造，可以在同一句中保留英文。
10. 每个文件翻译完成后，必须检查是否存在 `\begin{...}` 和 `\end{...}` 不匹配、花括号缺失、命令被误删等问题。

## 5. 推荐术语表

翻译前先把术语表固定下来，后面所有章节都按同一套译法走。

| 英文术语 | 建议中文译法 |
|---|---|
| Phantom Events | 幻影事件 |
| log forgery | 日志伪造 |
| transaction log | 交易日志 |
| smart contract event | 智能合约事件 |
| EVM-based blockchain | 基于 EVM 的区块链 |
| Decentralized Application / DApp | 去中心化应用 / DApp |
| decentralized exchange | 去中心化交易所 |
| cross-chain bridge | 跨链桥 |
| blockchain explorer | 区块链浏览器 |
| cryptocurrency wallet | 加密货币钱包 |
| NFT marketplace | NFT 市场 |
| event listener | 事件监听器 |
| bytecode | 字节码 |
| source code | 源代码 |
| false positive | 误报 |
| vulnerability | 漏洞 |
| mitigation | 缓解措施 |
| attack vector | 攻击向量 |
| attack taxonomy | 攻击分类 |
| relayer | 中继器 |
| off-chain record | 链下记录 |
| on-chain issue | 链上问题 |
| detection tool | 检测工具 |
| responsible disclosure | 负责任披露 |
| DeFi | DeFi |
| GameFi | GameFi |
| PEventCatcher | PEventCatcher |

## 6. 使用本地 AI 编程助手的提示词

如果你使用 Codex、Cursor、VS Code AI 这类能访问本地文件的工具，可以直接复制下面的提示词。

### 6.1 总控提示词

```text
你现在是 LaTeX 学术论文翻译助手。我要把一篇英文 LaTeX 论文翻译成中文，并最终用 XeLaTeX 编译成 PDF。

原始英文项目路径：
D:\aaaaProject\graduation-project\translate-work\arXiv-2502.13513v1

中文译文项目路径：
D:\aaaaProject\graduation-project\translate-work\Chinese

请按以下原则工作：
1. 只修改 Chinese 目录，不要修改 arXiv-2502.13513v1 原文目录。
2. 先确认 Chinese 目录是否已有完整 LaTeX 项目；如果没有，请从原文目录复制完整项目过去。
3. 修改 Chinese\Main.tex，使其支持中文 XeLaTeX 编译。优先使用 \usepackage[UTF8,fontset=windows]{ctex}。
4. 逐章节翻译 Sections 下的 tex 文件，不要一次性大改所有文件。
5. 保留所有 LaTeX 命令、引用、标签、数学公式、图片路径、代码块、URL、变量名和文件名。
6. 章节标题、段落正文、图题、表格文字可以翻译为中文。
7. bibliography.tex 参考文献原则上保持英文原样。
8. 使用正式中文学术论文风格，保持术语一致。
9. 翻译完成后尝试使用 xelatex 或 latexmk 编译 PDF；如果报错，请根据日志修复 LaTeX 问题。

术语表：
Phantom Events = 幻影事件
log forgery = 日志伪造
transaction log = 交易日志
smart contract event = 智能合约事件
EVM-based blockchain = 基于 EVM 的区块链
DApp = 去中心化应用 / DApp
cross-chain bridge = 跨链桥
blockchain explorer = 区块链浏览器
cryptocurrency wallet = 加密货币钱包
event listener = 事件监听器
bytecode = 字节码
source code = 源代码
false positive = 误报
vulnerability = 漏洞
mitigation = 缓解措施
attack vector = 攻击向量
relayer = 中继器
PEventCatcher = PEventCatcher

请先完成准备工作：检查目录结构、复制项目、修改 Main.tex 的中文支持设置，然后告诉我下一步准备翻译哪个文件。
```

### 6.2 单章节翻译提示词

每次让 AI 翻译一个文件，例如先翻译摘要：

```text
请翻译下面这个 LaTeX 章节文件：
D:\aaaaProject\graduation-project\translate-work\Chinese\Sections\0_Abstract.tex

要求：
1. 直接修改该文件。
2. 只翻译自然语言内容，保留 LaTeX 结构。
3. 不要改动 \begin{abstract}、\end{abstract}、\cite{}、\label{}、\ref{}、\cref{}、数学公式、代码、URL、图片路径。
4. 使用正式中文学术论文风格。
5. 术语按既定术语表统一。
6. 翻译后检查花括号、环境、命令是否完整。
7. 完成后给出简短说明：翻译了哪些内容，是否发现 LaTeX 风险。
```

翻译其他章节时，把文件路径替换成对应章节，例如：

```text
D:\aaaaProject\graduation-project\translate-work\Chinese\Sections\1_Introduction.tex
```

### 6.3 长章节分段翻译提示词

`4_Vector.tex`、`5_Detection.tex`、`6_Evaluation.tex`、`Appendix.tex` 比较长，建议分段处理：

```text
请翻译这个较长的 LaTeX 文件：
D:\aaaaProject\graduation-project\translate-work\Chinese\Sections\5_Detection.tex

这个文件较长，请按 subsection 或自然段分批处理。每批处理后先检查 LaTeX 命令完整性，再继续下一批。

特别注意：
1. 不要翻译 Solidity 代码、伪代码中的变量名、函数名、合约名。
2. algorithm 环境中的说明性文字可以翻译，但算法命令和变量保持原样。
3. 表格中的文字可以翻译，数字和符号保持原样。
4. \caption{} 可以翻译，\label{} 绝对不要翻译。
5. \tool 命令保持原样，它代表 PEventCatcher。

请直接修改文件，完成后总结你修改的范围，并指出是否需要编译验证。
```

### 6.4 编译与修错提示词

每完成几个章节后，让 AI 编译：

```text
请在以下目录编译中文 LaTeX 项目：
D:\aaaaProject\graduation-project\translate-work\Chinese

请优先使用：
xelatex -interaction=nonstopmode Main.tex
xelatex -interaction=nonstopmode Main.tex

如果系统有 latexmk，也可以使用：
latexmk -xelatex -interaction=nonstopmode Main.tex

如果编译失败，请读取 Main.log，定位第一个真正的错误，优先修复 LaTeX 语法、中文字体、图片路径、文件名大小写、花括号或环境不匹配问题。不要为了通过编译而删除正文内容。
```

### 6.5 术语统一检查提示词

全文初译完成后使用：

```text
请检查中文译文项目中的术语一致性：
D:\aaaaProject\graduation-project\translate-work\Chinese

重点检查 Sections 下所有 .tex 文件：
1. Phantom Events 是否统一译为“幻影事件”。
2. log forgery 是否统一译为“日志伪造”。
3. transaction log 是否统一译为“交易日志”。
4. smart contract event 是否统一译为“智能合约事件”。
5. bytecode 是否统一译为“字节码”。
6. false positive 是否统一译为“误报”。
7. mitigation 是否统一译为“缓解措施”。
8. cross-chain bridge 是否统一译为“跨链桥”。

请直接修改不一致的译法，但不要改动 LaTeX 命令、引用键、标签、公式、代码和图片路径。完成后列出主要统一项。
```

### 6.6 中英对照审校提示词

如果你想保证准确性，可以让 AI 对照原文目录和中文目录检查漏译、错译：

```text
请对比以下两个文件，检查中文译文是否忠实准确：

英文原文：
D:\aaaaProject\graduation-project\translate-work\arXiv-2502.13513v1\Sections\1_Introduction.tex

中文译文：
D:\aaaaProject\graduation-project\translate-work\Chinese\Sections\1_Introduction.tex

请重点检查：
1. 是否有段落漏译。
2. 是否有关键技术含义翻译错误。
3. 是否有数字、金额、日期、百分比、实验结果被改错。
4. 是否有引用、标签、公式、图表编号被破坏。
5. 中文是否符合学术论文表达。

请直接修改中文译文文件。不要改英文原文文件。完成后列出发现并修复的问题。
```

### 6.7 学术润色提示词

最终编译前使用：

```text
请对中文译文项目进行学术中文润色：
D:\aaaaProject\graduation-project\translate-work\Chinese

要求：
1. 保持原文技术含义不变。
2. 让中文表达更自然、正式、连贯。
3. 避免机器翻译腔，例如“这个论文”“做一个分析”“被设计来”等口语或生硬表达。
4. 保留所有 LaTeX 命令、引用、标签、公式、代码、图片路径。
5. 不要大幅改写实验结论或引入原文没有的信息。
6. 润色后尝试编译 PDF，并修复必要的 LaTeX 错误。
```

## 7. 使用普通聊天式 AI 的提示词

如果 AI 不能访问你的本地文件，你需要手动复制每个 `.tex` 文件内容给它。建议一次只给一个章节。

### 7.1 聊天式 AI 翻译提示词模板

```text
你是 LaTeX 学术论文翻译助手。请把我接下来提供的英文 LaTeX 内容翻译成中文。

严格要求：
1. 输出仍然必须是完整 LaTeX 代码。
2. 只翻译自然语言正文、章节标题、图题、表格文字。
3. 保留所有 LaTeX 命令、环境、引用、标签、数学公式、代码、URL、图片路径。
4. 不要改动 \cite{}、\label{}、\ref{}、\cref{} 中的内容。
5. 不要翻译变量名、函数名、合约名、工具名、文件名。
6. 使用正式中文学术论文风格。
7. 术语统一：
   Phantom Events = 幻影事件
   log forgery = 日志伪造
   transaction log = 交易日志
   smart contract event = 智能合约事件
   bytecode = 字节码
   source code = 源代码
   false positive = 误报
   vulnerability = 漏洞
   mitigation = 缓解措施
   cross-chain bridge = 跨链桥
   PEventCatcher = PEventCatcher

请直接输出翻译后的 LaTeX，不要额外解释。

下面是要翻译的 LaTeX 内容：
```

然后把某个 `.tex` 文件内容粘贴到提示词后面。

### 7.2 聊天式 AI 校对提示词模板

```text
请你作为学术翻译审校助手，对比英文原文和中文译文。

检查目标：
1. 找出漏译、错译、技术含义不准确的地方。
2. 检查数字、金额、日期、百分比是否保持一致。
3. 检查 LaTeX 命令、引用、标签、公式是否被破坏。
4. 检查中文表达是否符合学术论文风格。

请按以下格式输出：
1. 问题列表：指出原文位置、中文问题、修改建议。
2. 修订后的完整中文 LaTeX 内容。

英文原文如下：
[粘贴英文原文]

中文译文如下：
[粘贴中文译文]
```

## 8. 编译中文 PDF

进入中文项目目录：

```powershell
cd D:\aaaaProject\graduation-project\translate-work\Chinese
```

使用 XeLaTeX 编译两次：

```powershell
xelatex -interaction=nonstopmode Main.tex
xelatex -interaction=nonstopmode Main.tex
```

如果安装了 `latexmk`，可以使用：

```powershell
latexmk -xelatex -interaction=nonstopmode Main.tex
```

成功后会生成：

```text
D:\aaaaProject\graduation-project\translate-work\Chinese\Main.pdf
```

因为这篇论文的参考文献写在 `bibliography.tex` 的 `thebibliography` 环境里，所以通常不需要运行 BibTeX。

## 9. 常见错误与处理方式

### 9.1 中文无法显示或出现 Unicode 错误

典型原因：用了 pdfLaTeX，而不是 XeLaTeX。

处理：

```powershell
xelatex -interaction=nonstopmode Main.tex
```

并确认 `Main.tex` 中加入了：

```latex
\usepackage[UTF8,fontset=windows]{ctex}
```

### 9.2 找不到 `ctex.sty`

典型原因：LaTeX 发行版缺少中文宏包。

处理：

- MiKTeX：打开 MiKTeX Console，更新并安装缺失包。
- TeX Live：安装完整版本，或使用 `tlmgr` 安装缺失包。
- Overleaf：一般自带 `ctex`，把编译器切到 XeLaTeX。

### 9.3 字体报错

如果 `fontset=windows` 报错，改成：

```latex
\usepackage[UTF8,fontset=fandol]{ctex}
```

### 9.4 找不到图片

典型原因：图片路径或文件名被 AI 改了。

处理：

1. 检查 `\includegraphics{...}` 中的路径是否仍然指向原来的图片。
2. 确认 `Sections\Picture` 目录完整复制到了 `Chinese`。
3. 不要翻译图片文件名。

### 9.5 Overleaf 找不到 Appendix

当前原始主文件中是：

```latex
\input{Sections/appendix}
```

但实际文件名是：

```text
Appendix.tex
```

Windows 不敏感，Overleaf/Linux 敏感。上传 Overleaf 前改成：

```latex
\input{Sections/Appendix}
```

### 9.6 花括号或环境不匹配

典型原因：AI 翻译时误删了 `}`、`\end{...}` 或命令。

处理提示词：

```text
请检查这个 LaTeX 文件是否存在花括号不匹配、\begin 和 \end 不匹配、命令参数缺失的问题。请只修复 LaTeX 结构问题，不要改动正文含义。
```

### 9.7 行太长或 Overfull \hbox

这通常是排版警告，不一定影响生成 PDF。可以最后处理。

如果特别明显，可以让 AI 缩短中文句子，或在长 URL、长代码、长表格处调整排版。

## 10. 建议的执行节奏

推荐按下面节奏推进：

1. 完成 `Chinese` 目录复制。
2. 修改 `Main.tex` 支持中文。
3. 翻译 `0_Abstract.tex`。
4. 编译一次，确认中文 PDF 能生成。
5. 翻译 `1_Introduction.tex` 和 `2_Background.tex`。
6. 再编译一次。
7. 翻译 `3_Threat.tex` 和 `4_Vector.tex`。
8. 再编译一次。
9. 翻译 `5_Detection.tex`。
10. 再编译一次。
11. 翻译 `6_Evaluation.tex`、`7_Related.tex`、`8_Discussion.tex`、`9_Conclusion.tex`。
12. 翻译 `Acknowledgments.tex` 和 `Appendix.tex`。
13. 全文术语统一。
14. 中英对照审校重点章节。
15. 学术中文润色。
16. 最终编译两次，得到 `Main.pdf`。

## 11. 最终交付前检查清单

提交或打印前，至少检查：

- [ ] `Main.pdf` 可以正常打开。
- [ ] 标题、摘要、章节标题已经翻译。
- [ ] 正文没有明显英文段落残留。
- [ ] 图题、表题、表格文字已根据需要翻译。
- [ ] 引用编号正常显示，不是 `??`。
- [ ] 图表能正常显示。
- [ ] 公式、算法、代码没有被翻译破坏。
- [ ] 术语译法前后一致。
- [ ] 数字、日期、金额、百分比与原文一致。
- [ ] 参考文献格式没有被破坏。
- [ ] 学校如果要求说明 AI 使用情况，已经按学院要求如实记录。

## 12. 可以直接发给 AI 的完整任务提示词

如果你想让 AI 从头开始帮你完成整个流程，可以直接复制下面这段：

```text
请帮我把一篇英文 LaTeX 论文翻译成中文并编译成 PDF。

工作目录：
D:\aaaaProject\graduation-project\translate-work

英文原文目录：
D:\aaaaProject\graduation-project\translate-work\arXiv-2502.13513v1

中文译文目录：
D:\aaaaProject\graduation-project\translate-work\Chinese

请按以下步骤执行：
1. 检查英文原文目录结构，确认 Main.tex、bibliography.tex、Sections、图片资源是否存在。
2. 如果 Chinese 目录还没有完整项目，请从英文原文目录复制完整 LaTeX 项目到 Chinese。
3. 修改 Chinese\Main.tex，使其支持中文 XeLaTeX 编译。优先加入 \usepackage[UTF8,fontset=windows]{ctex}。如果字体报错，再改为 fontset=fandol。
4. 将论文标题翻译为中文，但作者、单位、ORCID、参考文献可保持英文。
5. 按章节翻译 Chinese\Sections 下的 .tex 文件。不要一次性翻译所有长文件；长章节按 subsection 分批。
6. 翻译时保留所有 LaTeX 命令、引用、标签、公式、代码、URL、图片路径、文件名。
7. 章节标题、正文、图题、表格文字可以翻译成中文。
8. bibliography.tex 原则上保持英文，不要破坏参考文献格式。
9. 使用以下术语表：
   Phantom Events = 幻影事件
   log forgery = 日志伪造
   transaction log = 交易日志
   smart contract event = 智能合约事件
   EVM-based blockchain = 基于 EVM 的区块链
   DApp = 去中心化应用 / DApp
   cross-chain bridge = 跨链桥
   blockchain explorer = 区块链浏览器
   cryptocurrency wallet = 加密货币钱包
   event listener = 事件监听器
   bytecode = 字节码
   source code = 源代码
   false positive = 误报
   vulnerability = 漏洞
   mitigation = 缓解措施
   attack vector = 攻击向量
   relayer = 中继器
   PEventCatcher = PEventCatcher
10. 每翻译 1 到 2 个章节后，尝试在 Chinese 目录运行：
    xelatex -interaction=nonstopmode Main.tex
    xelatex -interaction=nonstopmode Main.tex
11. 如果编译报错，请读取 Main.log，定位第一个真正错误并修复。不要为了通过编译删除正文。
12. 全文完成后，做术语统一、漏译检查、学术中文润色。
13. 最终输出 PDF 路径，并总结修改了哪些文件、是否还有需要人工确认的地方。

请先执行第 1 到第 3 步，然后停下来告诉我当前状态。
```

## 13. 人工确认建议

AI 可以极大提高翻译和排版效率，但毕业设计材料建议你自己至少做三类人工确认：

1. 技术含义：区块链、安全漏洞、智能合约相关术语是否准确。
2. 学术表达：中文是否符合论文/文献翻译风格。
3. 学校规范：学院是否允许使用 AI 辅助翻译，是否需要在过程记录或说明中注明。

这三项确认能避免“PDF 做出来了，但内容不够稳”的问题。

