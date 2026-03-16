# server

这个目录用于实现后端服务。

## 当前已完成
- 基于 Node.js + Express + TypeScript 初始化后端工程
- 建立适合毕业设计讲解的目录结构
- 提供统一响应格式
- 提供基础健康检查接口
- 预留数据库与区块链接入扩展位

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
```
