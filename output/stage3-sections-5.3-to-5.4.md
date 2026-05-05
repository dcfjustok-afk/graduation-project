## 5.3 后端服务与数据持久化实现

后端服务是系统连接日志采集端、链下数据库、智能合约与前端页面的核心层。Agent 采集到日志后，需要经由后端完成接收、校验、入库、哈希计算和链上存证；审计阶段又需要由后端读取日志原文、查询数据库哈希和链上哈希，并将比对结果保存为审计记录或告警记录。因此，后端不仅承担数据转发功能，还负责可信日志审计流程的业务编排和数据一致性维护。

本系统后端基于 Node.js、Express 和 TypeScript 实现，采用 routes、controllers、services、repositories、db、blockchain 等分层结构。routes 层声明接口路径，controllers 层处理请求参数和响应结果，services 层组织核心业务流程，repositories 层封装 SQLite 数据访问，db 层提供数据库连接和表结构初始化能力，blockchain 层封装 LogRegistry 合约交互、哈希处理和合约代码存在性校验。通过分层组织，日志接收、链下持久化、链上写入、审计执行和告警查询等职责被清晰拆分，降低了模块之间的耦合程度。

### 5.3.1 后端分层架构与核心接口实现

后端接口以 REST API 形式向 Agent、前端页面和实验脚本提供服务。routes 层负责将不同访问路径分发到对应控制器，例如日志路由、审计路由、告警路由和总览路由。controllers 层位于路由与业务服务之间，主要完成请求体读取、基础参数校验、异常捕获和统一响应封装。以 POST /api/logs 为例，控制器接收 taskId、sourceType、sourcePath、logContent、logLevel、collectedAt 等字段后，将日志提交请求交由服务层处理。

services 层是后端业务逻辑的主要承载位置。日志服务负责日志查询和 Agent 状态同步，区块链服务负责组织日志入库、SHA-256 哈希计算和 LogRegistry 写入，审计执行服务负责批量审计、单条审计和三方哈希比对，告警服务负责异常告警查询，总览服务负责聚合日志数量、审计数量和告警数量等指标。repositories 层则负责访问 logs、log_hash_records、audit_records、alerts、agent_states 等 SQLite 表，使上层服务无需直接处理 SQL 细节。

核心接口围绕系统主流程展开。POST /api/logs 是日志进入系统的入口，用于接收 Agent 上报或前端模拟提交的日志；GET /api/logs 用于日志中心列表展示；POST /api/audits/run 用于触发批量审计；GET /api/audits 用于查看审计记录；GET /api/alerts 用于查询异常告警；GET /api/overview 用于提供总览统计数据。这些接口共同构成后端服务边界，使日志采集、审计执行和前端展示能够通过统一 API 协同运行。

本节关键信息摘要：

1. 后端采用 routes、controllers、services、repositories、db、blockchain 分层结构。
2. services 层负责编排日志入库、上链、审计和告警等核心流程。
3. 核心接口包括 POST /api/logs、POST /api/audits/run、GET /api/alerts 等。

### 5.3.2 日志入库、哈希计算与上链流程实现

日志入库、哈希计算与上链流程是后端实现可信存证的关键路径。当 POST /api/logs 接收到日志后，系统首先将日志原文及其来源信息保存到 logs 表，形成可查询、可展示、可重算的链下日志记录。logs 表中的 log_content 是后续审计阶段重新计算 actualHash 的基础，因此系统需要保持日志正文与 task_id、source_path、collected_at 等元数据之间的稳定关联。

日志保存完成后，后端对 log_content 计算 SHA-256 摘要，生成以 0x 开头的十六进制哈希值。该哈希值代表日志提交时的内容指纹，用于后续完整性校验。随后，后端通过 blockchain 层连接 LogRegistry 合约，调用 storeLog(taskId, logHash) 将 taskId 与 logHash 写入链上。合约记录中的 taskId、logHash、createdAt、submitter 为审计阶段提供链上依据。

链上写入成功后，系统将 log_id、task_id、log_hash、contract_address、transaction_hash、block_number 和 on_chain_status 等信息保存到 log_hash_records 表。该表承担链下日志与链上存证之间的映射作用：log_id 指向 logs 表中的日志原文，log_hash 保存数据库中的期望哈希 expectedHash，contract_address、transaction_hash 和 block_number 用于定位链上存证记录。审计时系统可以根据 log_id 找到对应存证记录，再结合合约查询获得 onChainHash。

考虑到本系统使用 Hardhat 本地链进行实验，链重启或合约多次部署可能导致历史合约地址失效。为降低误判风险，后端在链上读写前通过 provider.getCode(address) 校验合约地址是否存在字节码，并在审计时优先使用 log_hash_records.contract_address 回溯当时写入的合约地址。该处理使日志存证流程不仅能够完成正常上链，也能在实验环境变化时保留更明确的审计依据。

本节关键信息摘要：

1. logs 表保存日志原文和来源信息，是审计重算 actualHash 的基础。
2. 后端对 log_content 计算 SHA-256，并通过 storeLog 写入 LogRegistry。
3. log_hash_records 表保存链下日志与链上交易之间的映射关系。
4. 合约代码存在性校验和历史合约地址回溯提升了实验环境下的健壮性。

### 5.3.3 审计记录与告警数据表实现

审计记录与告警数据表用于保存日志可信性判断结果，是后端形成审计闭环的重要支撑。当前端或脚本调用 POST /api/audits/run 后，审计执行服务会读取待审计日志及其存证记录，重新计算日志原文哈希，并查询链上 LogRegistry 记录。比对完成后，系统将审计结果写入 audit_records 表；若发现哈希不一致，则进一步生成 alerts 表中的异常告警。

audit_records 表主要记录每次审计的执行结果，关键字段包括 log_id、log_hash_record_id、audit_status、expected_hash、actual_hash、on_chain_hash、audit_message 和 audited_at 等。其中，expected_hash 来自 log_hash_records，actual_hash 来自审计阶段对 logs.log_content 的重新计算，on_chain_hash 来自 LogRegistry 查询结果。三者一致时 audit_status 写为 passed；若数据库哈希、重算哈希或链上哈希存在不一致，则写为 failed；若链上记录缺失或暂不可用，则可写为 pending，以表示证据尚不完整。

alerts 表用于保存审计失败后的异常提示。当审计状态为 failed 时，系统生成 hash_mismatch 类型告警，并记录 related_log_id、related_audit_id、title、description、severity、status 等字段。related_log_id 用于定位异常日志，related_audit_id 用于追溯触发告警的审计记录，severity 和 status 用于支持前端展示风险等级和处理状态。通过审计记录与告警记录的关联，系统能够从“发现异常”进一步延伸到“提示异常并支持追踪”。

从页面展示角度看，GET /api/audits 为审计管理页面提供历史结果，GET /api/alerts 为告警管理页面提供异常列表，GET /api/overview 则基于日志、审计和告警表生成统计指标。审计记录回答日志是否可信，告警记录回答异常如何提示和追踪，二者共同支撑篡改检测实验中的 failed 审计记录和 hash_mismatch 告警展示。

本节关键信息摘要：

1. audit_records 表保存 expected_hash、actual_hash、on_chain_hash 和 audit_status。
2. 审计状态包括 passed、failed、pending，分别对应通过、异常和证据不完整。
3. failed 结果会生成 hash_mismatch 告警并写入 alerts 表。
4. related_log_id 与 related_audit_id 支撑异常日志和审计记录回溯。

## 5.4 前端可视化模块实现

前端可视化模块用于向系统使用者展示日志、审计和告警信息。可信日志审计涉及日志采集状态、链下存储状态、链上存证结果、审计执行结果和异常告警等多类数据，如果只通过接口或数据库查看，难以直观体现系统运行效果。本系统基于 React、TypeScript 和 Ant Design 实现 Web 前端，通过系统总览、日志中心、审计管理和告警管理等页面，将后端数据转换为可浏览、可检索和可对比的界面信息。

前端不直接访问数据库或区块链，而是通过 API 客户端调用后端 REST 接口。页面加载时，系统调用 GET /api/overview 获取总览统计，调用 GET /api/logs 获取日志列表，调用 GET /api/audits 获取审计记录，调用 GET /api/alerts 获取异常告警。用户触发审计操作时，前端调用 POST /api/audits/run，并在审计完成后刷新页面状态。该交互方式保持了前端展示层与后端可信逻辑之间的职责边界。

### 5.4.1 系统总览与日志中心实现

系统总览页面用于呈现系统整体运行状态。页面通过统计卡片展示日志总量、审计记录数、活动告警数、审计通过数量和异常数量等指标，使用户能够快速了解当前审计系统的数据规模和风险情况。同时，前端使用 LineTrendChart 展示日志趋势，使用 DistributionChart 展示审计状态分布和异常等级分布，从而将日志、审计和告警数据以图形化方式表达。

图 5-1 系统总览页面截图

日志中心页面用于展示链下保存的日志记录。页面通过 GET /api/logs 读取日志列表，并结合审计记录映射日志状态，展示任务标识、日志级别、来源路径、采集时间和当前状态等信息。页面提供关键字检索功能，便于根据任务标识、日志内容或来源路径定位目标日志。对于已审计通过、待审计和异常记录，前端通过不同状态标签进行区分，提高了日志浏览和问题定位效率。

本节关键信息摘要：

1. 系统总览展示日志数量、审计数量、告警数量和异常状态等指标。
2. 趋势图和分布图用于呈现日志变化、审计状态和异常等级分布。
3. 日志中心通过 GET /api/logs 展示日志列表，并支持关键字检索。

### 5.4.2 审计管理与告警管理实现

审计管理页面用于展示审计执行状态，并提供批量审计操作入口。页面加载时读取日志、审计和统计数据，生成审计摘要、状态分布、日志趋势和最近审计对象列表。用户点击审计按钮后，前端调用 POST /api/audits/run，由后端执行三方哈希比对；审计完成后，页面刷新 passed、failed 和 pending 等状态，使审计结果能够及时反映到统计卡片、表格和图表中。

告警管理页面用于集中展示 alerts 表中的异常信息。页面通过 GET /api/alerts 获取告警列表，展示告警总数、待处理数量、处理中数量、高危占比、告警标题、描述、严重程度和处理状态等内容。对于 hash_mismatch 类型告警，页面能够提示其来源于日志哈希不一致，并通过关联日志和审计记录辅助用户追踪异常原因。

图 5-2 审计管理与告警管理页面截图

前端数据处理主要集中在 API 客户端、dataService 和 mappers 中。API 客户端负责请求后端接口，dataService 负责组合日志、审计和告警数据，mappers 负责将服务端字段转换为页面视图模型。例如，日志记录会被转换为日志中心所需的 LogRecord，告警记录会被转换为告警页面所需的 AlertRecord，审计与日志数据会被聚合为趋势点和分布项。通过该方式，前端能够清晰展示后端可信审计结果，同时保持页面组件结构相对简洁。

本节关键信息摘要：

1. 审计管理页面通过 POST /api/audits/run 触发批量审计。
2. 审计结果通过统计卡片、表格、趋势图、分布图和状态标签展示。
3. 告警管理页面通过 GET /api/alerts 展示 hash_mismatch 等异常告警。
4. API 客户端、dataService 和 mappers 保持接口数据与页面视图之间的清晰边界。
