# contracts

这个目录用于实现智能合约与链上部署工程。

## 当前已完成
- 基于 Hardhat 的智能合约工程初始化
- TypeScript 开发与测试配置
- 集成 OpenZeppelin 合约库
- 提供最小可运行示例合约、部署脚本与测试

## 目录说明
- `contracts/LogRegistry.sol`：日志存证示例合约
- `scripts/deploy.ts`：本地部署脚本
- `test/LogRegistry.ts`：基础测试
- `hardhat.config.ts`：Hardhat 配置
- `.env.example`：环境变量模板

## 合约设计说明
`LogRegistry` 适合作为毕设早期讲解版本，能力保持精简：

- 记录业务任务的日志哈希
- 自动保存提交时间与提交者地址
- 提供按记录编号查询能力
- 通过事件输出链上存证结果

当前版本重点是先完成工程骨架和最小闭环，后续可以继续增强权限控制、按任务 ID 查询、审计辅助接口等能力。

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
