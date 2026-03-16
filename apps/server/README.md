# server

这个目录用于实现后端服务。

## 当前已完成
- 基于 Node.js + Express + TypeScript 初始化后端工程
- 建立适合毕业设计讲解的目录结构
- 提供统一响应格式
- 提供基础健康检查接口
- 完成 SQLite 数据库初始化与建表逻辑
- 预留区块链接入扩展位

## 目录结构
- `src/config`：环境变量与运行配置
- `src/routes`：路由层
- `src/controllers`：控制器层
- `src/services`：业务服务层
- `src/repositories`：数据访问层预留
- `src/db`：数据库初始化与连接预留
- `src/blockchain`：区块链接入预留
- `src/middleware`：中间件
- `src/utils`：通用工具与统一响应封装

## 数据库表结构

当前已实现 5 张核心表，满足毕业设计第一阶段演示：

- `logs`：保存原始日志文本、任务 ID、来源信息、采集状态
- `log_hash_records`：保存日志哈希、链上交易信息、上链状态
- `audit_records`：保存审计执行结果、审计说明和时间
- `alerts`：保存异常告警与处理状态
- `agent_states`：保存采集 Agent 的运行状态与偏移量信息

数据库文件默认保存到仓库级目录：

- `storage/sqlite/graduation-project.db`

## 当前提供的接口
- `GET /api/health`：健康检查接口

返回格式统一为：

```json
{
	"success": true,
	"message": "服务运行正常",
	"data": {
		"service": "graduation-project-server"
	}
}
```

## 本地开发

```powershell
npm run dev
npm run build
npm run start
npm run db:init
npm run db:verify
```
