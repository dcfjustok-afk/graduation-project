import {
  ClearOutlined,
  ExperimentOutlined,
  FireOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Divider, App, Progress, Row, Space, Statistic, Steps, Table, Timeline, Typography } from 'antd';
import type { TableProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData, resetAllData, runTamperExperiment, type TamperExperimentResult } from '../api/dataService';
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
  const [resetLoading, setResetLoading] = useState(false);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState<TamperExperimentResult | null>(null);
  const { message, modal } = App.useApp();

  const loadData = () => {
    void getDashboardData().then(setData).catch((err: unknown) => {
      message.error(err instanceof Error ? err.message : '数据加载失败');
    });
  };

  useEffect(() => {
    loadData();
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

  const navigate = useNavigate();

  const handleReset = () => {
    modal.confirm({
      title: '确认重置所有数据？',
      content: (
        <div>
          <p>此操作将清空以下所有数据表：</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>日志记录 (logs)</li>
            <li>链上哈希记录 (log_hash_records)</li>
            <li>审计记录 (audit_records)</li>
            <li>告警记录 (alerts)</li>
            <li>Agent 状态 (agent_states)</li>
          </ul>
          <p><strong>链上已存证的数据不受影响</strong>，仅重置链下数据库。</p>
        </div>
      ),
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setResetLoading(true);
        try {
          await resetAllData();
          message.success('数据已全部重置');
          setTamperResult(null);
          loadData();
        } catch (err) {
          message.error(err instanceof Error ? err.message : '重置失败');
        } finally {
          setResetLoading(false);
        }
      },
    });
  };

  const handleTamper = async () => {
    setTamperLoading(true);
    setTamperResult(null);
    try {
      const result = await runTamperExperiment();
      setTamperResult(result);
      message.success('篡改实验完成，审计已检测到异常');
      loadData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '篡改实验失败');
    } finally {
      setTamperLoading(false);
    }
  };

  const passRate = data.auditSummary.total > 0
    ? Math.round((data.auditSummary.passed / data.auditSummary.total) * 100)
    : 0;

  return (
    <div className="section-space">
      <SectionHeader
        title="系统总览"
        subtitle="基于区块链的可信任务日志审计系统 — 实时监控日志采集、链上存证与审计状态"
        extra={
          <Space>
            <Button size="large" icon={<SafetyCertificateOutlined />} onClick={() => navigate('/audit')}>审计管理</Button>
            <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => navigate('/log-generator')}>
              日志生成
            </Button>
          </Space>
        }
      />

      {/* ── Hero Card ── */}
      <Card className="hero-card" variant="borderless">
        <div className="hero-card__grid" />
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={15}>
            <Space direction="vertical" size={18}>
              <Tagline />
              <Typography.Title level={1} className="hero-card__title">
                可信任务日志审计系统
              </Typography.Title>
              <Typography.Paragraph className="hero-card__desc">
                本系统实现了日志自动采集、链下保存、链上哈希存证、审计核验与异常告警的完整闭环，支持篡改检测与可视化分析。
              </Typography.Paragraph>
              <Space wrap>
                <Button type="primary" size="large" icon={<FireOutlined />} onClick={() => navigate('/logs')}>
                  查看日志流转
                </Button>
                <Button ghost size="large" onClick={() => navigate('/alerts')}>
                  查看异常告警
                </Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={9}>
            <Card className="hero-card__panel" variant="borderless">
              <Statistic title="系统运行状态" value="正常" valueStyle={{ color: '#00ff88' }} />
              <Divider style={{ margin: '16px 0' }} />
              <div className="hero-card__panel-list">
                <div>
                  <span>功能模块</span>
                  <strong>5 个</strong>
                </div>
                <div>
                  <span>区块链网络</span>
                  <strong>Hardhat 本地链</strong>
                </div>
                <div>
                  <span>审计通过率</span>
                  <strong>{passRate}%</strong>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* ── Metric Cards ── */}
      <Row gutter={[18, 18]}>
        {data.overviewCards.map((item) => (
          <Col xs={24} md={12} xl={6} key={item.title}>
            <MetricCard {...item} />
          </Col>
        ))}
      </Row>

      {/* ── Admin Tools: 三栏布局 ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={8}>
          <Card
            className="panel-card experiment-card"
            variant="borderless"
            title={<span><ExperimentOutlined style={{ marginRight: 8 }} />篡改检测实验</span>}
            style={{ height: '100%' }}
          >
            <Typography.Paragraph type="secondary">
              一键验证系统的篡改检测能力，自动完成以下流程：
            </Typography.Paragraph>
            <div className="experiment-flow">
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">①</span>
                <span>创建日志并上链存证</span>
              </div>
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">②</span>
                <span>篡改数据库中日志内容</span>
              </div>
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">③</span>
                <span>审计引擎比对哈希差异</span>
              </div>
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">④</span>
                <span>自动生成异常告警</span>
              </div>
            </div>
            <Button
              type="primary"
              danger
              size="large"
              icon={<ExperimentOutlined />}
              loading={tamperLoading}
              onClick={() => void handleTamper()}
              block
              style={{ marginTop: 16 }}
            >
              执行篡改实验
            </Button>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card
            className="panel-card reset-card"
            variant="borderless"
            title={<span><ClearOutlined style={{ marginRight: 8 }} />数据重置</span>}
            style={{ height: '100%' }}
          >
            <Typography.Paragraph type="secondary">
              清空数据库，恢复初始状态。链上存证不受影响。
            </Typography.Paragraph>
            <div className="reset-tables reset-tables--compact">
              <div className="reset-table-item">
                <span>logs</span>
                <Typography.Text type="secondary">日志记录</Typography.Text>
              </div>
              <div className="reset-table-item">
                <span>log_hash_records</span>
                <Typography.Text type="secondary">哈希存证</Typography.Text>
              </div>
              <div className="reset-table-item">
                <span>audit_records</span>
                <Typography.Text type="secondary">审计记录</Typography.Text>
              </div>
              <div className="reset-table-item">
                <span>alerts</span>
                <Typography.Text type="secondary">告警记录</Typography.Text>
              </div>
              <div className="reset-table-item">
                <span>agent_states</span>
                <Typography.Text type="secondary">Agent 状态</Typography.Text>
              </div>
            </div>
            <Button
              danger
              size="large"
              icon={<ClearOutlined />}
              loading={resetLoading}
              onClick={handleReset}
              block
              style={{ marginTop: 16 }}
            >
              重置所有数据
            </Button>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="panel-card" title="审计摘要" variant="borderless" style={{ height: '100%' }}>
            <Table<SummaryRow> columns={columns} dataSource={summaryRows} pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      {/* ── Tamper Experiment Result (展开式) ── */}
      {tamperResult && (
        <Card
          className="panel-card tamper-result-card"
          variant="borderless"
          title={<span><ThunderboltOutlined style={{ marginRight: 8 }} />篡改实验结果</span>}
        >
          <Steps
            direction="horizontal"
            size="small"
            current={4}
            status={tamperResult.auditStatus === 'failed' ? 'error' : 'finish'}
            items={[
              {
                title: '创建原始日志',
                description: `ID: ${tamperResult.logId}`,
              },
              {
                title: '上链存证',
                description: '哈希已写入合约',
              },
              {
                title: '篡改数据库',
                description: `"${tamperResult.tamperedContent.slice(0, 30)}…"`,
              },
              {
                title: '审计比对',
                description: tamperResult.auditMessage,
                status: tamperResult.auditStatus === 'failed' ? 'error' : 'finish',
              },
              {
                title: tamperResult.alertGenerated ? '已生成告警' : '告警生成',
                description: tamperResult.alertGenerated
                  ? '异常告警已自动生成'
                  : '审计完成',
                icon: tamperResult.alertGenerated ? <WarningOutlined style={{ color: '#ff3366' }} /> : undefined,
              },
            ]}
          />
        </Card>
      )}

      {/* ── Charts ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card className="panel-card" title="日志趋势图" extra={<span className="chart-badge">最近 7 个时间片</span>} variant="borderless">
            <LineTrendChart data={data.logTrend} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card className="panel-card" title="审计状态分布" variant="borderless">
            <DistributionChart items={data.statusDistribution} variant="donut" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="panel-card" title="异常等级分布" variant="borderless">
            <DistributionChart items={data.alertDistribution} variant="bars" />
          </Card>
        </Col>
      </Row>

      {/* ── Timeline & Modules ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card className="panel-card" title="审计流程时间线" variant="borderless">
            <Timeline items={data.auditTimeline.map((item) => ({ color: item.color, children: item.content }))} />
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card className="panel-card" title="模块建设进度" variant="borderless">
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
                  <Progress percent={module.progress} showInfo={false} strokeColor={{ from: '#00d4ff', to: '#00ff88' }} />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function Tagline() {
  return <div className="hero-badge">基于区块链的可信任务日志审计系统</div>;
}
