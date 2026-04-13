import {
  BlockOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { VIEW_LOG_STATUSES } from '@graduation-project/shared';
import { Button, Card, Col, List, Row, Space, Statistic, Steps, Table, Tag, Timeline, Typography, message } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useState } from 'react';
import { getAuditPageData, runAudits, runTamperExperiment, type TamperExperimentResult } from '../api/dataService';
import { SectionHeader } from '../components/SectionHeader';
import { DistributionChart } from '../components/DistributionChart';
import { LineTrendChart } from '../components/LineTrendChart';
import type { DashboardViewData, LogRecord } from '../types';

const initialDashboard: DashboardViewData = {
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

const columns: TableProps<LogRecord>['columns'] = [
  { title: '日志编号', dataIndex: 'id', key: 'id' },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  {
    title: '当前状态',
    dataIndex: 'status',
    key: 'status',
    render: (value: LogRecord['status']) => <Tag color={value === VIEW_LOG_STATUSES.ABNORMAL ? 'red' : value === VIEW_LOG_STATUSES.PENDING_AUDIT ? 'gold' : 'green'}>{value}</Tag>,
  },
  { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt' },
  { title: '审计说明', dataIndex: 'auditMessage', key: 'auditMessage', ellipsis: true },
];

export function AuditPage() {
  const [dashboard, setDashboard] = useState<DashboardViewData>(initialDashboard);
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState<TamperExperimentResult | null>(null);

  const loadPage = async () => {
    const payload = await getAuditPageData();
    setDashboard(payload.dashboard);
    setLogs(payload.logs);
  };

  useEffect(() => {
    void loadPage();
  }, []);

  const handleRunAudits = async () => {
    setLoading(true);

    try {
      const results = await runAudits();
      await loadPage();
      message.success(`审计执行完成，共处理 ${results.length} 条日志`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '审计执行失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTamperExperiment = async () => {
    setTamperLoading(true);
    setTamperResult(null);
    try {
      const result = await runTamperExperiment();
      setTamperResult(result);
      message.success('篡改实验完成，审计引擎已检测到异常');
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '篡改实验失败');
    } finally {
      setTamperLoading(false);
    }
  };

  const abnormalLogs = logs.filter((l) => l.status === VIEW_LOG_STATUSES.ABNORMAL);

  return (
    <div className="section-space">
      <SectionHeader
        title="审计中心"
        subtitle="对日志进行链上哈希比对审计，检测是否存在篡改行为，并生成审计报告"
        extra={
          <Space wrap>
            <Button icon={<ExperimentOutlined />} size="large" loading={tamperLoading} onClick={() => void handleTamperExperiment()}>
              篡改实验
            </Button>
            <Button type="primary" icon={<ThunderboltOutlined />} size="large" loading={loading} onClick={() => void handleRunAudits()}>
              一键批量审计
            </Button>
          </Space>
        }
      />

      {/* ── Stats Row ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="日志总量" value={dashboard.auditSummary.total} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#00d4ff' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="审计通过" value={dashboard.auditSummary.passed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#00ff88' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="异常数量" value={dashboard.auditSummary.abnormal} prefix={<WarningOutlined />} valueStyle={{ color: '#ff3366' }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="待处理" value={dashboard.auditSummary.pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#ffaa00' }} />
          </Card>
        </Col>
      </Row>

      {/* ── Tamper Experiment Result ── */}
      {tamperResult && (
        <Card className="panel-card cyber-card tamper-result-card" variant="borderless" title={<span className="card-title-icon" style={{ color: '#ff3366' }}><ThunderboltOutlined /> 篡改实验结果</span>}>
          <Row gutter={[24, 16]}>
            <Col xs={24} xl={16}>
              <Steps
                direction="vertical"
                size="small"
                current={4}
                status="error"
                items={[
                  { title: '创建原始日志', description: `日志 ID: ${tamperResult.logId}` },
                  { title: '上链存证', description: '原始内容哈希已写入智能合约' },
                  { title: '篡改数据库', description: `内容已被恶意修改` },
                  { title: '审计检测', description: tamperResult.auditMessage, status: 'error' },
                  {
                    title: tamperResult.alertGenerated ? '告警已生成' : '审计完成',
                    description: tamperResult.alertGenerated ? '检测到篡改行为，异常告警已自动生成' : '审计完成',
                    icon: tamperResult.alertGenerated ? <WarningOutlined style={{ color: '#ff3366' }} /> : undefined,
                  },
                ]}
              />
            </Col>
            <Col xs={24} xl={8}>
              <Card variant="borderless" className="tamper-detail-card">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Typography.Text type="secondary">原始内容</Typography.Text>
                    <Typography.Paragraph code style={{ margin: '4px 0 0', fontSize: 12 }}>
                      {tamperResult.originalContent.slice(0, 80)}
                    </Typography.Paragraph>
                  </div>
                  <div>
                    <Typography.Text type="secondary">篡改后内容</Typography.Text>
                    <Typography.Paragraph code style={{ margin: '4px 0 0', fontSize: 12, color: '#ff3366' }}>
                      {tamperResult.tamperedContent.slice(0, 80)}
                    </Typography.Paragraph>
                  </div>
                  <div>
                    <Typography.Text type="secondary">审计结论</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="error">{tamperResult.auditStatus === 'failed' ? '哈希不匹配' : tamperResult.auditStatus}</Tag>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* ── Charts + Timeline ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={8}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><SafetyCertificateOutlined /> 审计状态分布</span>} variant="borderless">
            <DistributionChart items={dashboard.statusDistribution} variant="donut" />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><FireOutlined /> 日志趋势</span>} extra={<span className="chart-badge">审计驱动</span>} variant="borderless">
            <LineTrendChart data={dashboard.logTrend} />
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><BlockOutlined /> 审计时间线</span>} variant="borderless">
            <Timeline items={dashboard.auditTimeline.map((item) => ({ color: item.color, children: item.content }))} />
          </Card>
        </Col>
      </Row>

      {/* ── Anomalous Logs (if any) ── */}
      {abnormalLogs.length > 0 && (
        <Card className="panel-card cyber-card" title={<span className="card-title-icon" style={{ color: '#ff3366' }}><WarningOutlined /> 异常日志记录</span>} variant="borderless">
          <Table<LogRecord> rowKey="id" columns={columns} dataSource={abnormalLogs} pagination={false} size="small" />
        </Card>
      )}

      {/* ── Full Log Table + Audit Features ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><ClockCircleOutlined /> 最近审计对象</span>} variant="borderless">
            <Table<LogRecord> rowKey="id" columns={columns} dataSource={logs} pagination={{ pageSize: 6, showSizeChanger: false }} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><SafetyCertificateOutlined /> 审计能力说明</span>} variant="borderless">
            <List
              dataSource={[
                '支持一键批量审计，自动比对链上哈希与链下数据',
                '审计结果关联区块高度、交易哈希、合约地址等链上信息',
                '篡改检测失败时自动标记异常并生成告警记录',
                '可视化展示审计状态分布、日志趋势与异常分布',
                '支持篡改实验验证系统检测能力',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
