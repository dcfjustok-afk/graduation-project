# performance

这个目录用于存放性能测试脚本与结果。

## 需要完成的内容
- 编写日志批量提交压测脚本
- 编写批量审计压测脚本
- 统计吞吐量、成功率、响应时间
- 输出实验数据表格或图表

## 核心目标
- 量化系统在不同负载下的表现
- 为论文中的性能分析章节提供数据支持

## 当前已补充的性能脚本

- `node tests/performance/log-submit-benchmark.js`：批量提交日志并统计吞吐量、成功率、延迟
- `node tests/performance/audit-benchmark.js`：对单个指定规模的数据集重复执行批量审计并统计平均处理时延

脚本默认将结果输出到 `tests/performance/results/` 目录，便于后续整理进论文实验章节。
根级命令 `npm run bench:logs` 与 `npm run bench:audits` 会自动完成本地链启动、合约部署、数据库重置与服务拉起。
其中 `npm run bench:audits` 会默认按 `100 / 500 / 1000` 三档自动造数，并生成：

- `audit-benchmark-100.json`
- `audit-benchmark-500.json`
- `audit-benchmark-1000.json`
- `audit-benchmark-tiers.json`

## 最近一次实验结果

### 日志批量提交

- 请求总数：100
- 成功数：100
- 失败数：0
- 平均时延：107.03 ms
- 最小时延：99.6 ms
- 最大时延：190.94 ms
- 吞吐量：9.33 条/秒

### 批量审计

- 100 条数据集：5 轮全部成功，平均时延 3067.77 ms，平均处理 100 条/轮
- 500 条数据集：5 轮全部成功，平均时延 15659.44 ms，平均处理 500 条/轮
- 1000 条数据集：5 轮全部成功，平均时延 35032.13 ms，平均处理 1000 条/轮

详细实验说明已同步整理到 `doc/EXPERIMENT_REPORT.md`。
