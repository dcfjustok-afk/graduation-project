import { CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';
import { VIEW_LOG_STATUSES } from '@graduation-project/shared';
import { Button, Card, Col, List, Result, Row, Space, Statistic, Table, Tag, Timeline, message } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useState } from 'react';
import { getAuditPageData, runAudits } from '../api/dataService';
import { SectionHeader } from '../components/SectionHeader';
import { DistributionChart } from '../components/DistributionChart';
import { LineTrendChart } from '../components/LineTrendChart';
import type { DashboardViewData, LogRecord } from '../types';

const initialDashboard: DashboardViewData = {
  overviewCards: [],
  auditTimeline: [],
  systemModules: [],
  sourceMode: 'mock',
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
];

export function AuditPage() {
  const [dashboard, setDashboard] = useState<DashboardViewData>(initialDashboard);
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="section-space">
      <SectionHeader
        title="审计中心"
        subtitle="先把审计流程页面和交互按钮做好，后续只需要把按钮动作绑定到真实接口。"
        extra={
          <Button type="primary" icon={<ThunderboltOutlined />} size="large" loading={loading} onClick={() => void handleRunAudits()}>
            一键批量审计
          </Button>
        }
      />

      <Row gutter={[18, 18]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="待处理" value={dashboard.auditSummary.pending} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="审计通过" value={dashboard.auditSummary.passed} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="预警数量" value={dashboard.auditSummary.warning} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card" bordered={false}>
            <Statistic title="异常数量" value={dashboard.auditSummary.abnormal} prefix={<WarningOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={15}>
          <Card className="panel-card" title="审计执行面板" bordered={false}>
            <Result
              status={dashboard.sourceMode === 'real' ? 'success' : 'info'}
              title={dashboard.sourceMode === 'real' ? '当前已接入真实接口数据' : '当前为 mock 演示流程'}
              subTitle="这里保留了相同的页面结构，切换数据源后无需重做交互和布局。"
            />
            <Timeline items={dashboard.auditTimeline.map((item) => ({ color: item.color, children: item.content }))} />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="panel-card" title="状态统计图" bordered={false}>
            <DistributionChart items={dashboard.statusDistribution} variant="donut" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={14}>
          <Card className="panel-card" title="日志趋势图" extra={<span className="chart-badge">审计驱动趋势</span>} bordered={false}>
            <LineTrendChart data={dashboard.logTrend} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="panel-card" title="审计增强说明" bordered={false}>
            <List
              dataSource={[
                '支持单条审计、批量审计、定时审计。',
                '接入区块高度、交易哈希、钱包地址等链上字段。',
                '已经接入真实异常原因与哈希比对结果展示。',
                '支持 mock / 真实接口模式下统一呈现图表。',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>

      <Card className="panel-card" title="最近审计对象" bordered={false}>
        <Table<LogRecord> rowKey="id" columns={columns} dataSource={logs} pagination={{ pageSize: 5, showSizeChanger: false }} />
      </Card>
    </div>
  );
}
