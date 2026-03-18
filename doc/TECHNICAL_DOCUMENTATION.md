# 技术说明材料

## 1. 系统总体架构

本项目采用 Monorepo 结构实现“基于区块链的可信任务日志审计系统”，核心目标是把日志采集、链下存储、链上存证、审计核验、异常告警和前端展示整合为一条完整可信链路。

当前仓库由四个核心模块构成：

1. `apps/agent`
   - 负责监听本地日志文件变化
   - 支持增量读取、偏移量持久化、失败重试和状态同步

2. `apps/server`
   - 负责接收日志、写入 SQLite、计算哈希、调用智能合约、执行审计、生成告警并向前端提供 API

3. `packages/contracts`
   - 负责实现链上日志哈希存证合约 `LogRegistry`
   - 提供权限控制、存证查询、部署脚本和测试脚本

4. `apps/web`
   - 负责展示日志总览、审计结果、告警信息和趋势可视化
   - 支持 mock 与真实后端模式切换

系统总体架构可以概括为：

日志文件 -> Agent 增量采集 -> Server 接口接收 -> SQLite 持久化 -> 计算日志哈希 -> 写入 LogRegistry 合约 -> 审计重算比对 -> 生成异常告警 -> 前端可视化展示

## 2. 模块划分说明

### 2.1 Agent 模块

Agent 入口位于 `apps/agent/src/index.ts`，主要职责包括：

- 读取日志文件新增内容
- 维护读取偏移量
- 将日志封装后上报到后端接口
- 将运行状态同步到后端 `agent_states` 表
- 在网络异常时将待发送数据加入重试队列

该模块的关键实现位于：

- `collector/fileReader.ts`：按偏移量读取新增日志
- `collector/logCollector.ts`：组织采集与批量提交逻辑
- `retry/retryQueue.ts`：失败重试队列
- `state/offsetStore.ts`：本地偏移量持久化
- `agent/logAgent.ts`：Agent 主流程控制

### 2.2 Server 模块

后端采用 Express + TypeScript 的分层结构，主要分为：

- `routes`：定义 REST API 路由
- `controllers`：接收请求并返回统一响应结构
- `services`：实现日志上链、审计、告警和总览统计业务
- `repositories`：封装 SQLite 读写逻辑
- `db`：初始化数据库和执行 SQL 持久化
- `blockchain`：封装 Ethers 合约客户端与哈希算法

这种设计便于在论文中清晰说明“接口层、业务层、数据层、链上交互层”的职责分离。

### 2.3 Smart Contract 模块

智能合约位于 `packages/contracts/contracts/LogRegistry.sol`，基于 Hardhat + TypeScript + OpenZeppelin 实现。合约的核心职责包括：

- 保存日志哈希和任务 ID
- 记录区块链写入时间
- 记录提交者地址
- 通过 `AccessControl` 控制写入权限
- 支持按任务 ID 查询链上存证记录

### 2.4 Web 模块

前端基于 React + TypeScript + Ant Design 构建，负责展示：

- 系统总览统计
- 日志列表
- 审计结果
- 告警信息
- 日志趋势图、状态分布图、异常分布图和审计时间线

前端已将 API 请求与 mock 数据模式解耦，后续可在答辩或演示时灵活切换数据来源。

## 3. 数据流说明

### 3.1 日志采集与存证数据流

1. Agent 检测到日志文件新增内容
2. Agent 读取新增日志并封装为标准提交数据
3. Agent 调用后端 `POST /api/logs`
4. Server 在 `logs` 表保存日志原文和元数据
5. Server 对 `log_content` 计算 SHA-256 哈希
6. Server 调用 `LogRegistry.storeLog(taskId, logHash)` 将哈希写入本地链
7. Server 在 `log_hash_records` 表中记录链上交易哈希、区块号、合约地址和链上状态

### 3.2 审计与告警数据流

1. 用户或脚本触发 `POST /api/audits/run` 或单条审计接口
2. Server 读取 `logs` 表中的原始日志
3. Server 重新计算本地日志哈希
4. Server 读取 `log_hash_records` 表中保存的预期哈希和对应合约地址
5. Server 调用目标合约地址的 `getLogsByTaskId(taskId)` 读取链上存证
6. Server 对比本地哈希、数据库哈希和链上哈希
7. 对比一致则写入 `passed` 审计记录；不一致则写入 `failed` 审计记录
8. 对于 `failed` 情况，Server 在 `alerts` 表生成异常告警

## 4. 数据库设计说明

当前数据库为 SQLite，建表逻辑位于 `apps/server/src/db/schema.ts`，核心表如下。

### 4.1 logs

用途：保存日志原文与采集来源信息。

关键字段：

- `task_id`：业务任务标识
- `source_type`：日志来源类型
- `source_path`：日志文件路径
- `log_content`：原始日志内容
- `log_level`：日志级别
- `collected_at`：采集时间
- `status`：当前日志状态，如 `collected`、`audit_passed`、`audit_failed`

### 4.2 log_hash_records

用途：保存日志哈希及其链上写入信息。

关键字段：

- `log_id`：对应 `logs` 表主键
- `task_id`：任务标识
- `log_hash`：日志哈希
- `chain_name`：链名称，当前为 `hardhat`
- `contract_address`：实际写入的合约地址
- `transaction_hash`：交易哈希
- `block_number`：区块号
- `on_chain_status`：链上状态或错误信息

### 4.3 audit_records

用途：保存审计执行结果。

关键字段：

- `log_id`：被审计日志主键
- `log_hash_record_id`：关联的存证记录主键
- `audit_status`：`passed`、`failed` 或 `pending`
- `expected_hash`：期望哈希
- `actual_hash`：实际重算哈希
- `audit_message`：审计说明
- `audited_at`：审计执行时间

### 4.4 alerts

用途：保存篡改风险与异常事件。

关键字段：

- `alert_type`：当前实现为 `hash_mismatch`
- `severity`：告警级别
- `related_log_id`：关联日志 ID
- `related_audit_id`：关联审计记录 ID
- `title`、`description`：告警描述
- `status`：处理状态，默认 `open`

### 4.5 agent_states

用途：保存 Agent 运行状态。

关键字段：

- `agent_name`
- `source_path`
- `last_offset`
- `last_heartbeat_at`
- `last_sync_at`
- `status`
- `error_message`

## 5. 智能合约设计说明

`LogRegistry` 合约的设计目标是“结构简单、权限清晰、便于答辩讲解”。

### 5.1 合约核心能力

- 通过 `LOGGER_ROLE` 限制日志写入权限
- 允许管理员继续授予写入角色
- 每次写入保存任务 ID、日志哈希、区块时间戳和提交者地址
- 支持按任务 ID 返回对应链上日志记录列表

### 5.2 合约设计理由

1. 只上链存储哈希，不直接上链保存日志原文，可减少链上存储成本。
2. 使用 `AccessControl` 而不是自定义权限字段，便于说明安全边界。
3. 提供按任务 ID 查询接口，方便后端在审计阶段定位同一任务下的所有链上存证。

## 6. 审计流程说明

审计逻辑位于 `apps/server/src/services/auditExecutionService.ts`，核心流程如下：

1. 读取待审计日志
2. 获取对应的最新 `log_hash_records`
3. 根据日志原文重新计算 `actualHash`
4. 根据 `log_hash_records.contract_address` 连接对应历史合约地址
5. 查询链上同任务 ID 下的所有哈希记录
6. 若链上存在与数据库记录一致的哈希，则视为链上可追溯
7. 将 `expectedHash`、`actualHash`、`onChainHash` 进行比对
8. 输出 `passed`、`failed` 或 `pending`
9. 当结果为 `failed` 时生成异常告警
10. 更新日志状态，供前端展示和后续统计使用

### 6.1 本轮优化点

为了保证实验结论可信，本轮又补充了两项关键修复：

1. 合约代码存在性校验
   - 在链上读写前通过 `provider.getCode(address)` 判断目标地址是否存在字节码。
   - 可以避免本地链重启后“交易写到空地址但表面成功”的问题。

2. 历史合约地址审计
   - 审计阶段不再只依赖当前环境变量中的最新地址，而是优先使用日志自身的 `contract_address` 读取链上数据。
   - 这样可以正确处理多次本地部署后的历史日志记录。

## 7. 测试方案说明

### 7.1 合约测试

通过 Hardhat 测试验证：

- 权限授予是否正确
- 合约是否允许合法角色写入日志
- 非授权地址是否会被拒绝
- 按任务 ID 查询是否返回预期结果
- 空参数是否被拒绝

### 7.2 后端验证

后端通过脚本化方式完成回归验证：

- `verifyApiRoundtrip.ts`：验证健康检查、总览、日志提交、批量审计、审计列表、告警列表
- `verifyAuditRoundtrip.ts`：验证结果中同时存在 `passed` 和 `failed`
- `runTamperExperiment.ts`：验证篡改后可生成失败审计和异常告警

### 7.3 Agent 验证

Agent 通过 `verifyAgentBasics.ts` 验证：

- 首次读取
- 文件追加后的增量读取
- 待重试队列持久化
- 偏移量记录更新

### 7.4 性能实验

当前仓库已提供两类实验脚本：

- `tests/performance/log-submit-benchmark.js`
- `tests/performance/audit-benchmark.js`

它们能够输出成功率、平均延迟、最大延迟、吞吐量和平均处理数量，适合直接转入论文实验章节。

## 8. 当前系统特点与局限

### 8.1 特点

1. 形成了完整的“采集-存储-上链-审计-告警-展示”闭环。
2. 关键功能均有脚本化验证入口，便于重复实验。
3. 审计逻辑已兼顾历史合约地址和本地链重启场景。
4. 前端已具备适合答辩展示的可视化页面。

### 8.2 局限

1. 当前链环境基于本地 Hardhat，尚未扩展到公开测试网。
2. SQLite 适合作为毕设原型验证，但在高并发场景下扩展性有限。
3. 批量审计当前采用串行执行策略，正确性优先于极致吞吐。
4. 前端虽然已做构建分块，但仍可进一步结合路由级懒加载继续优化产物体积。

## 9. 论文撰写建议

本说明可直接拆分为论文中的以下小节：

1. 系统总体架构设计
2. 日志采集模块设计
3. 区块链存证模块设计
4. 后端审计与告警模块设计
5. 数据库设计
6. 系统测试与实验方案
7. 篡改检测实验与结果分析

后续只需结合学校模板调整语言风格和图表编号，即可进一步整理成论文正文。