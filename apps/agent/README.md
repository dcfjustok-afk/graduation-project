# agent

这个目录用于实现日志采集 Agent。

## 需要完成的内容
- 监听指定日志文件或日志目录
- 增量读取新增日志内容
- 生成标准上报数据
- 将日志提交给后端服务
- 做失败重试、断点续传与本地状态保存

## 核心目标
- 实现自动化、低侵入、稳定的日志采集
- 减少人工上传日志的成本

## 当前已完成
- 基于 Node.js + TypeScript 初始化最小可运行 Agent 工程
- 支持轮询监听本地日志文件变化
- 支持按偏移量增量读取新增日志内容
- 支持调用后端 `POST /api/logs` 接口上报日志
- 支持失败重试与本地待发送队列持久化
- 支持将偏移量与同步时间保存到本地状态文件
- 支持将 Agent 运行状态同步到后端 `agent_states` 表

## 目录结构
- `src/config`：环境变量与运行配置
- `src/collector`：日志增量读取逻辑
- `src/http`：后端上报客户端
- `src/retry`：失败重试队列
- `src/state`：偏移量与队列本地存储
- `src/agent`：Agent 主流程编排
- `logs`：本地演示日志文件目录
- `state`：本地状态文件目录

## 最小运行说明

1. 先启动 `apps/server`。
2. 在 `apps/agent` 下复制 `.env.example` 为 `.env`。
3. 运行 Agent：
	- `npm run dev`
4. 追加一条测试日志：
	- `npm run demo:append`
5. Agent 会读取新增内容，并自动调用后端接口上报。

## 第 9 步闭环演示说明

当前最小闭环如下：

日志文件新增内容 -> Agent 轮询发现变化 -> Agent 追加待发送队列 -> 调用后端接口 -> Server 写入 SQLite `logs` 表 -> Agent 同步自身状态到 `agent_states` 表。

演示时建议查看两类结果：

- `GET /api/logs`：确认日志原文已经落库
- 数据库 `agent_states` 表：确认 Agent 心跳、偏移量、同步时间和运行状态已经更新

如果只想快速制造一条演示日志，可运行：

- `npm run demo:append`

## 关键文件
- `src/collector/fileReader.ts`：按偏移量读取新增内容
- `src/retry/retryQueue.ts`：失败后按次数重试
- `src/state/offsetStore.ts`：保存偏移量和待发送队列
- `src/http/logApiClient.ts`：对接后端日志提交接口
