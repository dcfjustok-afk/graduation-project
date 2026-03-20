## Context

当前系统链路包含：Agent 采集日志 -> Server `POST /logs` 入库并写链（`persistLogAndWriteChain`）-> Web 端用于查看日志（`LogsPage`）与执行审计（`AuditPage`）。

现状问题：Web 端缺少一个“生成/模拟日志”的入口，导致演示与联调需要依赖外部脚本或真实 Agent 产生日志，反馈慢且不可控。

约束：
- 尽量复用现有日志提交校验（`validateLogSubmitPayload`）与落库/写链服务。
- Web 端目前以 Ant Design + 现有 `dataService`/`realClient`/`mockClient` 方式取数；`LogsPage` 已明确“字段松耦合”，允许前期字段映射适配。
- 生成日志属于“演示/测试工具”性质，需避免影响生产安全：限制批量规模、记录操作来源、必要时只在非生产环境启用。

## Goals / Non-Goals

**Goals:**
- Web 端提供可视化的日志生成平台：单条提交 + 批量生成 + 模板快捷填充。
- 提交后能在日志中心立即看到新增日志（刷新/回填）。
- 后端提供对应 API：单条创建复用现有 `POST /logs`；批量生成提供单独端点与限流/上限。
- 生成结果可追踪：返回创建成功数量、失败原因列表（校验失败/写链失败等）。

**Non-Goals:**
- 不做完整的权限/多租户系统；默认沿用现有项目的访问方式。
- 不在本模块内重做审计算法/链上合约交互；只复用现有写链流程。
- 不实现复杂的日志 DSL/脚本化规则引擎（本期以表单 + 简单模板为主）。

## Decisions

1) 新增独立页面而非塞进“日志中心”
- 选择：新增 `LogGeneratorPage`（或“日志生成”导航）作为明确工具入口。
- 理由：生成与查看是两类任务；生成需要表单/模板/批量参数，放在列表页会让信息架构变复杂。
- 备选：在 `LogsPage` 顶部加“生成日志”抽屉/弹窗。缺点是页面职责混杂，后续扩展批量/模板会膨胀。

2) API 设计：复用单条提交，新增批量生成
- 单条：继续使用 `POST /logs`，payload 与现有 `validateLogSubmitPayload` 对齐。
- 批量：新增 `POST /logs/generate`（或 `/logs/batch`），服务端内部循环调用同一“创建并写链”逻辑，保证行为一致。
- 理由：保持单条提交兼容 Agent；批量端点可做专门的上限、节流、审计字段（比如 `generatedBy=web`）。
- 备选：Web 端直接多次调用 `POST /logs`。缺点是对网络/服务端压力不可控，失败聚合困难。

3) 字段映射：在 Web 端使用“生成表单字段”到“提交 payload”的映射层
- 选择：在 `apps/web/src/api/mappers.ts` 或 `dataService` 内集中转换（例如 taskName -> taskId 或生成 taskId）。
- 理由：后端 payload 以 `taskId/sourceType/sourcePath/logContent/logLevel/collectedAt` 为主，而 UI 更倾向任务名/来源文件/内容等；集中映射便于后续改字段不影响页面。
- 备选：页面直接拼 payload。缺点是耦合字段细节。

4) 安全与可控性：批量生成加硬限制
- 选择：服务端强制限制 `count` 最大值（例如 200）与最小间隔；返回分项失败原因；可用环境变量控制是否开启端点。
- 理由：防止误操作导致写链/数据库压力过大。

## Risks / Trade-offs

- [批量生成触发链上写入，速度慢/失败率高] -> 提供“仅入库不写链”的可选模式（仅非生产/演示），或在 UI 上明确提示并展示写链错误字段。
- [字段不一致导致生成后日志中心看不到] -> 在创建成功后用返回的 log 直接插入列表（乐观更新）并提供“刷新”按钮。
- [生成端点在生产误用] -> 默认关闭批量端点；加 server 端上限/限流；必要时加简单的 header 校验（内部工具 token）。
- [Mock/Real 数据源切换导致联调混乱] -> 统一在 `dataService` 中暴露 `createLog`/`generateLogs`，mock 模式本地生成并写入 mock store，real 模式走 HTTP。
