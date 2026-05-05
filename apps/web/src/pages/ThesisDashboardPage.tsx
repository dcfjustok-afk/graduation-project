import {
  AlertOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  ConfigProvider,
  Layout,
  Menu,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import * as realClient from '../api/realClient';
import { buildDashboardViewData } from '../api/mappers';
import type {
  DashboardViewData,
  ServerAlertRecord,
  ServerAuditRecord,
  ServerLogRecord,
  ServerOverviewStats,
  TrendPoint,
} from '../types';

const { Sider, Header, Content } = Layout;

interface ThesisDashboardState {
  loading: boolean;
  error: string | null;
  stats: ServerOverviewStats;
  logs: ServerLogRecord[];
  audits: ServerAuditRecord[];
  alerts: ServerAlertRecord[];
  dashboard: DashboardViewData;
}

interface LogTableRow {
  key: number;
  taskId: string;
  level: string;
  sourcePath: string;
  collectedAt: string;
  chainStatus: string;
  auditStatus: 'passed' | 'failed' | 'pending';
}

const emptyStats: ServerOverviewStats = {
  totalLogs: 0,
  totalHashRecords: 0,
  totalAuditRecords: 0,
  totalAlerts: 0,
  openAlerts: 0,
  onlineAgents: 0,
};

const emptyDashboard: DashboardViewData = {
  overviewCards: [],
  auditTimeline: [],
  systemModules: [],
  logTrend: [],
  statusDistribution: [],
  alertDistribution: [],
  auditSummary: {
    total: 0,
    passed: 0,
    warning: 0,
    abnormal: 0,
    pending: 0,
  },
};

const initialState: ThesisDashboardState = {
  loading: true,
  error: null,
  stats: emptyStats,
  logs: [],
  audits: [],
  alerts: [],
  dashboard: emptyDashboard,
};

const menuItems = [
  { key: 'overview', icon: <DashboardOutlined />, label: '系统总览' },
  { key: 'logs', icon: <FileTextOutlined />, label: '日志中心' },
  { key: 'audit', icon: <SafetyCertificateOutlined />, label: '审计管理' },
  { key: 'alerts', icon: <AlertOutlined />, label: '告警管理' },
  { key: 'agent', icon: <DatabaseOutlined />, label: 'Agent 状态' },
];

const auditColorMap: Record<LogTableRow['auditStatus'], string> = {
  passed: 'success',
  failed: 'error',
  pending: 'warning',
};

function normalizeTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').replace('Z', '').slice(0, 19);
}

function getLatestAuditByLog(audits: ServerAuditRecord[]) {
  const map = new Map<number, ServerAuditRecord>();

  for (const audit of audits) {
    if (audit.log_id !== null && !map.has(audit.log_id)) {
      map.set(audit.log_id, audit);
    }
  }

  return map;
}

function getAuditStatus(log: ServerLogRecord, audit?: ServerAuditRecord): LogTableRow['auditStatus'] {
  if (audit?.audit_status === 'passed' || audit?.audit_status === 'failed' || audit?.audit_status === 'pending') {
    return audit.audit_status;
  }

  if (log.status.includes('failed')) {
    return 'failed';
  }

  if (log.status.includes('passed')) {
    return 'passed';
  }

  return 'pending';
}

function getChainStatus(log: ServerLogRecord) {
  if (log.status.includes('failed')) {
    return '已存证';
  }

  if (log.status.includes('audit') || log.status.includes('confirm') || log.status === 'collected') {
    return '已存证';
  }

  return '待确认';
}

function buildTrend(logs: ServerLogRecord[]): TrendPoint[] {
  const sorted = [...logs].sort((a, b) => Date.parse(a.collected_at || a.created_at) - Date.parse(b.collected_at || b.created_at));
  let abnormalCount = 0;

  return sorted.slice(-7).map((log, index) => {
    const date = new Date(log.collected_at || log.created_at);
    const label = Number.isNaN(date.getTime())
      ? '未知'
      : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    if (log.status.includes('failed')) {
      abnormalCount += 1;
    }

    return {
      label,
      total: index + 1,
      abnormal: abnormalCount,
    };
  });
}

function StatusDot({ color }: { color: string }) {
  return <span className="thesis-dot" style={{ backgroundColor: color }} />;
}

function AuditDistribution({ passed, failed, pending }: { passed: number; failed: number; pending: number }) {
  const total = Math.max(passed + failed + pending, 1);
  const passedDeg = (passed / total) * 360;
  const failedDeg = ((passed + failed) / total) * 360;
  const background = `conic-gradient(#22c55e 0deg ${passedDeg}deg, #ef4444 ${passedDeg}deg ${failedDeg}deg, #f59e0b ${failedDeg}deg 360deg)`;

  return (
    <div className="thesis-distribution">
      <div className="thesis-donut" style={{ background }}>
        <div className="thesis-donut__inner">
          <strong>{passed + failed + pending}</strong>
          <span>total</span>
        </div>
      </div>
      <div className="thesis-distribution__legend">
        <LegendLine label="passed" value={passed} color="#22c55e" />
        <LegendLine label="failed" value={failed} color="#ef4444" />
        <LegendLine label="pending" value={pending} color="#f59e0b" />
      </div>
    </div>
  );
}

function LegendLine({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="thesis-legend-line">
      <span>
        <StatusDot color={color} />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function TrendChart({ data }: { data: TrendPoint[] }) {
  const width = 640;
  const height = 230;
  const padX = 42;
  const padTop = 22;
  const padBottom = 34;
  const max = Math.max(...data.map((item) => item.total), 1);
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;
  const points = data.map((item, index) => {
    const x = data.length > 1 ? padX + (chartW / (data.length - 1)) * index : width / 2;
    const y = padTop + chartH - (item.total / max) * chartH;
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z` : '';

  if (data.length === 0) {
    return <div className="thesis-chart-empty">暂无趋势数据</div>;
  }

  return (
    <svg className="thesis-trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="日志提交趋势">
      <defs>
        <linearGradient id="thesisTrendArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1677ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1677ff" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padTop + chartH - ratio * chartH;
        return (
          <g key={ratio}>
            <line x1={padX} x2={width - padX} y1={y} y2={y} className="thesis-trend-chart__grid" />
            <text x={padX - 12} y={y + 4} textAnchor="end" className="thesis-trend-chart__axis">
              {Math.round(max * ratio)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#thesisTrendArea)" />
      <path d={linePath} className="thesis-trend-chart__line" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4" className="thesis-trend-chart__point" />
          <text x={point.x} y={height - 10} textAnchor="middle" className="thesis-trend-chart__axis">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function levelTag(level: string) {
  const color = level === 'ERROR' ? 'red' : level === 'WARN' ? 'gold' : 'blue';
  return <Tag color={color}>{level}</Tag>;
}

function auditTag(status: LogTableRow['auditStatus']) {
  return <Tag color={auditColorMap[status]}>{status}</Tag>;
}

function chainTag(status: string) {
  return <Tag color={status === '已存证' ? 'green' : 'gold'}>{status}</Tag>;
}

export function ThesisDashboardPage() {
  const [state, setState] = useState<ThesisDashboardState>(initialState);

  useEffect(() => {
    document.title = '可信任务日志审计系统 - 图 5-1';

    void Promise.all([
      realClient.getOverviewStats(),
      realClient.getLogsRaw(),
      realClient.getAuditRecords(),
      realClient.getAlertsRaw(),
    ])
      .then(([stats, logs, audits, alerts]) => {
        setState({
          loading: false,
          error: null,
          stats,
          logs,
          audits,
          alerts,
          dashboard: buildDashboardViewData(stats, logs, audits, alerts),
        });
      })
      .catch((err: unknown) => {
        setState((current) => ({
          ...current,
          loading: false,
          error: err instanceof Error ? err.message : '数据加载失败',
        }));
      });
  }, []);

  const latestAuditByLog = useMemo(() => getLatestAuditByLog(state.audits), [state.audits]);
  const trendData = useMemo(() => buildTrend(state.logs), [state.logs]);
  const tableRows = useMemo<LogTableRow[]>(
    () =>
      state.logs.slice(0, 7).map((log) => {
        const audit = latestAuditByLog.get(log.id);

        return {
          key: log.id,
          taskId: log.task_id,
          level: log.log_level,
          sourcePath: log.source_path || log.source_type,
          collectedAt: normalizeTime(log.collected_at || log.created_at),
          chainStatus: getChainStatus(log),
          auditStatus: getAuditStatus(log, audit),
        };
      }),
    [latestAuditByLog, state.logs],
  );

  const columns: ColumnsType<LogTableRow> = [
    { title: '任务标识 taskId', dataIndex: 'taskId', key: 'taskId', width: 190 },
    { title: '日志级别', dataIndex: 'level', key: 'level', width: 96, render: levelTag },
    { title: '来源路径', dataIndex: 'sourcePath', key: 'sourcePath', ellipsis: true },
    { title: '采集时间', dataIndex: 'collectedAt', key: 'collectedAt', width: 180 },
    { title: '链上状态', dataIndex: 'chainStatus', key: 'chainStatus', width: 110, render: chainTag },
    { title: '审计状态', dataIndex: 'auditStatus', key: 'auditStatus', width: 110, render: auditTag },
  ];

  const summary = state.dashboard.auditSummary;
  const latestAlerts = state.alerts.slice(0, 3);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#22c55e',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 8,
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif',
        },
      }}
    >
      <Layout className="thesis-dashboard-page">
        <Sider width={238} className="thesis-sider">
          <div className="thesis-brand">
            <div className="thesis-brand__title">可信任务日志审计系统</div>
            <div className="thesis-brand__sub">Audit Console</div>
          </div>
          <Menu mode="inline" selectedKeys={['overview']} items={menuItems} className="thesis-menu" />
          <div className="thesis-agent-box">
            <div className="thesis-agent-box__label">Agent 状态</div>
            <Space>
              <StatusDot color="#22c55e" />
              <span>{state.stats.onlineAgents || 1} 个节点在线</span>
            </Space>
          </div>
        </Sider>
        <Layout className="thesis-main-layout">
          <Header className="thesis-header">
            <div>
              <Typography.Title level={3}>可信任务日志审计系统</Typography.Title>
              <Typography.Text type="secondary">图 5-1 系统前端总览页面</Typography.Text>
            </div>
            <Space size={12}>
              <Tag color="processing">React + Ant Design</Tag>
              <Tag color="success">服务运行中</Tag>
            </Space>
          </Header>
          <Content className="thesis-content">
            {state.loading ? (
              <div className="thesis-loading"><Spin tip="正在加载本地后端数据..." /></div>
            ) : state.error ? (
              <Card className="thesis-card">
                <Typography.Text type="danger">数据加载失败：{state.error}</Typography.Text>
              </Card>
            ) : (
              <>
                <Row gutter={[16, 16]} className="thesis-metrics">
                  <Metric title="日志总数" value={state.stats.totalLogs} icon={<FileTextOutlined />} accent="#1677ff" />
                  <Metric title="审计通过数" value={summary.passed} icon={<CheckCircleOutlined />} accent="#22c55e" />
                  <Metric title="异常告警数" value={state.stats.openAlerts || latestAlerts.length} icon={<WarningOutlined />} accent="#ef4444" />
                  <Metric title="链上存证数" value={state.stats.totalHashRecords} icon={<LinkOutlined />} accent="#f59e0b" />
                </Row>

                <Row gutter={[16, 16]} className="thesis-chart-row">
                  <Col span={9}>
                    <Card
                      className="thesis-card thesis-chart-card"
                      title={<Space><SafetyCertificateOutlined />审计状态分布</Space>}
                    >
                      <AuditDistribution passed={summary.passed} failed={summary.abnormal} pending={summary.pending} />
                    </Card>
                  </Col>
                  <Col span={15}>
                    <Card
                      className="thesis-card thesis-chart-card"
                      title={<Space><BarChartOutlined />日志提交趋势</Space>}
                    >
                      <TrendChart data={trendData} />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} className="thesis-bottom-row">
                  <Col span={17}>
                    <Card className="thesis-card thesis-table-card" title={<Space><FileTextOutlined />日志列表</Space>}>
                      <Table<LogTableRow>
                        columns={columns}
                        dataSource={tableRows}
                        pagination={false}
                        size="middle"
                        rowClassName={(record) => (record.auditStatus === 'failed' ? 'thesis-table-row-failed' : '')}
                      />
                    </Card>
                  </Col>
                  <Col span={7}>
                    <Card className="thesis-card thesis-alert-card" title={<Space><AlertOutlined />最近告警</Space>}>
                      {latestAlerts.length > 0 ? (
                        <div className="thesis-alert-list">
                          {latestAlerts.map((alert) => (
                            <div className="thesis-alert-item" key={alert.id}>
                              <div className="thesis-alert-item__head">
                                <Tag color={alert.severity === 'high' ? 'red' : 'gold'}>{alert.alert_type}</Tag>
                                <span>{normalizeTime(alert.created_at).slice(5, 16)}</span>
                              </div>
                              <strong>{alert.title}</strong>
                              <p>{alert.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="thesis-alert-empty">
                          <ClockCircleOutlined />
                          <span>暂无告警</span>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

function Metric({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Col span={6}>
      <Card className="thesis-card thesis-metric-card">
        <div className="thesis-metric-card__icon" style={{ color: accent, backgroundColor: `${accent}14` }}>
          {icon}
        </div>
        <Statistic title={title} value={value} suffix="条" valueStyle={{ color: '#111827', fontWeight: 700 }} />
      </Card>
    </Col>
  );
}
