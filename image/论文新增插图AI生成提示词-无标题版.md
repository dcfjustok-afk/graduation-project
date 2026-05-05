# 论文新增插图 AI 生成提示词（无标题版）

论文题目：《基于区块链的可信任务日志审计系统设计与实现》

本文件用于生成新增论文插图。所有图片请统一保存到 `D:\aaaProject\graduation-project\image` 目录。图片本体内部不要出现“图 X-X ……”这类论文图题，图题只保留在 Word 正文图片下方。

## 通用要求

- 输出格式：PNG。
- 推荐尺寸：1920x1080，横向 16:9。
- 图片风格：本科软件工程毕业论文技术图，正式、清晰、克制、学术化。
- 背景：白色或极浅灰色。
- 文字：允许使用简短中文标签，但不要把论文图题写进图片内部。
- 禁止内容：水印、二维码、真实公司 Logo、比特币 Logo、人物、卡通装饰、复杂深色背景、论文中不存在的技术组件。
- 如果生成工具不能稳定生成中文，优先生成无文字结构图，再用 PPT、draw.io、ProcessOn 或 Word 手动添加中文标签。

## 图 2-1 区块链存证基本结构示意图

- 建议保存文件：`image/fig-2-1-blockchain-evidence-structure.png`
- 对应章节：`2.1 区块链与链上存证技术`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 横向 16:9，白色背景，正式论文技术图风格。
  - 左侧为“链下业务数据”，包含日志原文、数据库记录、业务标识。
  - 中间为“哈希摘要生成”和“交易提交”，展示 SHA-256 摘要进入交易。
  - 右侧为连续区块，区块之间用前一区块哈希连接，标注交易摘要、时间戳、区块哈希。
  - 底部展示“后续审计校验”，从链下数据重新计算摘要并与链上记录比对。

### 直接复制给图片生成工具的提示词

```text
生成一张本科软件工程毕业论文使用的区块链存证基本结构示意图。画面为横向 16:9，白色背景，正式、清晰、学术化，不要在图片内部写“图 2-1”或任何论文图题。左侧绘制链下业务数据区域，包含日志原文、数据库记录、业务标识等卡片；中间绘制 SHA-256 哈希摘要生成和交易提交过程；右侧绘制 3 至 4 个相连区块，每个区块内部包含交易摘要、时间戳、区块哈希、前一区块哈希等简化字段；底部绘制后续审计校验过程，从链下数据重新计算摘要并与链上记录比对。颜色以蓝色、青色、绿色为主，少量橙色用于校验节点。文字使用简洁中文标签，文字清晰无错别字。不要出现比特币 Logo、公司 Logo、水印、二维码、人物、卡通装饰、复杂渐变背景。输出 PNG，建议 1920x1080，保存为 image/fig-2-1-blockchain-evidence-structure.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 2-2 哈希完整性校验原理图

- 建议保存文件：`image/fig-2-2-hash-integrity-verification.png`
- 对应章节：`2.3 哈希摘要与日志完整性校验技术`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 上下两条对比流程：原始日志与修改后日志。
  - 两条流程都经过 SHA-256 计算节点，分别得到哈希摘要 A 与哈希摘要 B。
  - 右侧使用对比符号展示摘要不一致，并标注“内容变化可被检测”。
  - 突出单向性、固定长度摘要、雪崩效应、完整性校验。

### 直接复制给图片生成工具的提示词

```text
生成一张本科毕业论文使用的哈希完整性校验原理图。画面为横向 16:9，白色背景，简洁学术风格，不要在图片内部写“图 2-2”或任何论文图题。上方流程为“原始日志内容 -> SHA-256 哈希计算 -> 哈希摘要 A”；下方流程为“修改后日志内容 -> SHA-256 哈希计算 -> 哈希摘要 B”。右侧用清晰的对比符号展示“哈希摘要 A 不等于哈希摘要 B”，并标注“日志内容变化可被检测”。图中可以用三个小标签说明“单向性、固定长度摘要、雪崩效应”，但不要展开过多密码学理论。颜色以蓝色和橙色为主，原始流程使用蓝色，修改后流程使用橙色或红色提示差异。文字必须清晰，不要错别字，不要使用英文长句，不要出现水印、Logo、人物或卡通装饰。输出 PNG，建议 1920x1080，保存为 image/fig-2-2-hash-integrity-verification.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 3-4 LogRegistry 合约数据结构关系图

- 建议保存文件：`image/fig-3-4-logregistry-data-structure.png`
- 对应章节：`3.3.1 合约数据结构设计`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 中心为 LogRecord 结构体，字段 taskId、logHash、createdAt、submitter。
  - 左侧或上方展示 records 数组，按 recordId 顺序保存 LogRecord。
  - 右侧展示 taskIdToRecordIds 映射，一个 taskId 对应多个 recordId。
  - 展示 storeLog 写入和 getLogsByTaskId 查询方向。

### 直接复制给图片生成工具的提示词

```text
生成一张本科软件工程毕业论文使用的智能合约数据结构关系图。画面为横向 16:9，白色背景，正式工程图风格，不要在图片内部写“图 3-4”或任何论文图题。中心绘制 LogRecord 结构体卡片，字段包括 taskId、logHash、createdAt、submitter；左侧绘制 records 数组，展示 recordId 0、recordId 1、recordId 2 等编号顺序保存 LogRecord；右侧绘制 taskIdToRecordIds 映射，展示同一个 taskId 可以对应多个 recordId。用箭头表示 storeLog 写入 records 和 taskIdToRecordIds，用另一组箭头表示 getLog 按编号查询、getLogsByTaskId 按任务查询。图中只展示论文中真实存在的合约字段和查询能力，不要加入余额、转账、NFT、Token 等无关内容。配色使用绿色表示链上合约，蓝色表示查询，橙色表示写入。输出 PNG，建议 1920x1080，保存为 image/fig-3-4-logregistry-data-structure.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 3-5 历史合约地址回溯审计策略图

- 建议保存文件：`image/fig-3-5-contract-address-tracing-audit.png`
- 对应章节：`3.4.2 历史合约地址回溯审计策略`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 左侧展示日志提交阶段：写入 LogRegistry，同时保存 contract_address、transaction_hash、block_number。
  - 右侧展示审计阶段：读取 log_hash_records.contract_address，连接历史合约地址查询 onChainHash。
  - 突出避免当前配置地址与历史写入地址不一致造成误判。

### 直接复制给图片生成工具的提示词

```text
生成一张本科毕业论文使用的历史合约地址回溯审计策略图。画面为横向 16:9，白色背景，正式流程图风格，不要在图片内部写“图 3-5”或任何论文图题。左侧区域标题为“日志提交阶段”，展示 Server 调用 LogRegistry.storeLog(taskId, logHash)，并将 contract_address、transaction_hash、block_number、on_chain_status 写入 log_hash_records。右侧区域标题为“审计阶段”，展示审计服务读取 log_hash_records.contract_address，连接当时写入的 LogRegistry 合约地址，再查询 onChainHash。图中加入一个对比提示：如果只读取当前环境变量合约地址，可能因 Hardhat 本地链重启或多次部署造成历史日志误判；使用 contract_address 回溯可以定位历史写入合约。不要加入不存在的跨链、联盟链节点、公开链浏览器等功能。配色以蓝色表示后端，绿色表示合约，紫色表示历史地址，橙色表示风险提示。输出 PNG，建议 1920x1080，保存为 image/fig-3-5-contract-address-tracing-audit.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 3-6 合约代码存在性校验流程图

- 建议保存文件：`image/fig-3-6-contract-code-existence-check.png`
- 对应章节：`3.4.3 合约代码存在性校验机制`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 流程：读取 contract_address -> provider.getCode(address) -> 判断字节码是否为空。
  - 存在字节码：继续 storeLog 或 getLog/getLogsByTaskId。
  - 不存在字节码：不继续链上读写，记录 pending 或异常说明。
  - 突出本地链重启后空地址误判问题。

### 直接复制给图片生成工具的提示词

```text
生成一张本科毕业论文使用的合约代码存在性校验流程图。画面为横向 16:9，白色背景，正式技术流程图风格，不要在图片内部写“图 3-6”或任何论文图题。流程节点依次为：读取 contract_address；调用 provider.getCode(address)；判断返回字节码是否为空；如果存在合约代码，则继续执行 storeLog 或 getLog/getLogsByTaskId；如果不存在合约代码，则停止链上读写，并将审计结果标记为 pending 或记录异常说明。图中需要明确说明该机制用于避免 Hardhat 本地链重启后空地址误判。使用菱形表示判断节点，绿色分支表示可继续调用，黄色或红色分支表示合约不可用。不要加入论文未实现的自动部署、自动修复、区块链浏览器查询等功能。输出 PNG，建议 1920x1080，保存为 image/fig-3-6-contract-code-existence-check.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 4-3 核心数据库 ER 关系图

- 建议保存文件：`image/fig-4-3-database-er-relationship.png`
- 对应章节：`4.7 数据库设计`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 五张表：logs、log_hash_records、audit_records、alerts、agent_states。
  - 重点关系：logs.id -> log_hash_records.log_id；log_hash_records.id -> audit_records.log_hash_record_id。
  - alerts.related_log_id -> logs.id；alerts.related_audit_id -> audit_records.id。
  - agent_states 独立记录采集端状态，与日志采集来源相关。

### 直接复制给图片生成工具的提示词

```text
生成一张本科软件工程毕业论文使用的核心数据库 ER 关系图。画面为横向 16:9，白色背景，正式数据库设计图风格，不要在图片内部写“图 4-3”或任何论文图题。图中包含五张表：logs、log_hash_records、audit_records、alerts、agent_states。每张表用矩形表结构表示，列出核心字段。logs 表包含 id、task_id、source_type、source_path、log_content、log_level、collected_at、status；log_hash_records 表包含 id、log_id、task_id、log_hash、contract_address、transaction_hash、block_number、on_chain_status；audit_records 表包含 id、log_id、log_hash_record_id、audit_status、expected_hash、actual_hash、audited_at；alerts 表包含 id、alert_type、related_log_id、related_audit_id、severity、status；agent_states 表包含 id、source_path、last_offset、last_heartbeat_at、last_sync_at、status。用连线展示 logs.id 到 log_hash_records.log_id，log_hash_records.id 到 audit_records.log_hash_record_id，logs.id 到 alerts.related_log_id，audit_records.id 到 alerts.related_audit_id。agent_states 可以单独放置，并标注用于记录 Agent 状态。不要加入论文中不存在的数据表或字段。输出 PNG，建议 1920x1080，保存为 image/fig-4-3-database-er-relationship.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 5-1 Agent 增量采集与偏移量持久化流程图

- 建议保存文件：`image/fig-5-1-agent-incremental-offset-flow.png`
- 对应章节：`5.2.1 增量读取与偏移量持久化实现`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 流程：读取 sourcePath -> 获取 last_offset -> 读取新增日志 -> logCollector 封装。
  - 提交 Server 成功后更新 offsetStore。
  - 提交失败进入 retryQueue，暂不更新偏移量。
  - 状态同步写入 agent_states。

### 直接复制给图片生成工具的提示词

```text
生成一张本科毕业论文使用的 Agent 增量采集与偏移量持久化流程图。画面为横向 16:9，白色背景，正式软件工程流程图风格，不要在图片内部写“图 5-1”或任何论文图题。流程从左到右依次展示：读取 sourcePath；从 offsetStore 获取 last_offset；fileReader 从偏移量之后读取新增日志；logCollector 封装 taskId、sourceType、sourcePath、logContent、logLevel、collectedAt；提交 Server；如果提交成功，则更新 offsetStore 中的 last_offset，并同步 agent_states；如果提交失败，则进入 retryQueue，等待下一轮重试，且暂不更新偏移量。图中要突出“成功后更新偏移量、失败时保留待提交日志”的原则。不要加入消息队列 Kafka、Redis、容器平台等论文未使用技术。输出 PNG，建议 1920x1080，保存为 image/fig-5-1-agent-incremental-offset-flow.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 5-2 后端分层架构图

- 建议保存文件：`image/fig-5-2-backend-layered-architecture.png`
- 对应章节：`5.3.1 后端分层架构与核心接口实现`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 外部调用方：Agent、Web 前端、实验脚本。
  - 接口：POST /api/logs、POST /api/audits/run、GET /api/alerts、GET /api/logs。
  - 后端层次：routes、controllers、services、repositories、db、blockchain。
  - 外部资源：SQLite、LogRegistry。

### 直接复制给图片生成工具的提示词

```text
生成一张本科软件工程毕业论文使用的后端分层架构图。画面为横向 16:9，白色背景，正式系统实现图风格，不要在图片内部写“图 5-2”或任何论文图题。左侧展示外部调用方：Agent、Web 前端、性能测试脚本。中间展示 Express 后端分层，从上到下或从左到右依次为 routes、controllers、services、repositories、db、blockchain。routes 层标注 POST /api/logs、GET /api/logs、POST /api/audits/run、GET /api/alerts；controllers 层标注参数读取、校验、响应封装；services 层标注日志服务、区块链服务、审计执行服务、告警服务、总览服务；repositories/db 层连接 SQLite；blockchain 层连接 LogRegistry。右侧展示 SQLite 和 LogRegistry 两个外部资源。不要加入论文未使用的 MySQL、Redis、Kafka、Docker、Kubernetes 等技术。颜色清晰、文字简洁，适合插入 Word。输出 PNG，建议 1920x1080，保存为 image/fig-5-2-backend-layered-architecture.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 图 5-7 篡改检测实验闭环示意图

- 建议保存文件：`image/fig-5-7-tamper-detection-loop.png`
- 对应章节：`5.6.3 篡改检测实验与结果分析`
- 图片内部标题：不要出现论文图题，不要出现“图 X-X”。
- 图片内容要点：
  - 正常提交：logs、log_hash_records、LogRegistry。
  - 修改日志内容。
  - 审计重算 actualHash，与 expectedHash、onChainHash 比对。
  - auditStatus=failed，alertGenerated=true，生成 hash_mismatch 告警。

### 直接复制给图片生成工具的提示词

```text
生成一张本科毕业论文使用的篡改检测实验闭环示意图。画面为横向 16:9，白色背景，正式实验流程图风格，不要在图片内部写“图 5-7”或任何论文图题。流程依次展示：正常日志提交；日志原文写入 logs 表；log_hash 写入 log_hash_records；logHash 写入 LogRegistry；随后日志内容被修改；审计阶段重新计算 actualHash；与 expectedHash、onChainHash 进行三方比对；比对不一致后生成 auditStatus=failed；同时 alertGenerated=true，并写入 hash_mismatch 告警。图中突出“日志内容被修改 -> 哈希不一致 -> failed -> 告警生成”的闭环。不要加入机器学习异常检测、自动修复、邮件通知等论文未实现功能。输出 PNG，建议 1920x1080，保存为 image/fig-5-7-tamper-detection-loop.png。
```

### 负面提示词

```text
不要在图片内部生成论文图题，不要出现水印、二维码、真实公司 Logo、人物、卡通装饰、复杂深色背景、错别字、乱码，不要加入论文没有实现的功能或技术栈。
```

## 生成后插入说明

1. 按上述文件名生成 PNG 并保存到 `image` 目录。
2. Word 中已经预留了对应图片位置，位置处有“待生成并插入图片”占位文字。
3. 图片生成后，可将占位文字替换为对应 PNG，保留下方的图题。
4. 图片本体不需要标题，因为 Word 下方已经有正式图题。
