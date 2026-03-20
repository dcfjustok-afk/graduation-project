import { VIEW_ALERT_LEVELS, VIEW_ALERT_STATUSES, VIEW_LOG_STATUSES } from '@graduation-project/shared';
import type { AlertRecord, AuditSummary, AuditTimelineEntry, LogRecord, OverviewCard, SystemModule } from '../types';

export const overviewCards: OverviewCard[] = [
  { title: '今日采集日志', value: 1286, suffix: '条', trend: '+12.6%' },
  { title: '链上存证完成', value: 1248, suffix: '条', trend: '+8.1%' },
  { title: '审计通过率', value: 98.4, suffix: '%', trend: '+0.9%' },
  { title: '异常告警数', value: 6, suffix: '条', trend: '-2' },
];

export const logs: LogRecord[] = [
  {
    id: 'LOG-20260316-001',
    taskName: '数据同步任务',
    source: '/var/log/sync-task.log',
    level: 'INFO',
    status: VIEW_LOG_STATUSES.CHAINED,
    submittedAt: '2026-03-16 09:10:22',
    hash: '0x9f3a...3c82',
  },
  {
    id: 'LOG-20260316-002',
    taskName: '定时备份任务',
    source: '/var/log/backup.log',
    level: 'WARN',
    status: VIEW_LOG_STATUSES.PENDING_AUDIT,
    submittedAt: '2026-03-16 09:32:08',
    hash: '0x5ca7...af12',
  },
  {
    id: 'LOG-20260316-003',
    taskName: '权限变更任务',
    source: '/var/log/auth-change.log',
    level: 'ERROR',
    status: VIEW_LOG_STATUSES.ABNORMAL,
    submittedAt: '2026-03-16 10:05:41',
    hash: '0x7bf9...8d77',
  },
  {
    id: 'LOG-20260316-004',
    taskName: '日报生成任务',
    source: '/var/log/daily-report.log',
    level: 'INFO',
    status: VIEW_LOG_STATUSES.CHAINED,
    submittedAt: '2026-03-16 10:42:15',
    hash: '0x3e12...d9c4',
  },
];

export const auditTimeline: AuditTimelineEntry[] = [
  { color: 'blue', content: '09:10 Agent 监听到新日志，提交数据同步任务日志。' },
  { color: 'green', content: '09:11 后端完成哈希计算并写入本地数据库。' },
  { color: 'green', content: '09:12 区块链写入成功，生成链上存证记录。' },
  { color: 'red', content: '10:06 审计发现权限变更任务日志与链上哈希不一致。' },
];

export const alerts: AlertRecord[] = [
  {
    id: 'ALT-001',
    level: VIEW_ALERT_LEVELS.HIGH,
    title: '权限变更任务日志存在篡改风险',
    description: '本地日志重新计算后的哈希与链上记录不一致，建议立即复核原始任务来源。',
    time: '2026-03-16 10:06:15',
    status: VIEW_ALERT_STATUSES.OPEN,
  },
  {
    id: 'ALT-002',
    level: VIEW_ALERT_LEVELS.MEDIUM,
    title: '备份任务存在延迟上链',
    description: '日志已接收但未完成链上确认，可能是网络或合约调用延迟。',
    time: '2026-03-16 09:35:42',
    status: VIEW_ALERT_STATUSES.PROCESSING,
  },
  {
    id: 'ALT-003',
    level: VIEW_ALERT_LEVELS.INFO,
    title: '日报任务需要人工复核',
    description: '该类任务已通过审计，但命中人工复核策略，可作为演示数据展示。',
    time: '2026-03-16 10:50:03',
    status: VIEW_ALERT_STATUSES.IGNORED,
  },
];

export const auditSummary: AuditSummary = {
  total: 1286,
  passed: 1266,
  warning: 14,
  abnormal: 6,
  pending: 8,
};

export const systemModules: SystemModule[] = [
  {
    name: '日志采集 Agent',
    progress: 85,
    description: '已完成监听、增量读取与 mock 上报流程展示。',
  },
  {
    name: '后端审计服务',
    progress: 40,
    description: '当前以前端 mock 数据驱动，等待后端接口接入。',
  },
  {
    name: '区块链存证模块',
    progress: 35,
    description: '当前仅保留页面扩展位，后续可接入真实链上状态。',
  },
  {
    name: '可视化审计平台',
    progress: 70,
    description: '已完成首页、日志页、审计页、告警页的静态原型。',
  },
];
