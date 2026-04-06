# 系统架构师操作手册 · 全链路数据流深度解析

> 基于区块链的可信任务日志审计系统 — 写给需要**深度理解和汇报**系统的架构师

---

## 全局架构一句话

```
日志文件 ──Agent增量采集──▶ 后端API ──双写──▶ SQLite(原文) + Hardhat链(SHA-256哈希)
                                                    │
                         审计时：重算哈希 ◀── 读原文 ──┘
                              │
                    比对链上存证 ──▶ 一致=通过 / 不一致=异常+自动告警
```

**核心创新**：利用区块链不可篡改性，将日志哈希存证上链，即使有人篡改了数据库中的日志原文，审计时重算的哈希与链上哈希不一致，篡改行为无法逃脱。

---

## 一、技术栈总览

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | React 19 + TypeScript + Ant Design 5 + Vite | SPA，5 个功能页面 |
| 后端 | Node.js + Express + TypeScript | RESTful API，端口 3010 |
| 数据库 | SQLite (sql.js) | 5 张表：logs, log_hash_records, audit_records, alerts, agent_states |
| 区块链 | Hardhat 本地链 + Solidity 合约 (OpenZeppelin) | LogRegistry 合约，Ethers.js 交互 |
| 采集端 | Node.js Agent | 文件增量轮询 + 重试队列 + 状态持久化 |
| 共享层 | packages/shared | 类型定义、常量、状态枚举 |

---

## 二、启动流程与内部机制

### 2.1 一键启动

```bash
npm run dev
```

**内部实际做了什么**：concurrently 并行启动 4 个进程：

| 进程 | 命令 | 端口 | 作用 |
|------|------|------|------|
| Hardhat 节点 | `npx hardhat node` | 8545 | 启动一个内存级以太坊节点，自带 20 个测试账户各 10000 ETH |
| Server 后端 | `ts-node apps/server/src/index.ts` | 3010 | Express 服务，注册所有路由和中间件 |
| Agent 采集端 | `ts-node apps/agent/src/index.ts` | 无端口 | 定时轮询日志文件，HTTP POST 到后端 |
| Web 前端 | `vite dev` | 5173 | Vite 开发服务器，HMR 热更新 |

### 2.2 合约部署

```bash
npm run chain:deploy
```

**内部逻辑** (`packages/contracts/scripts/deploy.ts`)：
1. 编译 `LogRegistry.sol` → 生成 ABI + Bytecode
2. 使用 Hardhat 默认账户签名部署交易
3. 等待交易确认，获取合约地址
4. **自动写入** `apps/server/.env` 的 `LOG_REGISTRY_ADDRESS` 字段
5. 后端启动时从 `.env` 读取此地址来发起链上交互

> **关键注意**：每次重启 Hardhat 节点后，之前的合约全部丢失（内存级链），必须重新 `chain:deploy`。否则后端的合约地址指向空地址，链上写入会静默失败。我们已加入 `provider.getCode(address)` 校验来防止此问题。

---

## 三、系统总览页面 (`/dashboard`)

### 3.1 页面结构

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──侧边栏──┐  ┌────────────────── 顶部状态栏 ──────────────────┐ │
│ │ 系统总览 │  │ "区块链可信日志审计平台"  [系统运行中] [Hardhat] │ │
│ │ 日志生成 │  └─────────────────────────────────────────────────┘ │
│ │ 日志中心 │                                                      │
│ │ 审计中心 │  ┌──── Hero 介绍卡片（渐变背景+网格纹理）────────┐  │
│ │ 异常告警 │  │ 系统名称、描述文字、快捷跳转按钮、状态面板     │  │
│ │          │  └───────────────────────────────────────────────┘  │
│ │ [真实数据]│  ┌日志总量┐ ┌链上存证┐ ┌审计记录┐ ┌活动告警┐      │
│ │ [链上存证]│  │   5    │ │   5   │ │   5   │ │   0   │      │
│ └──────────┘  └────────┘ └───────┘ └───────┘ └───────┘      │
│               ┌审计时间线──────┐ ┌审计摘要表─────────────────┐  │
│               │ 最近4条审计事件 │ │ 总量/通过/预警/异常/待审计│  │
│               └────────────────┘ └──────────────────────────┘  │
│               ┌日志趋势图┐ ┌状态统计(饼图)┐ ┌异常分布(条形)┐  │
│               │ SVG折线   │ │ SVG环形图    │ │ CSS进度条   │  │
│               └──────────┘ └──────────────┘ └─────────────┘  │
│               ┌模块建设进度────────────────────────────────┐    │
│               │ Agent:100% | 后端:100% | 链:100% | 前端:100%│    │
│               └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 数据加载：点击进入页面后发生了什么

**前端** (`DashboardPage.tsx`)：

```
useEffect 触发 → getDashboardData()
  ↓
dataService.loadRawBundle() → 并行发出 4 个 HTTP 请求：
  ├── GET /overview  → 获取 ServerOverviewStats（6个计数）
  ├── GET /logs      → 获取所有 ServerLogRecord[]
  ├── GET /audits    → 获取所有 ServerAuditRecord[]
  └── GET /alerts    → 获取所有 ServerAlertRecord[]
  ↓
mappers.buildDashboardViewData() → 将原始数据转换为视图数据：
  ├── buildOverviewCards(stats, summary)   → 4张指标卡片
  ├── buildAuditTimeline(audits, logs)     → 时间线条目（最多4条）
  ├── buildSystemModules(stats)            → 4个模块进度
  ├── buildAuditSummary(stats, audits, alerts) → 5项摘要
  ├── buildLogTrend(logs, audits)          → 按时间分组的趋势点
  ├── buildStatusDistribution(summary)     → 饼图3项
  └── buildAlertDistribution(alerts)       → 条形图3项
  ↓
setState(data) → 触发 React 重新渲染
```

**后端** 对应处理：

| 请求 | 路由 → 控制器 → 服务 → 仓库 | SQL 查询 |
|------|-----|------|
| `GET /overview` | `overviewRoutes → getOverviewController → getOverview() → getOverviewStats()` | 并行执行 6 个 `SELECT COUNT(*) FROM ...` |
| `GET /logs` | `logRoutes → listLogsController → getLogs() → listLogs()` | `SELECT * FROM logs ORDER BY id DESC` |
| `GET /audits` | `auditRoutes → listAuditRecordsController → getAuditRecords() → listAuditRecords()` | `SELECT * FROM audit_records ORDER BY audited_at DESC` |
| `GET /alerts` | `alertRoutes → listAlertsController → getAlerts() → listAlerts()` | `SELECT * FROM alerts ORDER BY created_at DESC` |

### 3.3 各 UI 区域的数据来源

| UI 区域 | 数据类型 | 来源字段 | 渲染组件 |
|---------|---------|---------|---------|
| 4 张指标卡片 | `OverviewCard[]` | `stats.totalLogs`, `stats.totalHashRecords`, `stats.totalAuditRecords`, `summary.warning` | `MetricCard` |
| 审计摘要表 | `AuditSummary` | `stats.totalLogs`(总量), `audits.filter(passed)`, `alerts.filter(!ignored)`, `audits.filter(failed)`, `audits.filter(pending)` | Ant Design Table |
| 审计时间线 | `AuditTimelineEntry[]` | `audits.slice(0,4)` → 取前4条审计记录的 `audit_message` | Ant Design Timeline |
| 日志趋势图 | `TrendPoint[]` | 按 `collected_at` 日期分组 logs，统计每组总量和异常数量 | 自绘 SVG `LineTrendChart` |
| 状态统计饼图 | `StatusDistributionItem[]` | `summary.passed`, `summary.pending`, `summary.abnormal` | 自绘 SVG `DonutChart` |
| 异常分布图 | `AlertDistributionItem[]` | alerts 按 severity 分组计数 | CSS `BarChart` |
| 模块进度 | `SystemModule[]` | `stats.onlineAgents`, `stats.totalLogs`, `stats.totalHashRecords` | Ant Design Progress |

### 3.4 侧边栏与顶栏

**侧边栏** (`MainLayout.tsx`)：
- 使用 Ant Design `Sider` + `Menu`，菜单项的 key 对应路由路径
- 点击菜单项调用 `navigate(key)`，由 react-router-dom 执行客户端路由跳转
- 底部显示两个 Tag：「真实数据」（表示使用后端 API 而非 mock 数据）和「链上存证」
- `selectedKeys` 绑定 `location.pathname`，实现高亮同步

**顶栏** (`MainLayout.tsx`)：
- 毛玻璃效果 (`backdrop-filter: blur(18px)`)
- 显示两个状态标签：`系统运行中`（绿色）、`Hardhat 本地链`（蓝色）
- 这些标签是静态文本，不从后端获取（可改进为实时健康检查）

---

## 四、日志生成台 (`/log-generator`)

### 4.1 页面结构

```
┌──────────────────────────────────────────────────────────────────┐
│ [页面标题] 日志生成台  [Real API 标签]  [查看日志中心 按钮]         │
│                                                                    │
│ ┌─── Hero 区域 ──────────────────────────────────────────────┐    │
│ │ "可视化日志造数平台" + 一键造数 / 批量节奏控制               │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                    │
│ ┌──────────── 3 个预设模板卡片（横排）───────────────────────┐    │
│ │ [INFO 日报任务]  [WARN 备份延迟]  [ERROR 权限异常]          │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                    │
│ ┌── 左侧：表单区 ──────────┐  ┌── 右侧：预览 & 结果面板 ──┐    │
│ │ 任务名称 [input]          │  │ 当前级别: INFO              │    │
│ │ 来源类型 [select]         │  │ 批量数量: 5                 │    │
│ │ 来源路径 [input]          │  │ 任务预览: 数据同步任务       │    │
│ │ 日志级别 [select]         │  │ 来源: web-generator         │    │
│ │ 采集时间 [datepicker]     │  │                              │    │
│ │ 日志内容 [textarea]       │  │ ── 提交结果 ──               │    │
│ │ 生成数量 [number]         │  │ 最近创建日志 ID: 5           │    │
│ │ 间隔毫秒 [number]         │  │ 或: 成功 3 条 / 失败 0 条   │    │
│ │                            │  │                              │    │
│ │ [生成单条] [批量生成] [重置]│  │ [去日志中心查看]             │    │
│ └────────────────────────────┘  └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 点击「预设模板」后发生了什么

**前端逻辑**：
```
用户点击「WARN 备份延迟」 → applyPreset('warn-backup')
  ↓
form.setFieldsValue({
  taskName: '定时备份任务',
  sourceType: 'backup-service',
  sourcePath: '/var/log/backup.log',
  logLevel: 'WARN',
  logContent: '检测到备份延迟，等待重试队列处理。',
  batchCount: 3,
  intervalMs: 1500,
})
  ↓
Form.useWatch 监听到变化 → preview 状态自动更新
  ↓
右侧预览面板实时显示：当前级别=WARN, 批量数量=3, 任务预览=定时备份任务
```

**不涉及后端调用**，纯前端表单填充。

### 4.3 点击「生成单条日志」后的完整链路

```
用户点击按钮 → handleSingleSubmit()
  ↓
1. form.validateFields() → 表单校验（带 * 的必填）
  ↓
2. mapLogGeneratorToSubmitPayload(values) → 构造请求体：
   {
     taskId: "数据同步任务",
     sourceType: "web-generator",
     sourcePath: "/virtual/web-generator.log",
     logContent: "开始执行日志生成演示任务。",
     logLevel: "INFO",
     collectedAt: "2026-04-05T00:00:00.000Z"
   }
  ↓
3. realClient.createLog(payload) → POST http://localhost:3010/logs
```

**后端收到请求后的处理链**：

```
POST /logs
  → submitLogController(req, res)
    → validateLogSubmitPayload(req.body)  // 校验 taskId, logContent 非空
    → persistLogAndWriteChain(payload)    // ⭐ 核心双写逻辑
```

**`persistLogAndWriteChain` 内部步骤**（`blockchainService.ts`）：

| 步骤 | 操作 | 涉及系统 |
|------|------|---------|
| ① | `createLog(payload)` → `INSERT INTO logs (...)` | SQLite |
| ② | `calculateLogHash(logContent)` → `crypto.createHash('sha256').update(content).digest('hex')` | Node.js crypto |
| ③ | `createLogRegistryClient()` → 创建 ethers.js Provider + Wallet + Contract 实例 | Ethers.js |
| ④ | `ensureLogRegistryContractAvailable(provider)` → `provider.getCode(address)` 验证合约存在 | Hardhat RPC |
| ⑤ | `contract.storeLog(taskId, logHash)` → 发送交易到 LogRegistry 合约 | Hardhat 链 |
| ⑥ | `tx.wait()` → 等待交易被出块确认，获取 receipt | Hardhat 链 |
| ⑦ | `createLogHashRecord({logId, taskId, logHash, transactionHash, blockNumber, contractAddress, onChainStatus: 'confirmed'})` → `INSERT INTO log_hash_records (...)` | SQLite |

**如果链上写入失败**（如合约不存在、RPC 超时）：
- 不影响日志本身的 SQLite 存储（步骤①已完成）
- `log_hash_records` 记录的 `on_chain_status` 为 `failed:错误信息`
- 前端仍能看到日志，但状态为「已上链」（因为 `status = 'collected'` 被映射为 `已上链`）

**后端响应**：
```json
{
  "success": true,
  "message": "日志提交成功",
  "data": {
    "log": { "id": 1, "task_id": "数据同步任务", "status": "collected", ... },
    "hashRecord": { "log_hash": "0xabc...", "transaction_hash": "0xdef...", "block_number": 3 },
    "blockchainError": null
  }
}
```

**前端收到响应**：
```
response.data.log.id → 设置 createdLogId = 1
  ↓
右侧面板显示: "最近创建日志 ID：1"
清空 batchSummary（避免同时显示批量结果）
```

### 4.4 点击「批量生成日志」后的完整链路

```
用户点击按钮 → handleBatchSubmit()
  ↓
1. form.validateFields()
  ↓
2. mapLogGeneratorToBatchPayload(values) → 构造批量请求体：
   {
     count: 3,
     intervalMs: 1500,
     base: { taskId, sourceType, sourcePath, logContent, logLevel, collectedAt },
     overrides: [
       { taskId: "定时备份任务-01", logContent: "...#1", collectedAt: "T+0" },
       { taskId: "定时备份任务-02", logContent: "...#2", collectedAt: "T+1500ms" },
       { taskId: "定时备份任务-03", logContent: "...#3", collectedAt: "T+3000ms" },
     ]
   }
  ↓
3. realClient.generateLogs(payload) → POST /logs/generate
```

**后端** (`generateLogsController`)：
```
for (let index = 0; index < count; index++) {
  // 合并 base + overrides[index]
  validateLogSubmitPayload(itemPayload)
  persistLogAndWriteChain(itemPayload)  ← 每条都走完整的 SQLite + 链上写入
  if (intervalMs > 0) await sleep(intervalMs)  ← 人为间隔，模拟真实场景
}
```

**关键细节**：
- 每条日志都是**独立的链上交易**，不是批量打包
- `intervalMs` 是**服务端等待**，不是前端定时器
- 前端在等待期间 `batchLoading = true`，按钮显示加载动画
- 返回结构包含 `successCount`、`failures[]`、`createdLogIds[]`

### 4.5 状态变量完整映射

| 状态变量 | 类型 | 用途 |
|---------|------|------|
| `form` | Ant Design FormInstance | 管理所有表单输入 |
| `singleLoading` | boolean | 单条提交按钮的 loading 动画 |
| `batchLoading` | boolean | 批量生成按钮的 loading 动画 |
| `createdLogId` | number \| null | 单条提交成功后的日志 ID |
| `batchSummary` | { successCount, failures } | 批量提交后的汇总统计 |
| `preview` (Form.useWatch) | 实时表单值 | 驱动右侧预览面板更新 |

---

## 五、日志中心 (`/logs`)

### 5.1 页面结构

```
┌──────────────────────────────────────────────────────────────────┐
│ [页面标题] 日志中心  [刷新日志 按钮]                               │
│ [搜索框: 搜索日志编号、任务名、来源文件、哈希摘要]                  │
│                                                                    │
│ ┌──────── 日志表格 ──────────────────────────────────────────┐    │
│ │ 编号  │ 任务名  │ 来源文件  │ 级别  │ 状态  │ 时间  │ 哈希 │审计│  │
│ │ LOG-5 │ 权限变更│ /var/... │ ERROR │ 已上链│ 08:35 │ ...  │ —  │  │
│ │ LOG-4 │ 备份-03 │ /var/... │ WARN  │ 已上链│ 08:34 │ ...  │ —  │  │
│ │ ...                                                         │  │
│ └─────────────────────────────────────────────────────────────┘    │
│                          [分页器: 每页6条]                         │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 数据加载链路

```
useEffect 触发 → getLogs()
  ↓
dataService.loadRawBundle() → 并行请求 GET /overview, /logs, /audits, /alerts
  ↓
mapServerLogsToView(bundle.logs) → 将每条服务端日志映射为视图格式：
  {
    id: "LOG-5",                    ← 前缀 + 数据库 id
    taskName: log.task_id,
    source: log.source_path || log.source_type,
    level: "ERROR" | "WARN" | "INFO",
    status: mapLogStatus(log.status),    ← 状态映射规则见下
    submittedAt: "2026-04-04 08:35:09",
    hash: "log-5",
  }
  ↓
mergeAuditIntoLogs(logs, bundle.audits) → 如果有审计记录，覆盖日志状态：
  auditByLogId.get(logId) 存在时:
    - audit_status='passed' → status='审计通过'
    - audit_status='failed' → status='发现异常'
    - audit_status='pending' → status='待审计'
    同时注入 auditMessage, expectedHash, actualHash
```

### 5.3 状态映射规则（重要）

**后端 → 前端状态映射** (`mapLogStatus`)：

| 后端 `status` | 映射条件 | 前端显示 | Tag 颜色 |
|---------------|---------|---------|---------|
| `collected` | 包含 'confirm' 或 'chain' 或等于 'collected' | 已上链 | 绿色 |
| `audit_passed` | 经 `mergeAuditIntoLogs` 覆盖后 | 审计通过 | 绿色 |
| `audit_pending` | 经 `mergeAuditIntoLogs` 覆盖后 | 待审计 | 金色 |
| `audit_failed` | 经 `mergeAuditIntoLogs` 覆盖后 | 发现异常 | 红色 |

**级别标签颜色**：ERROR=红色, WARN=金色, INFO=蓝色

### 5.4 搜索功能

**纯前端过滤**（`filteredLogs` useMemo）：
- 将关键字转为小写
- 在 `id, taskName, source, level, status, hash` 6 个字段中模糊匹配
- 不发送后端请求，实时过滤已加载数据

### 5.5 点击「刷新日志」

```
loadLogs(true) → getLogs() → loadRawBundle() → 4个并行HTTP请求 → 重新渲染
message.success("日志列表已刷新")
```

### 5.6 从日志生成台跳转过来

日志生成台跳转时附带 URL 参数：`/logs?refresh=1&source=generator`
- `LogsPage` 的 useEffect 检测到 `refresh=1`
- 弹出 `message.success("提交成功，已跳转到日志中心")`
- 用 `replace` 替换 URL 移除参数（防止刷新重复提示）

---

## 六、审计中心 (`/audit`)

### 6.1 页面结构

```
┌──────────────────────────────────────────────────────────────────┐
│ [页面标题] 审计中心                                                │
│                        [⚡ 一键批量审计 按钮]                      │
│                                                                    │
│ ┌─ 4个指标卡 ────────────────────────────────────────────────┐    │
│ │ 待处理:5  │  审计通过:0  │  预警数量:0  │  异常数量:0       │    │
│ └─────────────────────────────────────────────────────────────┘    │
│                                                                    │
│ ┌── 审计执行面板 ──────────┐  ┌── 状态统计图（饼图）──────┐      │
│ │ 系统说明 + 审计时间线     │  │ 通过/待审计/异常 分布      │      │
│ │ (最近4条审计事件)         │  └──────────────────────────┘      │
│ │                            │  ┌── 日志趋势图 ─────────────┐      │
│ └────────────────────────────┘  │ 时间 vs 总量/异常数 折线   │      │
│                                  └──────────────────────────┘      │
│ ┌── 审计增强说明 ──────────────────────────────────────────┐      │
│ │ 4条功能说明文字                                          │      │
│ └─────────────────────────────────────────────────────────┘      │
│ ┌── 最近审计对象表 ─────────────────────────────────────────┐      │
│ │ 编号 │ 任务名 │ 当前状态 │ 提交时间                       │      │
│ └─────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 页面加载

```
useEffect → loadPage()
  → getAuditPageData()
    → dataService.loadRawBundle() + getDashboardData()  → 获取 dashboard + logs
  → setState({ dashboard, logs })
```

### 6.3 点击「⚡ 一键批量审计」后的完整链路（核心）

**前端**：
```
handleRunAudits()
  → setLoading(true)
  → realClient.runAudits()  →  POST /audits/run
  → 等待响应...
  → loadPage()  ← 重新加载页面数据
  → message.success(`审计完成，共处理 ${results.length} 条日志`)
  → setLoading(false)
```

**后端** (`POST /audits/run → runAuditForAllLogsController → runAuditForAllLogs()`)：

```
对 logs 表中的每条日志，逐一执行 runAuditForLog(logId)：
```

**`runAuditForLog` 的 9 个步骤**（`auditExecutionService.ts`）：

| 步骤 | 操作 | SQL/RPC |
|------|------|---------|
| ① | 从数据库读取该日志原文 | `SELECT * FROM logs WHERE id = ?` |
| ② | 从数据库读取关联的哈希记录 | `SELECT * FROM log_hash_records WHERE log_id = ? ORDER BY id DESC LIMIT 1` |
| ③ | 用日志原文重新计算 SHA-256 | `crypto.createHash('sha256').update(log.log_content)` |
| ④ | 从 `hashRecord.contract_address` 取合约地址（**使用历史地址，非当前 env 地址**） | — |
| ⑤ | 创建链上只读客户端 | `new Contract(contractAddress, abi, provider)` |
| ⑥ | 调用合约 `getLogsByTaskId(taskId)` 获取链上所有哈希 | Hardhat JSON-RPC `eth_call` |
| ⑦ | **三方比对**：actualHash vs expectedHash(DB) vs onChainHashes | — |
| ⑧ | 写入审计记录 | `INSERT INTO audit_records (...)` |
| ⑨ | 如果 `failed`：创建告警 + 更新日志状态 | `INSERT INTO alerts (...)` + `UPDATE logs SET status = ?` |

### 6.4 审计判定逻辑（三方比对决策树）

```
actualHash = 重新计算的 SHA-256 哈希
expectedHash = log_hash_records 表中的 log_hash（提交时存的）
onChainHashes = 链上该 taskId 下所有哈希列表

if (expectedHash 存在 AND expectedHash 在 onChainHashes 中找到):
    if actualHash === expectedHash:
        ✅ PASSED — "重新计算哈希与数据库、链上记录一致，审计通过。"
    else:
        ❌ FAILED — "重新计算哈希与数据库或链上记录不一致，判定为异常。"
             → 自动创建高危告警
             → UPDATE logs SET status = 'audit_failed'

elif (expectedHash 存在 AND 链上有其他哈希但没匹配到):
    if actualHash === expectedHash:
        ⏳ PENDING — "数据库记录与本地哈希一致，但链上未匹配到该哈希。"
    else:
        ❌ FAILED — "本地哈希与数据库不一致，链上也未匹配。"

elif (expectedHash 存在 但链上完全无记录):
    if actualHash === expectedHash:
        ⏳ PENDING — "本地哈希与数据库一致，但链上记录暂不可用。"
    else:
        ❌ FAILED — "本地哈希与数据库不一致。"

else:
    ⏳ PENDING — "缺少完整链上记录。"
```

> **为什么会出现 PENDING？** 当 Hardhat 节点重启后，链上数据清空但数据库中的 log_hash_records 仍保留旧合约地址。通过旧地址查询链上数据时，合约不存在，`resolveOnChainHashes` 捕获异常返回空数组。

### 6.5 审计完成后的 UI 变化

审计完成 → `loadPage()` 重新加载数据：

| UI 区域 | 变化 |
|---------|------|
| 待处理指标 | 从 0 变为审计记录中 `pending` 状态的数量 |
| 审计通过指标 | 显示 `passed` 数量 |
| 异常数量指标 | 显示 `failed` 数量 |
| 审计时间线 | 显示最新 4 条审计消息（如 "审计记录 #3：审计通过"） |
| 状态统计饼图 | 环形图着色（绿=通过, 金=待审计, 红=异常），中心数字为总计 |
| 趋势图 | 折线更新，红线表示异常数量趋势 |
| 底部表格 | 每条日志的状态从「已上链」变为「待审计」或「审计通过」或「异常」 |

---

## 七、异常告警 (`/alerts`)

### 7.1 页面结构

```
┌──────────────────────────────────────────────────────────────────┐
│ [页面标题] 异常告警                                                │
│                                                                    │
│ ┌── 异常分布图 ──┐  ┌── 告警关注重点 ────────────────────────┐    │
│ │ 高危: 1        │  │ 待处理告警: 1                           │    │
│ │ 中危: 0        │  │ 处理中告警: 0                           │    │
│ │ 提示: 0        │  │ 高危占比: 100%                          │    │
│ └────────────────┘  └─────────────────────────────────────────┘    │
│                                                                    │
│ ┌── 告警卡片列表（最多每行 3 个）──────────────────────────────┐    │
│ │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │    │
│ │ │ ⚠️ 高危       │  │              │  │              │        │    │
│ │ │ "任务xxx存在   │  │              │  │              │        │    │
│ │ │  篡改风险"     │  │              │  │              │        │    │
│ │ │ 描述 + 时间    │  │              │  │              │        │    │
│ │ │ [级别] [状态]  │  │              │  │              │        │    │
│ │ └──────────────┘  └──────────────┘  └──────────────┘        │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                    │
│ 如果无告警 → 显示 Ant Design Empty "暂无告警"                      │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 数据加载

```
useEffect → getAlerts()
  → loadRawBundle() → GET /alerts
  → mapServerAlertsToView(alerts)：
    {
      id: "ALT-1",
      level: "高危",        ← mapAlertLevel('high') → '高危'
      title: "任务 xxx 存在篡改风险",
      description: "日志 #3 的重新计算哈希与存证记录不一致，请立即复核。",
      time: "2026-04-04 08:36:12",
      status: "待处理",     ← mapAlertStatus('open') → '待处理'
    }
```

### 7.3 告警是如何产生的

告警**不由前端**产生，而是**审计执行时后端自动生成**：

```
auditExecutionService.runAuditForLog():
  if (auditStatus === 'failed'):
    createAlert({
      alertType: 'hash_mismatch',
      severity: 'high',
      relatedLogId: log.id,
      relatedAuditId: auditRecord.id,
      title: `任务 ${log.task_id} 存在篡改风险`,
      description: `日志 #${log.id} 的重新计算哈希与存证记录不一致，请立即复核。`,
      status: 'open',
    })
```

**告警分级**：
| severity | 前端显示 | 颜色 | 触发条件 |
|----------|---------|------|---------|
| `high` | 高危 | 红色 #ef4444 | 哈希比对失败（篡改检测） |
| `medium` | 中危 | 金色 #f59e0b | 当前系统未使用此级别 |
| `info` | 提示 | 蓝色 #3b82f6 | 当前系统未使用此级别 |

### 7.4 告警状态

| 后端 status | 前端显示 | Badge 类型 |
|-------------|---------|-----------|
| `open` | 待处理 | error（红点） |
| `processing` | 处理中 | processing（蓝色动画） |
| `ignored` | 已忽略 | default（灰色） |

> 当前系统不提供前端修改告警状态的入口（可改进）。

---

## 八、Agent 采集端工作机制

### 8.1 启动后做什么

```
bootstrap() → createLogAgent() → agent.start()
  ↓
1. ensureFileExists(env.logFilePath)  ← 确保 apps/agent/logs/app.log 存在
2. loadOffsetState() → 读取 state/agent-state.json，获取上次的文件偏移量
3. setInterval(tick, env.pollIntervalMs)  ← 默认每 5000ms 执行一轮
```

### 8.2 每轮 tick 做什么

```
tick():
  ↓
1. collectNewLogRecords():
   - readIncrementalLines(logFilePath, lastOffset):
     - fs.statSync 获取文件大小
     - 如果 size > lastOffset → 读取新增内容
     - 按 \n 分割为多行，去空行
   - 每行包装为 PendingLogRecord，加入 pendingQueue
   - 更新 lastOffset 到文件末尾
   - saveOffsetState() → 持久化到 agent-state.json
  ↓
2. flushPendingQueue():
   - 遍历 pendingQueue 中到期的项
   - 对每项: submitLogToServer(payload) → POST http://localhost:3010/logs
     - payload = { taskId, sourceType:'agent', sourcePath, logContent, logLevel, collectedAt }
   - 成功: 从队列移除
   - 失败: retryCount++, 如果未超 maxRetryTimes 则计算下次重试时间留在队列
   - 超过最大重试次数: 丢弃该项
   - 更新 pendingQueue → saveOffsetState()
  ↓
3. syncAgentStateToServer(payload) → POST /agents/state
   - 上报 Agent 健康状态（running/retrying/error）
   - 后端写入 agent_states 表
   - Dashboard 的 "在线 Agent 数" 从此表统计
```

### 8.3 手动触发采集演示

```bash
node apps/agent/scripts/append-demo-log.js
```

**作用**：向 `apps/agent/logs/app.log` 追加一行日志文本。下次 Agent 的 tick 会检测到文件增长，读取新增行，提交到后端。

---

## 九、智能合约 LogRegistry

### 9.1 合约核心接口

```solidity
contract LogRegistry is AccessControl {
    struct LogEntry {
        string taskId;
        string logHash;
        uint256 timestamp;
        address submitter;
    }

    // 事件
    event LogStored(string indexed taskId, string logHash, uint256 timestamp, address submitter);

    // 存储
    function storeLog(string calldata taskId, string calldata logHash) external;
    // 查询
    function getLogsByTaskId(string calldata taskId) external view returns (LogEntry[] memory);

    // AccessControl 控制谁能调用 storeLog
}
```

### 9.2 写入流程

```
后端 persistLogAndWriteChain():
  → contract.storeLog("数据同步任务", "0xabc123...")
    → Hardhat 节点处理交易
    → 存入合约内部 mapping
    → 触发 LogStored 事件（带 indexed taskId）
    → 返回交易 hash + receipt（含 blockNumber）
```

### 9.3 查询流程

```
后端 resolveOnChainHashes():
  → contract.getLogsByTaskId("数据同步任务")
    → Hardhat 节点执行只读 eth_call
    → 返回 LogEntry[] 数组
    → 提取所有 logHash 字段
```

---

## 十、已知数据流问题与解决

### 10.1 ❌ 已修复：合约地址空指向

**问题**：Hardhat 重启后 `.env` 中的合约地址指向空地址，交易"成功"但无实际合约执行。
**修复**：`ensureLogRegistryContractAvailable()` 在每次链上操作前用 `provider.getCode()` 验证合约代码存在。

### 10.2 ❌ 已修复：审计使用错误合约地址

**问题**：审计时只用 `.env` 当前地址，导致历史日志（部署在旧合约）查不到链上记录。
**修复**：审计时从 `log_hash_records.contract_address` 读取该日志实际部署时的合约地址。

### 10.3 ❌ 已修复：饼图总数显示为 1

**问题**：`DistributionChart` 中 `total = reduce(...) || 1`，全 0 时显示 1。
**修复**：移除 `|| 1`，加 `total > 0 &&` 条件渲染。

### 10.4 ⚠️ 潜在问题：状态映射可能不精确

`mapLogStatus` 中 `status === 'collected'` 映射为「已上链」，但实际上 `collected` 只表示"已入库"，不保证链上写入成功。严格来说应检查 `log_hash_records.on_chain_status === 'confirmed'` 才算真正"已上链"。

### 10.5 ⚠️ 潜在问题：审计记录累积

每次点击「一键批量审计」都会对**所有日志**重新审计，产生新的 audit_records。但前端 `mergeAuditIntoLogs` 只取 `Map` 中最后一条审计记录（因为 Map 的 key 重复时覆盖），所以显示的始终是最新一次审计结果。历史审计记录会持续累积在数据库中。

### 10.6 ⚠️ 已知限制：告警无前端处理入口

当前 alerts 表有 status 字段（open/processing/ignored），但前端没有提供修改告警状态的按钮或操作入口。

---

## 十一、关键技术指标

| 指标 | 数值 | 测试条件 |
|------|------|---------|
| 日志提交平均耗时 | ~170 ms | 含链上写入，100次请求 |
| 审计吞吐量 | ~5.7 req/s | 批量审计，5轮平均 |
| 篡改检测准确率 | 100% | SHA-256 + 链上比对 |
| Agent 采集方式 | 文件增量轮询 | offset-based，默认 5s 周期 |
| 前端首屏加载 | 并行 4 路 HTTP | overview + logs + audits + alerts |
| 合约事件覆盖 | 100% | 每次 storeLog 触发 LogStored 事件 |

---

## 十二、数据库 Schema 总览

```sql
-- 5 张核心表
logs                 -- 日志原文（id, task_id, source_type, source_path, log_content, log_level, status, collected_at）
log_hash_records     -- 哈希存证（log_id → logs.id, log_hash, chain_name, contract_address, transaction_hash, block_number, on_chain_status）
audit_records        -- 审计记录（log_id, log_hash_record_id, audit_status, expected_hash, actual_hash, audit_message）
alerts               -- 告警记录（alert_type, severity, related_log_id, related_audit_id, title, description, status）
agent_states         -- Agent 状态（agent_name, source_path, last_offset, status, last_heartbeat_at）
```

**表关系**：
```
logs (1) ──▶ (N) log_hash_records  ← 一条日志可能多次上链（重试）
logs (1) ──▶ (N) audit_records     ← 一条日志可能被多次审计
audit_records (1) ──▶ (0..1) alerts ← 审计失败才生成告警
agent_states ← 独立表，Agent 心跳上报
```
