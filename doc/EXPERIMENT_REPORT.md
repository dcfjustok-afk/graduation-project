# 实验与验证报告

## 1. 实验目的

本报告用于沉淀第 14 步“补测试和实验脚本”与第 15 步“篡改实验”的实际结果，内容均基于当前仓库中的真实脚本、数据库重置隔离脚本和本地 Hardhat 网络执行结果整理，可直接为论文实验章节提供素材。

## 2. 实验环境

- 操作系统：macOS
- Node.js：项目要求 `>=18`，本次验证环境可正常完成全部脚本执行
- 区块链环境：本地 Hardhat 节点 `http://127.0.0.1:8545`
- 后端服务端口：`http://127.0.0.1:3010`
- 数据库存储：`storage/sqlite/graduation-project.db`
- 数据隔离方式：每轮验证前执行 `npm --prefix apps/server run db:reset`

## 3. 验证脚本与执行结论

### 3.1 仓库级全量验证

执行命令：

```powershell
npm run verify:all
```

验证内容：

- 合约测试
- 后端 API 与审计闭环验证
- Agent 基础能力验证
- Agent -> Server 真实闭环验证
- 前端生产构建验证

实际结论：

- 合约测试：8 项全部通过
- 后端验证：链上写入、API 回归、审计通过/失败分支均验证成功
- Agent 验证：增量读取、偏移量持久化、待重试队列验证成功，且 Agent -> Server 真闭环已通过
- 前端验证：TypeScript 检查与 Vite 构建成功

### 3.2 合约测试结果

执行命令：

```powershell
npm run verify:contracts
```

结果摘要：

- `8 passing`
- 已覆盖角色授权、日志写入、非法调用拦截、按任务查询、空参数拒绝等核心逻辑

### 3.3 后端 API 与审计验证结果

执行命令：

```powershell
npm run verify:server
```

本轮验证包含以下动作：

1. 自动向本地 Hardhat 节点重新部署 `LogRegistry`
2. 自动同步最新合约地址到 `apps/server/.env`
3. 构建后端
4. 验证核心 API
5. 生成审计演示数据
6. 校验审计结果中同时存在 `passed` 与 `failed`

最近一次通过结果摘要：

- `passedCount = 3`
- `failedCount = 1`
- `auditRecordCount = 9`
- `alertCount = 2`

说明：

- `passed` 证明“日志原文、本地哈希、链上哈希”三者一致时系统可判定审计通过。
- `failed` 证明“日志被篡改或链下记录与链上记录不一致”时系统可稳定生成异常记录和告警。

### 3.4 Agent 基础验证结果

执行命令：

```powershell
npm run verify:agent
```

最近一次结果：

```json
{
  "firstBatch": 2,
  "secondBatch": 1,
  "queueSize": 3,
  "lastOffset": 34
}
```

结果说明：

- 首次读取可识别 2 条新增日志
- 文件追加后可继续增量读取 1 条日志
- 待发送队列与偏移量状态均已写入持久化文件

### 3.5 Agent 到 Server 真实闭环验证结果

执行命令：

```powershell
npm run verify:agent
```

最近一次真实闭环结果：

```json
{
  "taskId": "verify-agent-e2e-1773894198766",
  "receivedLogs": 3,
  "onlineAgents": 1,
  "pendingQueue": 0,
  "lastOffset": 51
}
```

结果说明：

- Agent 启动后实际监听本地日志文件，并向 Server 连续上报 3 条日志。
- Server 侧日志列表可确认收到全部 3 条记录。
- 系统总览中的在线 Agent 数为 1，说明 Agent 状态同步已进入后端。
- 本地待发送队列最终清空，说明重试队列与偏移量持久化在真实联调场景下工作正常。

### 3.6 前端构建验证结果

执行命令：

```powershell
npm run verify:web
```

结果说明：

- TypeScript 类型检查通过
- Vite 生产构建通过
- 已补充手动分块策略，降低答辩阶段出现“大体积 chunk 警告”的风险

## 4. 性能实验结果

### 4.1 日志批量提交实验

执行命令：

```powershell
npm run bench:logs
```

实验参数：

- 请求总数：100
- 执行前自动重置数据库

实际结果：

```json
{
  "benchmark": "log-submit",
  "requestCount": 100,
  "successCount": 100,
  "failureCount": 0,
  "avgLatencyMs": 107.03,
  "minLatencyMs": 99.6,
  "maxLatencyMs": 190.94,
  "throughputPerSecond": 9.33
}
```

结果分析：

- 在数据库重置后的独立环境中，100 条日志提交全部成功，成功率为 100%。
- 平均响应时间约 107.03 ms，说明日志入库与链上写入闭环在单机环境下具备稳定性。
- 吞吐量约 9.33 条/秒，受本地链上交易确认和 SQLite 持久化共同影响。

### 4.2 批量审计实验

执行命令：

```powershell
npm run bench:audits
```

实验参数：

- 审计轮次：5

实际结果：

```json
{
  "benchmark": "audit-run",
  "rounds": 5,
  "successCount": 5,
  "failureCount": 0,
  "avgLatencyMs": 97.12,
  "maxLatencyMs": 127.23,
  "avgProcessedCount": 3
}
```

结果分析：

- 5 轮批量审计全部执行成功，成功率为 100%。
- 在数据库重置后，基准脚本会先生成 3 条演示日志，因此单轮平均处理约 3 条记录。
- 平均时延约 97.12 ms，说明当前小规模审计闭环已适合答辩演示和论文截图；若需要更高负载实验，可继续扩展种子数据规模。

## 5. 篡改检测实验

### 5.1 实验目标

验证系统是否能在“日志正常上链后，链下内容被人为篡改”的情况下识别异常，并自动生成审计失败记录与告警。

### 5.2 执行方式

执行命令：

```powershell
npm --prefix apps/server run experiment:tamper
```

实验脚本执行过程如下：

1. 先写入一条正常日志
2. 后端计算哈希并写入本地链上合约
3. 直接修改 SQLite 中对应日志的 `log_content`
4. 重新触发单条审计
5. 输出审计结果与告警状态

### 5.3 实际结果

最近一次结果摘要：

```json
{
  "experiment": "tamper-detection",
  "logId": 36,
  "auditStatus": "failed",
  "alertGenerated": true,
  "expectedHash": "0x705d4b1294d7d99ff533117929a032a89e5badd2e1954b994d31c96ca8ebdad5",
  "actualHash": "0x1c5332e18ddd0ae9bd0922dec8c21986bb0a2885e344b43e92ee4c0cbc30dc01"
}
```

结果分析：

- 篡改后重新计算得到的 `actualHash` 与原始上链 `expectedHash` 明显不一致。
- 审计状态被判定为 `failed`。
- 系统自动生成异常告警，证明“链上存证 + 链下重算”的设计能够有效识别篡改行为。

## 6. 关键修复记录

在本轮实验准备与回归过程中，额外发现并修复了两个影响真实性的重要问题：

1. 合约地址空部署问题
   - 现象：本地链重启后，原地址可能不再有合约代码，交易会出现“表面成功、实际未调用合约”的假阳性。
   - 修复：在后端读写链前新增合约代码存在性校验，若地址无字节码则直接报错。

2. 历史记录审计读取错误地址问题
   - 现象：旧日志审计时只读取当前环境变量中的最新地址，导致历史部署时期的日志可能被误判为 `pending`。
   - 修复：审计逻辑改为优先使用 `log_hash_records.contract_address` 指定的合约地址读取链上数据。

## 7. 可直接写入论文的结论

1. 系统已具备从日志采集、链下入库、链上存证到审计告警的完整闭环。
2. 在 100 条日志批量提交实验中，系统成功率达到 100%，平均响应时间为 107.03 ms。
3. 在 5 轮批量审计实验中，系统成功率达到 100%，平均每轮处理 3 条记录，平均耗时约 97.12 ms。
4. 在篡改检测实验中，系统可稳定识别链下日志内容被修改的情况，并自动生成审计失败记录与异常告警。
5. 通过增加“数据库重置隔离”“共享协议统一”“按历史合约地址审计”三项修复，实验结果的可复现性与可信度得到进一步提升。