import { FireOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Progress, Row, Space, Statistic, Table, Timeline, Typography } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getDashboardData } from '../api/dataService';
import { MetricCard } from '../components/MetricCard';
import { SectionHeader } from '../components/SectionHeader';
import { DistributionChart } from '../components/DistributionChart';
import { LineTrendChart } from '../components/LineTrendChart';
import type { DashboardViewData } from '../types';

interface SummaryRow {
  key: string;
  label: string;
  value: number;
}

const initialData: DashboardViewData = {
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

const columns: TableProps<SummaryRow>['columns'] = [
  { title: '指标', dataIndex: 'label', key: 'label' },
  { title: '数值', dataIndex: 'value', key: 'value', align: 'right' },
];

export function DashboardPage() {
  const [data, setData] = useState<DashboardViewData>(initialData);

  useEffect(() => {
    void getDashboardData().then(setData);
  }, []);

  const summaryRows = useMemo<SummaryRow[]>(
    () => [
      { key: 'total', label: '日志总量', value: data.auditSummary.total },
      { key: 'passed', label: '审计通过', value: data.auditSummary.passed },
      { key: 'warning', label: '预警记录', value: data.auditSummary.warning },
      { key: 'abnormal', label: '异常记录', value: data.auditSummary.abnormal },
      { key: 'pending', label: '待审计', value: data.auditSummary.pending },
    ],
    [data.auditSummary],
  );

  return (
    <div className="section-space">
      <SectionHeader
        title="系统总览"
        subtitle="先把前端展示层做完整。后面接入真实后端时，只需要替换数据源与字段映射。"
        extra={
          <Space>
            <Button size="large">查看设计说明</Button>
            <Button type="primary" size="large" icon={<RocketOutlined />}>
              进入审计演示
            </Button>
          </Space>
        }
      />

      <Card className="hero-card" bordered={false}>
        <div className="hero-card__grid" />
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={18}>
              <Tagline />
              <Typography.Title level={1} className="hero-card__title">
                可信任务日志审计系统
              </Typography.Title>
              <Typography.Paragraph className="hero-card__desc">
                现在先把视觉层、交互层和页面结构搭稳。你之后做后端时，可以直接把 mock 接口替换成真实 API，前端结构不用推倒重来。
              </Typography.Paragraph>
              <Space wrap>
                <Button type="primary" size="large" icon={<FireOutlined />}>
                  查看日志流转
                </Button>
                <Button ghost size="large">
                  保留接口扩展位
                </Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Card className="hero-card__panel" bordered={false}>
              <Statistic title="当前前端完成度" value={78} suffix="%" />
              <Divider style={{ margin: '16px 0' }} />
              <div className="hero-card__panel-list">
                <div>
                  <span>已完成页面骨架</span>
                  <strong>4 个</strong>
                </div>
                <div>
                  <span>数据来源模式</span>
                    <strong>{data.sourceMode === 'real' ? 'Real API' : 'Mock'}</strong>
                </div>
                <div>
                  <span>后续接入方式</span>
                    <strong>{data.sourceMode === 'real' ? '已接真实接口' : '接口替换'}</strong>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[18, 18]}>
        {data.overviewCards.map((item) => (
          <Col xs={24} md={12} xl={6} key={item.title}>
            <MetricCard {...item} />
          </Col>
        ))}
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={15}>
          <Card className="panel-card" title="审计流程时间线" bordered={false}>
            <Timeline items={data.auditTimeline.map((item) => ({ color: item.color, children: item.content }))} />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card className="panel-card" title="审计摘要" bordered={false}>
            <Table<SummaryRow> columns={columns} dataSource={summaryRows} pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={12}>
          <Card className="panel-card" title="日志趋势图" extra={<span className="chart-badge">最近 7 个时间片</span>} bordered={false}>
            <LineTrendChart data={data.logTrend} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="panel-card" title="状态统计图" bordered={false}>
            <DistributionChart items={data.statusDistribution} variant="donut" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="panel-card" title="异常分布图" bordered={false}>
            <DistributionChart items={data.alertDistribution} variant="bars" />
          </Card>
        </Col>
      </Row>

      <Card className="panel-card" title="模块建设进度" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {data.systemModules.map((module) => (
            <div key={module.name} className="progress-item">
              <div className="progress-item__head">
                <div>
                  <Typography.Text strong style={{ fontSize: 16 }}>
                    {module.name}
                  </Typography.Text>
                  <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0' }}>
                    {module.description}
                  </Typography.Paragraph>
                </div>
                <strong>{module.progress}%</strong>
              </div>
              <Progress percent={module.progress} showInfo={false} strokeColor={{ from: '#4f46e5', to: '#22c55e' }} />
            </div>
          ))}
        </Space>
      </Card>
    </div>
  );
}

function Tagline() {
  return <div className="hero-badge">毕业设计前端原型 · 已完成 TypeScript 化</div>;
}
