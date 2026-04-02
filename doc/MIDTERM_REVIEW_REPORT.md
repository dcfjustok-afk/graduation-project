# 中期检查工作量总结报告

> **课题名称**：基于区块链的可信任务日志审计系统  
> **日期**：2026 年 4 月 2 日  
> **仓库地址**：https://github.com/dcfjustok-afk/graduation-project

---

## 一、项目概述

本系统旨在解决传统日志审计中"日志可被篡改、审计结果不可信"的问题，通过将日志哈希写入区块链智能合约实现**不可篡改的链上存证**，并提供自动化的**三方哈希比对审计**机制，一旦发现日志被篡改即自动生成告警。

**系统数据流**：

```
日志文件 → Agent增量采集 → Server接收入库 → SHA-256哈希上链 → 审计比对(重算/库存/链上) → 异常告警 → 前端可视化
```

---

## 二、技术架构

采用 **Monorepo 单仓多包**架构，共 5 个子模块：

| 模块 | 目录 | 技术栈 | 定位 |
|------|------|--------|------|
| 前端 Web | `apps/web` | React 19 + TypeScript + Ant Design 5 + Vite 7 | 可视化展示 |
| 后端 Server | `apps/server` | Node.js + Express 5 + TypeScript + SQLite | 业务处理 |
| 采集 Agent | `apps/agent` | Node.js + TypeScript | 日志采集 |
| 智能合约 | `packages/contracts` | Solidity 0.8.24 + Hardhat + OpenZeppelin | 链上存证 |
| 共享类型库 | `packages/shared` | TypeScript | 前后端类型统一 |

---

## 三、各模块实现详情

### 3.1 日志采集 Agent（13 文件 / 494 行）

| 功能点 | 具体实现 |
|--------|----------|
| 增量文件读取 | 基于文件偏移量（offset）读取，只采集新增内容，避免重复 |
| 轮询采集机制 | 定时检测日志文件变化，可配置轮询间隔 |
| 指数退避重试 | 提交失败时按 2^n 秒递增间隔自动重试，可配置最大重试次数 |
| 队列持久化 | 重试队列序列化到磁盘，Agent 重启后不丢失未发送日志 |
| 状态同步 | 定期向 Server 上报心跳、偏移量、运行状态 |

**核心文件**：
- `agent/logAgent.ts` — 主轮询循环：检测文件 → 采集 → 刷新队列 → 同步状态
- `collector/fileReader.ts` — 按偏移量增量读取文件
- `collector/logCollector.ts` — 日志行批次管理
- `retry/retryQueue.ts` — 指数退避重试机制
- `state/offsetStore.ts` — 偏移量与队列的持久化存储
- `http/logApiClient.ts` — HTTP 客户端，向 Server 提交日志和状态

### 3.2 后端服务 Server（50 文件 / 1,766 行）

#### API 接口（10 个）

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/health` | 服务健康检查 |
| POST | `/api/logs` | 接收 Agent 提交的日志 |
| GET | `/api/logs` | 日志列表查询（支持分页） |
| POST | `/api/logs/generate` | 批量生成测试日志 |
| POST | `/api/agents/state` | 接收 Agent 状态同步 |
| GET | `/api/audits` | 审计记录列表查询 |
| POST | `/api/audits/run` | 执行全量审计 |
| POST | `/api/audits/:logId/run` | 对指定日志执行审计 |
| GET | `/api/alerts` | 告警列表查询 |
| GET | `/api/overview` | 系统总览统计数据 |

#### 数据库设计（5 张表 + 5 个索引）

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `logs` | 日志记录 | task_id, log_content, log_level, source_type, status |
| `log_hash_records` | 上链记录 | log_hash, transaction_hash, block_number, on_chain_status |
| `audit_records` | 审计记录 | expected_hash, actual_hash, audit_status, audit_message |
| `alerts` | 告警记录 | alert_type, severity(高危/中危/提示), status |
| `agent_states` | Agent 状态 | last_offset, last_heartbeat_at, status |

#### 核心业务逻辑

**日志上链流程**：

```
Agent 提交日志 → Server 入库(logs表)
    → 计算 SHA-256 哈希
    → 调用合约 storeLog(taskId, logHash)
    → 记录 transaction_hash 和 block_number 到 log_hash_records 表
```

**审计执行流程**：

```
触发审计 → 重新计算日志内容的 SHA-256 (actualHash)
    → 从 log_hash_records 表读取 expectedHash
    → 从区块链合约读取 onChainHash
    → 三方比对: actualHash vs expectedHash vs onChainHash
    → 一致 → audit_status = "passed"
    → 不一致 → audit_status = "failed" + 自动生成 alert
```

**代码分层**：Controller（请求处理）→ Service（业务逻辑）→ Repository（数据访问）

### 3.3 智能合约 Contracts（4 文件 / 271 行）

**合约：LogRegistry.sol**（Solidity ^0.8.24，基于 OpenZeppelin AccessControl）

| 函数 | 功能 | 权限 |
|------|------|------|
| `storeLog(taskId, logHash)` | 写入日志哈希，返回 recordId，触发 LogStored 事件 | LOGGER_ROLE |
| `getLog(recordId)` | 按 ID 查询单条链上记录 | 公开 |
| `getLogsByTaskId(taskId)` | 按任务 ID 批量查询 | 公开 |
| `getRecordIdsByTaskId(taskId)` | 获取任务关联的记录 ID 列表 | 公开 |
| `getTaskLogCount(taskId)` | 查询任务日志数量 | 公开 |
| `getLogCount()` | 查询总记录数 | 公开 |

**链上数据结构**：

```solidity
struct LogRecord {
    string taskId;
    string logHash;
    uint256 createdAt;
    address submitter;
}
```

**事件**：`LogStored(recordId, taskId, logHash, submitter, createdAt)` — 供链下服务监听。

### 3.4 前端 Web 界面（24 文件 / 2,503 行）

#### 5 个页面

| 页面 | 功能 |
|------|------|
| Dashboard 总览 | 系统统计卡片 + 审计时间线 + 趋势图表 |
| 日志中心 | 日志列表表格，支持搜索、筛选、刷新 |
| 审计管理 | 审计记录列表 + 一键执行审计按钮 |
| 告警管理 | 按严重程度分类（高危/中危/提示）+ 分布图表 |
| 日志生成器 | 3 种预设模板 + 批量生成 + 自定义参数 |

#### 4 个可复用组件

- `MetricCard` — 数据指标卡片
- `DistributionChart` — 分布饼图
- `LineTrendChart` — 折线趋势图
- `SectionHeader` — 区块标题组件

#### API 适配架构

- 支持 **Mock/Real 模式切换**（环境变量 `VITE_API_SOURCE` 控制）
- Mock 模式内置完整模拟数据，可独立演示
- Mapper 层负责后端原始数据 → 前端视图模型转换

### 3.5 共享类型库 Shared（3 文件 / 577 行）

- **50+ 个 TypeScript 类型/接口**：确保 Agent、Server、Web 三端类型一致
- **枚举定义**：LogLevel (INFO/WARN/ERROR)、AuditStatus (passed/failed/pending)、AgentRunStatus 等
- **运行时校验函数**：`validateLogSubmitPayload()`、`validateAgentStateSyncPayload()`
- **统一响应构建器**：`createSuccessResponse()`、`createErrorResponse()`、`createListResponse()`

---

## 四、测试与验证

### 4.1 测试结果汇总

| 测试类型 | 内容 | 结果 |
|----------|------|------|
| 合约单元测试 | 8 个用例（权限控制、写入、查询、边界） | ✅ 全部通过 |
| 服务端 API | 10 个接口逐一调用验证 | ✅ 全部通过 |
| Agent 基础测试 | 增量读取、偏移持久化、队列管理 | ✅ 全部通过 |
| Agent-Server 联调 | Agent 采集 → 提交 → Server 入库上链 | ✅ 全部通过 |
| **篡改检测实验** | 人为修改数据库日志内容 → 触发审计 | ✅ 成功检测，自动生成告警 |
| 前端构建 | TypeScript 编译 + Vite 打包 | ✅ 构建成功 |
| 全链路运行 | Hardhat节点 + Server + Agent + Web 同时运行 | ✅ 全部正常 |

### 4.2 性能基准测试

| 指标 | 结果 |
|------|------|
| 日志提交 | 100 次请求，成功率 **100%**，平均延迟 **173.2ms**，吞吐量 **5.77 req/s** |
| 审计执行 | 5 轮全量审计，成功率 **100%**，平均每轮处理 **136 条**日志 |

### 4.3 篡改检测实验（核心实验）

实验步骤：
1. 正常提交一条日志 → Server 计算哈希并写入区块链
2. 直接修改数据库中该日志的 `log_content` 字段（模拟篡改）
3. 执行审计 → 重新计算哈希
4. **结果**：`actualHash ≠ expectedHash`，审计状态为 `failed`，系统自动生成告警

---

## 五、代码量统计

| 模块 | 文件数 | 代码行数 |
|------|--------|----------|
| 前端 Web (apps/web/src) | 24 | 2,503 |
| 后端 Server (apps/server/src) | 50 | 1,766 |
| 采集 Agent (apps/agent/src) | 13 | 494 |
| 智能合约 (packages/contracts) | 4 | 271 |
| 共享类型库 (packages/shared) | 3 | 577 |
| 自动化脚本 + 性能测试 (scripts + tests) | 6 | 408 |
| **源代码合计** | **100** | **6,019** |
| 技术文档 (doc/) | 4 | 585 |
| 项目文档 (根目录 .md) | 3 | 637 |

---

## 六、自动化与工程化

- **Monorepo 管理**：npm workspaces 统一管理依赖，共享类型包跨模块引用
- **自动化验证脚本**：`verify-server.js`、`verify-agent.js` 一键验证各模块功能
- **性能基准测试**：`log-submit-benchmark.js`、`audit-benchmark.js` 可重复执行
- **合约自动部署**：部署脚本自动将合约地址写入后端环境变量
- **前端 Mock/Real 切换**：无需后端即可独立运行演示

---

## 七、项目进度结论

根据开发路线图（DEVELOPMENT_ROADMAP.md）中规划的 **15 个开发步骤**，目前已全部完成。系统可以完整运行：从 Agent 采集日志 → Server 处理上链 → 审计检测篡改 → 前端可视化展示，全链路贯通。
