## 4.5 系统功能模块设计

本系统按照日志可信审计的业务流程划分功能模块，主要包括日志采集 Agent 模块、后端服务模块、区块链存证模块、审计告警模块和前端可视化模块。各模块围绕任务标识和日志哈希进行数据传递，分别承担采集、处理、存证、审计、告警和展示等职责。通过模块化设计，系统能够将不同功能边界清晰分离，降低实现复杂度，并便于后续测试和论文说明。

### 4.5.1 日志采集 Agent 模块

日志采集 Agent 模块负责从本地日志文件中获取新增日志内容，是系统数据进入可信审计流程的入口。该模块的输入主要是指定路径下的日志文件和本地保存的读取偏移量，输出则是封装后的日志提交数据和 Agent 运行状态。Agent 需要根据上次读取位置识别新增内容，避免重复采集已处理日志，并在采集后将日志内容、任务标识、来源路径、日志级别和采集时间等信息提交给后端服务。

该模块与后端服务模块直接交互，通过日志提交接口将采集结果发送至 Server，并通过状态同步接口上报 Agent 当前运行状态、最后读取偏移量和同步时间。当后端服务暂时不可用或网络异常时，Agent 需要具备失败重试能力，以提高日志提交过程的可靠性。日志采集 Agent 模块的设计目标是降低人工导入日志的依赖，使任务日志能够持续、自动地进入后续存证与审计流程。

本节关键信息摘要：

1. Agent 模块是系统日志数据进入审计流程的入口。
2. 模块输入为日志文件和读取偏移量，输出为标准化日志数据和运行状态。
3. Agent 与后端服务通过日志提交和状态同步接口交互。
4. 增量读取和失败重试能力有助于提高日志采集可靠性。

### 4.5.2 后端服务模块

后端服务模块是系统业务处理中心，负责连接日志采集、链下存储、链上存证、审计告警和前端展示等功能。该模块的输入包括 Agent 提交的日志数据、前端发起的查询请求和审计触发请求；输出包括日志列表、审计结果、告警信息、总览统计数据以及链上写入结果。后端服务需要完成日志入库、哈希计算、合约调用、审计执行、告警生成和数据查询等业务操作。

从模块关系看，后端服务一方面接收 Agent 采集的日志，将日志原文保存到 SQLite，并调用哈希服务生成日志摘要；另一方面调用 LogRegistry 合约完成链上存证，并将交易哈希、区块号、合约地址等信息保存到 log_hash_records 表中。审计阶段，后端服务从 SQLite 读取日志和哈希记录，从区块链合约读取链上哈希，执行三方比对，并根据结果写入 audit_records 和 alerts 表。前端所有展示数据也主要通过后端 API 获取。

本节关键信息摘要：

1. 后端服务模块是系统业务编排中心。
2. 模块负责日志入库、哈希计算、合约调用、审计执行和告警生成。
3. 后端同时连接 Agent、SQLite、LogRegistry 和 Web 前端。
4. 后端分层结构有助于提升系统可维护性。

### 4.5.3 区块链存证模块

区块链存证模块负责将日志哈希写入链上，并在审计阶段提供链上记录查询能力。该模块的核心是 LogRegistry 智能合约，其输入主要包括任务标识 taskId 和日志哈希 logHash，输出则是链上存证记录、交易哈希、区块号和查询结果。合约记录 taskId、logHash、createdAt 和 submitter 等字段，用于描述每条链上存证记录。

该模块与后端服务模块紧密关联。日志提交阶段，后端在完成日志入库和哈希计算后调用 storeLog 方法，将日志哈希写入链上。审计阶段，后端根据任务标识和合约地址调用 getLogsByTaskId 等查询方法，读取链上哈希记录。区块链存证模块不直接处理日志原文，而是保存摘要形式的完整性证据。通过 LOGGER_ROLE 权限控制，该模块能够限制链上写入主体，避免任意地址污染存证数据。

本节关键信息摘要：

1. 区块链存证模块以 LogRegistry 智能合约为核心。
2. 模块输入为 taskId 和 logHash，输出为链上存证记录和查询结果。
3. storeLog 用于写入日志哈希，getLogsByTaskId 用于任务维度查询。
4. LOGGER_ROLE 权限控制保证链上写入来源可信。

### 4.5.4 审计告警模块

审计告警模块负责执行日志完整性校验，并在发现异常时生成告警记录。该模块的输入包括待审计日志、数据库中的哈希记录和链上查询得到的哈希记录；输出包括审计状态、审计说明、审计记录和异常告警。其核心逻辑是重新计算日志原文的 actualHash，并与 expectedHash 和 onChainHash 进行三方比对。

当三方哈希一致时，审计告警模块生成 passed 状态的审计记录；当哈希不一致时，生成 failed 状态的审计记录，并进一步写入 hash_mismatch 类型告警；当链上记录暂不可用或证据不完整时，可生成 pending 状态。该模块与数据库模块和区块链存证模块均存在交互，需要读取 logs、log_hash_records 和链上 LogRegistry 记录，同时将结果写入 audit_records 和 alerts 表。审计告警模块使系统能够从单纯记录日志扩展到主动识别日志篡改风险。

本节关键信息摘要：

1. 审计告警模块负责完整性校验和异常风险提示。
2. 模块基于 expectedHash、actualHash 和 onChainHash 进行三方比对。
3. 审计结果包括 passed、failed 和 pending。
4. failed 状态会触发 hash_mismatch 告警并写入 alerts 表。

### 4.5.5 前端可视化模块

前端可视化模块负责将系统运行状态、日志数据、审计结果和告警信息展示给用户。该模块的输入主要来自后端 API 返回的数据，输出则是面向用户的页面视图。前端需要展示系统总览、日志中心、审计管理和告警管理等页面，使用户能够直观了解日志数量、审计状态、异常告警和趋势信息。

该模块与后端服务模块交互，不直接访问数据库或区块链合约。前端通过统一接口获取日志列表、审计记录、告警记录和统计数据，并将后端返回的原始数据转换为适合页面展示的视图模型。系统总览页面用于展示总体指标，日志中心用于查看日志明细，审计管理页面用于查看审计状态和执行结果，告警管理页面用于查看哈希不一致等异常事件。前端可视化模块提高了系统的可用性，也为毕业设计演示提供了直观支撑。

本节关键信息摘要：

1. 前端可视化模块负责展示日志、审计、告警和系统统计信息。
2. 前端通过后端 API 获取数据，不直接操作数据库或智能合约。
3. 主要页面包括系统总览、日志中心、审计管理和告警管理。
4. 可视化展示有助于提升系统可用性和演示效果。

## 4.6 系统数据流与业务流程设计

系统数据流围绕日志可信审计目标展开，主要包括两条核心业务流程：日志采集与存证流程、审计与告警流程。前者负责将任务日志从日志文件引入系统，并完成链下存储和链上存证；后者负责在审计阶段重新核验日志完整性，并在发现异常时生成告警。两条流程通过 logs、log_hash_records、audit_records、alerts 和 LogRegistry 链上记录建立关联，共同支撑系统可信日志审计闭环。

第一条流程是日志采集与存证流程。任务执行过程中产生的日志首先保存在本地日志文件中。Agent 根据配置读取日志文件，并通过偏移量机制识别新增日志内容。读取到新增日志后，Agent 将日志封装为标准提交数据，包含 taskId、sourceType、sourcePath、logContent、logLevel 和 collectedAt 等字段，并通过后端接口提交给 Server。Server 接收到日志后，首先将日志原文和元数据写入 SQLite 的 logs 表，为后续查询、展示和审计重算提供链下数据基础。

日志入库后，Server 对 logContent 执行 SHA-256 哈希计算，得到固定长度的日志哈希。该哈希值一方面写入 log_hash_records 表，作为数据库中的 expectedHash；另一方面作为参数提交给 LogRegistry 智能合约。Server 调用 storeLog(taskId, logHash) 方法，将任务标识和日志哈希写入链上。链上交易完成后，Server 将 transaction_hash、block_number、contract_address 和 on_chain_status 等信息保存到 log_hash_records 表中。至此，系统完成一条日志从采集、入库、哈希计算到链上存证的全过程。

第二条流程是审计与告警流程。用户或系统脚本触发审计任务后，Server 根据待审计日志的 log_id 读取 logs 表中的日志原文，并使用相同的 SHA-256 规则重新计算 actualHash。随后，Server 从 log_hash_records 表中读取 expectedHash 和 contract_address，并根据 taskId 查询对应 LogRegistry 合约中的链上记录，获得 onChainHash。系统将 actualHash、expectedHash 和 onChainHash 进行比对，并根据比对结果生成 passed、failed 或 pending 状态的审计记录。

当三方哈希一致时，系统将审计结果写入 audit_records 表，并更新日志状态为审计通过。若 actualHash 与 expectedHash 或 onChainHash 不一致，说明链下日志内容可能已经被修改，系统将审计状态判定为 failed，并生成 hash_mismatch 类型告警。告警记录写入 alerts 表，并通过 related_log_id 和 related_audit_id 分别关联异常日志和审计记录。前端 Web 模块通过后端 API 获取日志、审计和告警数据，并在系统总览、日志中心、审计管理和告警管理页面展示结果。

图 4-2 系统数据流图

从整体流程看，日志采集与存证流程负责生成可信证据，审计与告警流程负责使用可信证据验证当前日志状态。Agent、Server、SQLite、LogRegistry 和 Web 在两条流程中各自承担不同职责。Agent 保证日志进入系统，Server 负责业务编排和哈希计算，SQLite 保存链下业务数据，LogRegistry 保存链上存证记录，Web 展示审计和告警结果。通过这两条流程，系统实现了从日志产生到异常反馈的完整闭环。

本节关键信息摘要：

1. 系统数据流包括日志采集与存证流程、审计与告警流程。
2. 日志采集与存证流程覆盖 Agent 提交、Server 入库、哈希计算和合约写入。
3. 审计与告警流程覆盖审计触发、链上查询、三方比对和告警生成。
4. logs、log_hash_records、audit_records、alerts 和 LogRegistry 共同支撑数据流转。
5. Web 前端负责展示日志、审计和告警结果，使闭环可视化。

## 4.7 数据库设计

数据库设计是系统链下数据管理的基础。本系统采用 SQLite 作为原型系统的数据存储方案，主要用于保存日志原文、链上存证记录、审计结果、异常告警和 Agent 运行状态。与链上 LogRegistry 合约相比，SQLite 更适合保存结构化业务数据和日志原文，便于后端查询和前端展示。系统通过 logs、log_hash_records、audit_records、alerts 和 agent_states 五张核心表支撑业务流程。

### 4.7.1 日志数据表设计

logs 表用于保存日志原文及采集来源信息，是系统最基础的数据表。该表的核心字段包括 id、task_id、source_type、source_path、log_content、log_level、collected_at、created_at、updated_at 和 status。其中，id 是日志记录主键，用于唯一标识一条链下日志；task_id 表示日志所属任务，是连接链上存证记录和审计记录的重要业务字段；source_type 表示日志来源类型；source_path 记录日志文件路径；log_content 保存日志原文，是哈希计算和审计重算的基础。

log_level 用于记录日志级别，便于前端筛选和展示；collected_at 表示日志采集时间；created_at 和 updated_at 用于记录数据库写入和更新时间；status 用于标识日志当前状态，例如 collected、audit_passed、audit_failed 或 audit_pending。logs 表与 log_hash_records 表通过 id 和 log_id 建立关联，与 audit_records 表也可通过 log_id 建立关联。该表为系统提供链下日志原文和状态管理能力。

本节关键信息摘要：

1. logs 表用于保存日志原文和采集来源信息。
2. task_id 是日志任务归属和链上查询的重要关联字段。
3. log_content 是哈希计算和审计重算的基础。
4. status 字段用于记录日志当前审计状态。

### 4.7.2 存证记录表设计

log_hash_records 表用于保存日志哈希及其链上写入信息，是连接链下日志与链上存证的关键表。该表的核心字段包括 id、log_id、task_id、log_hash、chain_name、contract_address、transaction_hash、block_number、on_chain_status、created_at 和 updated_at。log_id 对应 logs 表中的日志主键，表示该条存证记录属于哪一条日志；task_id 与 logs 表中的任务标识保持一致，用于任务维度查询。

log_hash 字段保存日志提交阶段计算得到的 SHA-256 哈希，是审计阶段 expectedHash 的来源。chain_name 用于标识链环境，当前系统主要使用本地 Hardhat 链。contract_address 保存本次日志哈希实际写入的 LogRegistry 合约地址，是历史合约地址回溯审计的重要依据。transaction_hash 和 block_number 分别记录链上交易哈希和区块号，on_chain_status 表示链上写入状态或失败原因。该表使系统能够追踪每条日志哈希是否完成链上存证，以及对应的链上位置信息。

本节关键信息摘要：

1. log_hash_records 表连接链下日志和链上存证记录。
2. log_hash 是审计阶段 expectedHash 的来源。
3. contract_address 支持历史合约地址回溯审计。
4. transaction_hash、block_number 和 on_chain_status 用于追踪链上写入状态。

### 4.7.3 审计记录与告警表设计

audit_records 表用于保存系统每次审计执行结果。其核心字段包括 id、log_id、log_hash_record_id、audit_status、expected_hash、actual_hash、audit_message、audited_at 和 created_at。log_id 关联被审计日志，log_hash_record_id 关联对应存证记录。audit_status 保存审计状态，包括 passed、failed 和 pending。expected_hash 保存数据库或链上存证中的期望哈希，actual_hash 保存审计阶段重新计算得到的实际哈希，audit_message 用于描述审计结果原因。该表能够保留审计过程证据，便于前端展示和后续追踪。

alerts 表用于保存异常告警记录，主要服务于哈希不一致等审计失败场景。其核心字段包括 id、alert_type、severity、related_log_id、related_audit_id、title、description、status、created_at 和 resolved_at。alert_type 当前主要为 hash_mismatch，表示哈希不一致告警；severity 表示告警严重程度；related_log_id 和 related_audit_id 分别关联异常日志和触发告警的审计记录；title 和 description 用于前端展示；status 表示告警处理状态。audit_records 与 alerts 表共同构成从审计结果到风险提示的数据链路。

本节关键信息摘要：

1. audit_records 表保存每次审计状态、期望哈希、实际哈希和审计说明。
2. alerts 表保存哈希不一致等异常告警事件。
3. related_log_id 和 related_audit_id 支持从告警追溯到日志和审计记录。
4. 审计记录与告警表共同支撑异常发现和风险提示。

### 4.7.4 Agent 状态表设计

agent_states 表用于保存日志采集 Agent 的运行状态，帮助系统了解采集端是否正常工作。该表的核心字段包括 id、agent_name、source_path、last_offset、last_heartbeat_at、last_sync_at、status、error_message、created_at 和 updated_at。agent_name 用于标识采集 Agent；source_path 记录该 Agent 监听或读取的日志路径；last_offset 保存最后读取位置，是增量采集的重要依据。

last_heartbeat_at 用于记录 Agent 最近一次心跳时间，last_sync_at 用于记录状态同步时间，status 表示 Agent 当前运行状态，error_message 用于保存异常说明。通过 agent_states 表，后端可以记录采集端的运行情况，前端也可以在系统总览中展示 Agent 是否在线。该表虽然不直接参与链上存证，但对保证日志自动采集流程的可用性具有重要作用。

表 4-1 数据库核心表结构说明

总体来看，五张核心表之间形成了清晰关系：logs 保存日志原文，log_hash_records 保存对应哈希和链上写入信息，audit_records 保存审计结果，alerts 保存异常告警，agent_states 保存采集端状态。logs 是业务数据基础，log_hash_records 提供存证信息，audit_records 和 alerts 支撑审计反馈，agent_states 则保障采集流程可观察。通过该数据库设计，系统能够在链下完整记录可信审计过程，并与链上 LogRegistry 合约形成协同。

本节关键信息摘要：

1. agent_states 表用于保存 Agent 名称、日志路径、读取偏移量、心跳时间和运行状态。
2. last_offset 是增量采集的重要依据。
3. agent_states 提高了日志采集过程的可观察性。
4. 五张核心表共同支撑日志存储、链上存证、审计告警和采集状态管理。

## 4.8 本章小结

本章围绕系统需求分析与总体设计展开，首先从功能需求角度说明了日志自动采集、链上可信存证、审计校验、异常告警和可视化展示等能力。这些功能需求共同支撑第 3 章提出的可信日志存证与审计机制，使系统能够完成从日志进入、哈希上链到审计告警的完整流程。

随后，本章分析了系统的非功能需求，包括数据可信性、系统可用性以及可维护性与可扩展性。数据可信性要求系统能够通过链上链下协同方式发现日志篡改风险；系统可用性要求 Agent、Server、SQLite、LogRegistry 和 Web 能够稳定协作；可维护性与可扩展性则要求系统模块职责清晰，便于后续优化和论文说明。

在总体设计方面，本章给出了系统总体架构、功能模块划分、数据流与业务流程以及数据库设计。系统由日志采集 Agent、后端服务、SQLite 链下存储、LogRegistry 链上存证、审计告警和前端可视化等部分组成。数据库方面，logs、log_hash_records、audit_records、alerts 和 agent_states 五张核心表共同支撑日志管理、存证记录、审计结果、异常告警和采集状态管理。

通过本章设计，系统的业务需求、功能边界、数据流向和数据结构得到明确，为后续系统实现与实验验证奠定了基础。

本节关键信息摘要：

1. 本章完成了功能需求、非功能需求和总体架构设计。
2. 系统功能模块包括 Agent、后端服务、区块链存证、审计告警和前端可视化。
3. 系统数据流包括日志采集与存证流程、审计与告警流程。
4. 数据库设计围绕 logs、log_hash_records、audit_records、alerts 和 agent_states 五张核心表展开。
5. 本章为后续系统实现与实验验证提供了结构基础。

