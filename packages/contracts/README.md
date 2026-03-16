# contracts

这个目录用于实现智能合约与链上部署工程。

## 当前已完成
- 基于 Hardhat 的智能合约工程初始化
- TypeScript 开发与测试配置
- 集成 OpenZeppelin 合约库
- 提供带权限控制的日志存证合约、部署脚本与测试

## 目录说明
- `contracts/LogRegistry.sol`：日志存证合约，使用 `AccessControl` 控制写入权限
- `scripts/deploy.ts`：本地部署脚本
- `test/LogRegistry.ts`：完整基础测试，覆盖权限、写入、查询、异常场景
- `hardhat.config.ts`：Hardhat 配置
- `.env.example`：环境变量模板

## 合约设计说明
`LogRegistry` 面向毕业设计答辩展示，设计上强调“够用、清晰、稳定、容易解释”：

- 记录业务任务的日志哈希、任务 ID、提交时间、提交者地址
- 通过 `AccessControl` 设置管理员角色和日志写入角色
- 支持按日志编号查询单条记录
- 支持按任务 ID 查询对应的日志编号和完整日志列表
- 通过事件输出链上存证结果，便于后端追踪交易结果

当前版本重点是形成一版适合论文描述的链上核心模块，后续仍可继续增强：

- 增加批量写入接口
- 增加任务状态字段
- 增加更细的角色划分
- 增加分页查询或链下索引配合方案

## 本地开发
安装依赖后可使用以下命令：

```powershell
npm run compile
npm run test
```

如需本地部署：

```powershell
npm run node
npm run deploy:local
```
