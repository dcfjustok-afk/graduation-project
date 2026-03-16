# 毕设项目结构设计

课题：基于区块链的可信任务日志审计系统

## 推荐组织方式
采用 **Monorepo** 结构，把前端、后端、日志采集 Agent、智能合约、公共代码放在同一个仓库中，便于：

- 统一管理版本
- 统一维护接口类型
- 统一脚本与测试
- 方便毕业设计展示与打包

## 目录结构

```text
graduation-project/
├── README.md                         # 项目总说明
├── PROJECT_STRUCTURE.md              # 项目结构设计说明
├── doc/                              # 任务书、开题报告、论文材料
│
├── apps/
│   ├── web/                          # 前端审计系统（React）
│   │   ├── public/
│   │   └── src/
│   │       ├── api/                  # 前端接口封装
│   │       ├── components/           # 通用组件
│   │       ├── pages/                # 页面
│   │       │   ├── dashboard/        # 总览页
│   │       │   ├── logs/             # 日志列表/详情
│   │       │   ├── audit/            # 审计页面
│   │       │   └── alert/            # 告警页面
│   │       ├── charts/               # 时间轴、热力图等图表封装
│   │       ├── hooks/                # 自定义 hooks
│   │       ├── layouts/              # 页面布局
│   │       ├── router/               # 路由
│   │       ├── store/                # 状态管理
│   │       ├── types/                # 前端类型定义
│   │       ├── utils/                # 工具函数
│   │       └── main.tsx              # 前端入口
│   │
│   ├── server/                       # 后端服务（Node.js + Express）
│   │   └── src/
│   │       ├── app.ts                # 服务入口
│   │       ├── config/               # 环境配置
│   │       ├── controllers/          # 控制器
│   │       ├── routes/               # 路由定义
│   │       ├── services/             # 业务逻辑
│   │       ├── repositories/         # 数据访问层
│   │       ├── db/                   # SQLite 初始化、迁移
│   │       ├── blockchain/           # 合约调用封装
│   │       ├── middleware/           # 中间件
│   │       ├── validators/           # 参数校验
│   │       ├── utils/                # 哈希、时间、日志等工具
│   │       ├── types/                # 后端类型定义
│   │       └── tests/                # 后端单元/集成测试
│   │
│   └── agent/                        # 日志采集 Agent（Node.js）
│       └── src/
│           ├── index.ts              # Agent 入口
│           ├── config/               # 采集配置
│           ├── collectors/           # 日志读取/增量采集
│           ├── watchers/             # 文件监听
│           ├── reporters/            # 上报后端
│           ├── queue/                # 重试/缓冲队列
│           ├── state/                # offset、断点续传状态
│           ├── utils/                # 工具函数
│           └── tests/                # Agent 测试
│
├── packages/
│   ├── contracts/                    # 智能合约工程（Hardhat）
│   │   ├── contracts/                # Solidity 合约
│   │   ├── scripts/                  # 部署脚本
│   │   ├── test/                     # 合约测试
│   │   ├── ignition/                 # 部署配置（如使用）
│   │   └── artifacts/                # 编译产物
│   │
│   └── shared/                       # 公共模块
│       └── src/
│           ├── constants/            # 常量
│           ├── types/                # 前后端共享类型
│           ├── schemas/              # DTO / Zod schema
│           └── audit/                # 审计相关公共逻辑
│
├── storage/
│   └── sqlite/                       # SQLite 数据文件
│       ├── app.db                    # 主数据库
│       └── backups/                  # 备份
│
├── tests/
│   └── performance/                  # 性能测试、压测脚本
│       ├── submit-benchmark.js
│       └── audit-benchmark.js
│
├── scripts/                          # 仓库级脚本
│   ├── dev.sh                        # 一键启动开发环境
│   ├── build.sh                      # 一键构建
│   ├── test.sh                       # 一键测试
│   └── seed.ts                       # 初始化测试数据
│
└── .env.example                      # 环境变量示例
```

## 各模块职责

### `apps/web`
用于实现审计界面。

建议页面：
- 总览页：展示日志数量、审计通过率、异常数量
- 日志页：展示日志列表、详情、检索
- 审计页：执行单条或批量审计
- 告警页：展示篡改告警与异常记录

### `apps/server`
用于实现核心业务后台。

建议职责：
- 接收 Agent 上报日志
- 计算或校验哈希
- 保存日志原文与元数据
- 调用智能合约完成上链
- 提供审计、查询、统计 API

### `apps/agent`
用于监听本地日志文件并自动上报。

建议职责：
- 监听日志文件变化
- 增量读取新日志
- 生成标准上报数据
- 支持失败重试与断点续传

### `packages/contracts`
用于实现区块链逻辑。

建议内容：
- 日志哈希存证合约
- 基于 `AccessControl` 的权限管理
- 合约部署脚本
- 合约单元测试

### `packages/shared`
用于放前后端共用的内容。

建议内容：
- `LogRecord`
- `AuditResult`
- `SubmitLogRequest`
- 枚举、常量、校验规则

## 数据流建议

完整链路建议为：

1. Agent 监听本地日志文件
2. Agent 提取新增日志并提交给后端
3. 后端计算哈希并写入 SQLite
4. 后端调用合约写入链上哈希与元数据
5. 前端查询后端与链上数据
6. 前端或后端发起审计比对
7. 若哈希不一致，则生成告警

## 建议的数据库表

可先设计这些表：

- `logs`：原始日志内容、任务 ID、来源、时间等
- `log_hash_records`：日志哈希、链上交易哈希、区块号
- `audit_records`：审计结果、审计时间、状态
- `alerts`：篡改告警、异常原因、处理状态
- `agent_states`：Agent 采集偏移量、最后同步时间
- `users`：系统用户与角色

## 推荐的接口分层

后端建议使用分层设计：

- `routes`：定义 API 地址
- `controllers`：接收请求与返回响应
- `services`：核心业务逻辑
- `repositories`：数据库访问
- `blockchain`：链上交互

这样更适合毕业设计答辩时讲清楚架构。

## 推荐的开发顺序

### 第一阶段：最小可运行闭环
先完成：
- 智能合约存哈希
- 后端接收日志
- Agent 监听并上报
- 前端展示一条日志的审计结果

### 第二阶段：增强功能
再补充：
- 批量审计
- 时间轴
- 热力图
- 告警面板
- 权限控制

### 第三阶段：实验与论文支持
最后补充：
- 单元测试
- 集成测试
- 性能测试
- 篡改实验
- 截图、图表、实验数据整理

## 为什么推荐这个结构

这个结构适合你的课题，因为它同时满足：

- 区块链模块独立，便于展示链上逻辑
- 前后端职责清楚，方便论文写系统架构图
- Agent 单独拆分，符合“自动采集”这一课题重点
- 共享类型独立，减少前后端接口不一致问题
- 测试与脚本分离，便于后期实验与答辩演示

## 当前已建立的目录

已在仓库中创建：
- `apps/web`
- `apps/server`
- `apps/agent`
- `packages/contracts`
- `packages/shared`
- `tests/performance`
- `scripts`
- `storage/sqlite`

下一步最合适的是：
1. 初始化整个仓库的 `package.json`
2. 初始化前端 `React`
3. 初始化后端 `Express`
4. 初始化合约工程 `Hardhat`
5. 初始化 Agent 基础代码
