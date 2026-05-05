import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, ConfigProvider, Layout, Menu, Space, Table, Tag, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect } from 'react';

const { Header, Sider, Content } = Layout;

interface AuditRecordRow {
  key: string;
  auditId: string;
  taskId: string;
  logId: string;
  expectedHash: string;
  actualHash: string;
  onChainHash: string;
  auditStatus: 'passed' | 'failed' | 'pending';
  auditTime: string;
}

interface AlertRecordRow {
  key: string;
  alertType: string;
  severity: 'high' | 'medium' | 'low';
  relatedLogId: string;
  relatedAuditId: string;
  alertTitle: string;
  status: 'open' | 'processing' | 'closed';
  createdAt: string;
}

const menuItems = [
  { key: 'overview', icon: <DashboardOutlined />, label: '系统总览' },
  { key: 'logs', icon: <FileTextOutlined />, label: '日志中心' },
  { key: 'audit', icon: <SafetyCertificateOutlined />, label: '审计管理' },
  { key: 'alerts', icon: <AlertOutlined />, label: '告警管理' },
  { key: 'agent', icon: <DatabaseOutlined />, label: 'Agent 状态' },
];

const auditRows: AuditRecordRow[] = [
  {
    key: 'audit-20260504-001',
    auditId: 'audit-20260504-001',
    taskId: 'task-20260504-001',
    logId: 'log-10021',
    expectedHash: '8f2a...91c0',
    actualHash: '8f2a...91c0',
    onChainHash: '8f2a...91c0',
    auditStatus: 'passed',
    auditTime: '2026-05-04 09:18:32',
  },
  {
    key: 'audit-20260504-002',
    auditId: 'audit-20260504-002',
    taskId: 'task-20260504-002',
    logId: 'log-10022',
    expectedHash: 'c71d...0a42',
    actualHash: '9b04...d77e',
    onChainHash: 'c71d...0a42',
    auditStatus: 'failed',
    auditTime: '2026-05-04 09:22:15',
  },
  {
    key: 'audit-20260504-003',
    auditId: 'audit-20260504-003',
    taskId: 'task-20260504-003',
    logId: 'log-10023',
    expectedHash: '7d45...a8f1',
    actualHash: '7d45...a8f1',
    onChainHash: '7d45...a8f1',
    auditStatus: 'pending',
    auditTime: '2026-05-04 09:25:40',
  },
  {
    key: 'audit-20260504-004',
    auditId: 'audit-20260504-004',
    taskId: 'task-20260504-004',
    logId: 'log-10024',
    expectedHash: '4ac9...31e5',
    actualHash: '4ac9...31e5',
    onChainHash: '4ac9...31e5',
    auditStatus: 'passed',
    auditTime: '2026-05-04 09:31:08',
  },
];

const alertRows: AlertRecordRow[] = [
  {
    key: 'alert-20260504-001',
    alertType: 'hash_mismatch',
    severity: 'high',
    relatedLogId: 'log-10022',
    relatedAuditId: 'audit-20260504-002',
    alertTitle: '日志哈希不一致',
    status: 'open',
    createdAt: '2026-05-04 09:22:18',
  },
  {
    key: 'alert-20260504-002',
    alertType: 'chain_delay',
    severity: 'medium',
    relatedLogId: 'log-10025',
    relatedAuditId: 'audit-20260504-005',
    alertTitle: '链上确认延迟',
    status: 'processing',
    createdAt: '2026-05-04 09:34:06',
  },
  {
    key: 'alert-20260504-003',
    alertType: 'agent_offline',
    severity: 'low',
    relatedLogId: 'log-10026',
    relatedAuditId: '-',
    alertTitle: 'Agent 心跳超时',
    status: 'closed',
    createdAt: '2026-05-04 09:40:21',
  },
];

const auditStatusColor: Record<AuditRecordRow['auditStatus'], string> = {
  passed: 'success',
  failed: 'error',
  pending: 'warning',
};

const severityColor: Record<AlertRecordRow['severity'], string> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

const alertStatusColor: Record<AlertRecordRow['status'], string> = {
  open: 'processing',
  processing: 'warning',
  closed: 'success',
};

const auditColumns: ColumnsType<AuditRecordRow> = [
  { title: '审计编号', dataIndex: 'auditId', key: 'auditId', width: 160 },
  { title: '任务标识 taskId', dataIndex: 'taskId', key: 'taskId', width: 172 },
  { title: '日志编号 log_id', dataIndex: 'logId', key: 'logId', width: 128 },
  { title: 'expectedHash', dataIndex: 'expectedHash', key: 'expectedHash', width: 132 },
  { title: 'actualHash', dataIndex: 'actualHash', key: 'actualHash', width: 132 },
  { title: 'onChainHash', dataIndex: 'onChainHash', key: 'onChainHash', width: 132 },
  {
    title: '审计状态',
    dataIndex: 'auditStatus',
    key: 'auditStatus',
    width: 110,
    render: (status: AuditRecordRow['auditStatus']) => <Tag color={auditStatusColor[status]}>{status}</Tag>,
  },
  { title: '审计时间', dataIndex: 'auditTime', key: 'auditTime', width: 168 },
];

const alertColumns: ColumnsType<AlertRecordRow> = [
  { title: '告警类型', dataIndex: 'alertType', key: 'alertType', width: 132 },
  {
    title: '严重程度',
    dataIndex: 'severity',
    key: 'severity',
    width: 98,
    render: (severity: AlertRecordRow['severity']) => <Tag color={severityColor[severity]}>{severity}</Tag>,
  },
  { title: '关联日志 related_log_id', dataIndex: 'relatedLogId', key: 'relatedLogId', width: 168 },
  { title: '关联审计 related_audit_id', dataIndex: 'relatedAuditId', key: 'relatedAuditId', width: 190 },
  { title: '告警标题', dataIndex: 'alertTitle', key: 'alertTitle', width: 150 },
  {
    title: '处理状态',
    dataIndex: 'status',
    key: 'status',
    width: 96,
    render: (status: AlertRecordRow['status']) => <Tag color={alertStatusColor[status]}>{status}</Tag>,
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 168 },
];

export function ThesisAuditAlertPage() {
  useEffect(() => {
    document.title = '审计管理与告警管理 - 图 5-2';
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#16a34a',
          colorWarning: '#f59e0b',
          colorError: '#dc2626',
          borderRadius: 8,
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif',
        },
      }}
    >
      <Layout className="thesis-audit-page">
        <Sider width={232} className="thesis-audit-sider">
          <div className="thesis-audit-brand">
            <div className="thesis-audit-brand__mark">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <div className="thesis-audit-brand__title">可信日志审计系统</div>
              <div className="thesis-audit-brand__sub">Management Console</div>
            </div>
          </div>
          <Menu
            mode="inline"
            selectedKeys={['audit']}
            openKeys={[]}
            items={menuItems}
            className="thesis-audit-menu"
          />
          <div className="thesis-audit-sider__status">
            <span className="thesis-audit-dot" />
            <span>Agent 节点在线</span>
          </div>
        </Sider>

        <Layout className="thesis-audit-shell">
          <Header className="thesis-audit-header">
            <div>
              <Typography.Title level={3}>审计管理与告警管理</Typography.Title>
              <Typography.Text type="secondary">审计结果核验、异常告警追踪与处理状态管理</Typography.Text>
            </div>
            <Space size={8}>
              <Tag color="success" icon={<CheckCircleOutlined />}>passed</Tag>
              <Tag color="error" icon={<WarningOutlined />}>failed</Tag>
              <Tag color="warning" icon={<ClockCircleOutlined />}>pending</Tag>
            </Space>
          </Header>

          <Content className="thesis-audit-content">
            <div className="thesis-audit-grid">
              <main className="thesis-audit-main">
                <Card
                  className="thesis-audit-card thesis-audit-card--top"
                  title={<Space><SafetyCertificateOutlined />审计记录</Space>}
                >
                  <Table<AuditRecordRow>
                    columns={auditColumns}
                    dataSource={auditRows}
                    pagination={false}
                    size="small"
                    rowClassName={(record) => (record.auditStatus === 'failed' ? 'thesis-audit-table-row-failed' : '')}
                  />
                </Card>

                <Card
                  className="thesis-audit-card thesis-audit-card--bottom"
                  title={<Space><AlertOutlined />告警记录</Space>}
                >
                  <Table<AlertRecordRow>
                    columns={alertColumns}
                    dataSource={alertRows}
                    pagination={false}
                    size="small"
                    rowClassName={(record) => (record.status === 'open' ? 'thesis-audit-table-row-open' : '')}
                  />
                </Card>
              </main>

              <aside className="thesis-audit-aside">
                <Card className="thesis-audit-detail-card" title="告警详情">
                  <div className="thesis-audit-detail-card__icon">
                    <WarningOutlined />
                  </div>
                  <Typography.Title level={5}>hash_mismatch</Typography.Title>
                  <Typography.Paragraph>
                    日志哈希不一致，建议复核日志原文、数据库哈希和链上哈希。
                  </Typography.Paragraph>
                  <div className="thesis-audit-detail-card__meta">
                    <span>严重程度</span>
                    <Tag color="error">high</Tag>
                  </div>
                  <div className="thesis-audit-detail-card__meta">
                    <span>处理状态</span>
                    <Tag color="processing">open</Tag>
                  </div>
                  <div className="thesis-audit-detail-card__meta">
                    <span>关联日志</span>
                    <strong>log-10022</strong>
                  </div>
                </Card>
              </aside>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
