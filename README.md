# 基于区块链的可信任务日志审计系统

本仓库实现了一个面向毕业设计答辩与论文实验的“可信任务日志审计系统”原型，当前已打通以下核心闭环：

1. Agent 增量采集本地日志
2. Server 接收日志并写入 SQLite
3. Server 计算日志哈希并写入本地 Hardhat 链上合约
4. 审计服务重新计算哈希并与链上记录比对
5. 系统自动生成审计记录与异常告警
6. Web 前端可视化展示总览、日志、审计和告警数据

## 仓库说明

- 项目结构规划：`PROJECT_STRUCTURE.md`
- 开发路线图：`DEVELOPMENT_ROADMAP.md`
- 论文技术说明：`doc/TECHNICAL_DOCUMENTATION.md`
- 实验报告：`doc/EXPERIMENT_REPORT.md`
- 答辩材料草案：`doc/DEFENSE_MATERIALS_DRAFT.md`

## 常用命令

```powershell
npm --prefix apps/server run db:reset
npm run verify:all
npm run verify:server
npm run verify:agent
npm run bench:logs
npm run bench:audits
```

## 当前验证状态

- 合约测试已通过
- 服务端 API 与审计闭环已通过，并已接入数据库重置隔离
- Agent 基础验证与 Agent -> Server 真实闭环验证已通过
- 前端构建已通过
- 共享协议已沉淀到 `packages/shared`
- 最新日志压测结果：100 次请求全部成功，平均 107.03 ms，吞吐量 9.33 条/秒
- 最新审计压测结果：100 / 500 / 1000 三档 5 轮均全部成功，平均每轮分别处理 100 / 500 / 1000 条记录，平均耗时 3067.77 / 15659.44 / 35032.13 ms