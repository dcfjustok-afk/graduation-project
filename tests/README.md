# tests

这个目录用于存放系统测试相关内容。

## 需要完成的内容
- 单元测试
- 集成测试
- 性能测试
- 安全验证实验
- 篡改检测实验

## 核心目标
- 证明系统不仅能运行，而且可靠、有效、可验证
- 为论文中的实验结果提供依据

## 当前已补充的验证入口

- `npm run verify:contracts`：执行智能合约测试
- `npm run verify:server`：构建 server 并验证核心 API 与审计逻辑
- `npm run verify:agent`：验证 Agent 增量读取与状态持久化
- `npm run verify:web`：验证前端构建
- `npm run verify:all`：串联执行全量验证

## 配套实验材料

- `tests/performance/README.md`：性能测试脚本与最近一次结果
- `doc/EXPERIMENT_REPORT.md`：完整实验报告与篡改实验结论
