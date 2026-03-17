# web

这个目录用于实现前端审计系统。

## 需要完成的内容
- 搭建 React 前端工程
- 实现登录/主页/日志列表/审计页面/告警页面
- 对接后端 RESTful API
- 对接链上查询能力
- 实现时间轴、热力图、统计卡片等可视化组件

## 核心目标
- 让用户可以直观看到日志状态
- 支持一键审计与批量比对
- 对异常日志进行高亮和告警展示

## 当前已完成
- 已搭建 `React + Vite + TypeScript` 前端工程
- 已接入 `Ant Design`
- 已完成 4 个 mock 页面：总览、日志中心、审计中心、异常告警
- 已抽离统一数据访问层，支持 `mock / 真实接口` 切换

## 数据源切换

前端默认使用 mock 数据，保证页面在后端未启动时也能稳定演示。

- `VITE_API_SOURCE=mock`：使用本地 mock 数据
- `VITE_API_SOURCE=real`：请求真实后端接口
- `VITE_API_BASE_URL=http://127.0.0.1:3010/api`：真实接口基础地址

当切到真实接口时，页面会请求：

- `GET /overview`
- `GET /logs`
- `GET /audits`
- `GET /alerts`
- `POST /audits/run`

## 审计展示

当前前端已经能展示：

- 审计通过 / 待审计 / 异常状态
- 审计说明
- 异常告警统计
- 审计时间线
- 一键触发批量审计

## 运行方式
- 安装依赖：`npm install`
- 启动开发：`npm run dev`
- 生产构建：`npm run build`
