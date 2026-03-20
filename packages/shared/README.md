# shared

这个目录用于存放系统共享代码。

## 已落地内容
- `index.d.ts`：前后端与 Agent 共用的请求、响应、审计、告警、总览类型
- `index.js`：统一响应构造器与基础协议校验函数
- `package.json`：供 `apps/server`、`apps/agent`、`apps/web` 作为本地依赖接入

## 核心目标
- 保证不同模块使用同一套数据协议
- 降低接口不一致带来的联调成本

## 当前共享范围
- 统一 API 响应结构：`ApiResponse`、`ApiListResponse`
- 统一错误码：`ERROR_CODES`
- 统一状态枚举：审计状态、Agent 状态、告警状态、展示态状态
- 统一 Agent/Server 请求体：`LogSubmitPayload`、`AgentStateSyncPayload`
- 统一后端返回实体：`ServerLogRecord`、`ServerAuditRecord`、`ServerAlertRecord`、`ServerOverviewStats`
- 统一前端可复用视图模型：`OverviewCard`、`LogRecord`、`AlertRecord`、`DashboardData`
- 统一协议校验入口：`validateLogSubmitPayload`、`validateAgentStateSyncPayload`
