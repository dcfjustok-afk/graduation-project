import {
  BlockOutlined,
  ClearOutlined,
  ExperimentOutlined,
  FireOutlined,
  LinkOutlined,
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

      {/* ── Hero Banner with Blockchain Network Visualization ── */}
      <div className="hero-banner">
        <div className="hero-banner__content">
          <div className="hero-banner__text">
            <div className="hero-badge">
              <BlockOutlined /> 基于区块链的可信任务日志审计系统
            </div>
            <h1 className="hero-banner__title">
              可信任务日志<span className="gradient-text">审计系统</span>
            </h1>
            <p className="hero-banner__desc">
              日志自动采集 → 链下持久化 → 链上哈希存证 → 智能审计核验 → 异常实时告警
            </p>
            <Space wrap size="middle">
              <Button type="primary" size="large" icon={<FireOutlined />} onClick={() => navigate('/logs')}
                className="btn-glow">
                查看日志流转
              </Button>
              <Button ghost size="large" onClick={() => navigate('/alerts')}>
                查看异常告警
              </Button>
            </Space>
          </div>
          <div className="hero-banner__visual">
            {/* Blockchain network SVG */}
            <svg viewBox="0 0 260 260" className="hero-network-svg">
              <defs>
                <radialGradient id="nodeGlow">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Connection lines */}
              <line x1="130" y1="50" x2="50" y2="130" className="network-link" />
              <line x1="130" y1="50" x2="210" y2="130" className="network-link" />
              <line x1="50" y1="130" x2="130" y2="210" className="network-link" />
              <line x1="210" y1="130" x2="130" y2="210" className="network-link" />
              <line x1="50" y1="130" x2="210" y2="130" className="network-link" />
              <line x1="130" y1="50" x2="130" y2="210" className="network-link" />
              {/* Glow circles */}
              <circle cx="130" cy="50" r="30" fill="url(#nodeGlow)" />
              <circle cx="50" cy="130" r="25" fill="url(#nodeGlow)" />
              <circle cx="210" cy="130" r="25" fill="url(#nodeGlow)" />
              <circle cx="130" cy="210" r="30" fill="url(#nodeGlow)" />
              {/* Node circles */}
              <circle cx="130" cy="50" r="12" className="network-node network-node--primary" />
              <circle cx="50" cy="130" r="10" className="network-node network-node--secondary" />
              <circle cx="210" cy="130" r="10" className="network-node network-node--secondary" />
              <circle cx="130" cy="210" r="12" className="network-node network-node--accent" />
              {/* Node labels */}
              <text x="130" y="54" textAnchor="middle" className="network-label">区块</text>
              <text x="50" y="134" textAnchor="middle" className="network-label">Agent</text>
              <text x="210" y="134" textAnchor="middle" className="network-label">审计</text>
              <text x="130" y="214" textAnchor="middle" className="network-label">存证</text>
              {/* Animated data packets */}
              <circle r="3" className="data-packet">
                <animateMotion dur="3s" repeatCount="indefinite" path="M130,50 L50,130" />
              </circle>
              <circle r="3" className="data-packet data-packet--alt">
                <animateMotion dur="2.5s" repeatCount="indefinite" path="M210,130 L130,210" />
              </circle>
              <circle r="3" className="data-packet">
                <animateMotion dur="3.5s" repeatCount="indefinite" path="M50,130 L210,130" />
              </circle>
            </svg>
          </div>
        </div>

        {/* Chain status strip */}
        <div className="chain-status-strip">
          <div className="chain-status-strip__item">
            <span className="chain-status-strip__icon"><LinkOutlined /></span>
            <div>
              <span className="chain-status-strip__label">系统运行状态</span>
              <span className="chain-status-strip__value" style={{ color: '#00ff88' }}>正常</span>
            </div>
          </div>
          <div className="chain-status-strip__item">
            <span className="chain-status-strip__icon"><BlockOutlined /></span>
            <div>
              <span className="chain-status-strip__label">区块链网络</span>
              <span className="chain-status-strip__value">Hardhat 本地链</span>
            </div>
          </div>
          <div className="chain-status-strip__item">
            <span className="chain-status-strip__icon"><SafetyCertificateOutlined /></span>
            <div>
              <span className="chain-status-strip__label">审计通过率</span>
              <span className="chain-status-strip__value">{passRate}%</span>
            </div>
          </div>
          <div className="chain-status-strip__item">
            <span className="chain-status-strip__icon"><RocketOutlined /></span>
            <div>
              <span className="chain-status-strip__label">功能模块</span>
              <span className="chain-status-strip__value">5 个运行中</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <Row gutter={[18, 18]}>
        {data.overviewCards.map((item) => (
          <Col xs={24} md={12} xl={6} key={item.title}>
            <MetricCard {...item} />
          </Col>
        ))}
      </Row>

      {/* ── Admin Tools: 双栏 + 审计摘要 ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card
            className="panel-card cyber-card"
            variant="borderless"
            title={<span className="card-title-icon"><ExperimentOutlined /> 篡改检测实验</span>}
            style={{ height: '100%' }}
          >
            <Typography.Paragraph type="secondary">
              一键验证系统的篡改检测能力，自动完成以下流程：
            </Typography.Paragraph>
            <div className="experiment-flow">
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">01</span>
                <div>
                  <strong>创建日志并上链存证</strong>
                  <span>生成原始日志并写入智能合约</span>
                </div>
              </div>
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">02</span>
                <div>
                  <strong>篡改数据库中日志内容</strong>
                  <span>模拟恶意修改链下数据</span>
                </div>
              </div>
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">03</span>
                <div>
                  <strong>审计引擎比对哈希差异</strong>
                  <span>链上哈希与链下记录自动比对</span>
                </div>
              </div>
              <div className="experiment-flow__step">
                <span className="experiment-flow__num">04</span>
                <div>
                  <strong>自动生成异常告警</strong>
                  <span>检测到不一致立即触发告警</span>
                </div>
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
              className="btn-danger-glow"
            >
              执行篡改实验
            </Button>
          </Card>
        </Col>
        <Col xs={24} xl={7}>
          <Card
            className="panel-card cyber-card"
            variant="borderless"
            title={<span className="card-title-icon"><ClearOutlined /> 数据重置</span>}
            style={{ height: '100%' }}
          >
            <Typography.Paragraph type="secondary">
              清空数据库，恢复初始状态。链上存证不受影响。
            </Typography.Paragraph>
            <div className="reset-tables reset-tables--compact">
              {[
                { name: 'logs', desc: '日志记录' },
                { name: 'log_hash_records', desc: '哈希存证' },
                { name: 'audit_records', desc: '审计记录' },
                { name: 'alerts', desc: '告警记录' },
                { name: 'agent_states', desc: 'Agent 状态' },
              ].map((item) => (
                <div className="reset-table-item" key={item.name}>
                  <span>{item.name}</span>
                  <Typography.Text type="secondary">{item.desc}</Typography.Text>
                </div>
              ))}
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
        <Col xs={24} xl={7}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><SafetyCertificateOutlined /> 审计摘要</span>} variant="borderless" style={{ height: '100%' }}>
            <Table<SummaryRow> columns={columns} dataSource={summaryRows} pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      {/* ── Tamper Experiment Result ── */}
      {tamperResult && (
        <Card
          className="panel-card tamper-result-card"
          variant="borderless"
          title={<span className="card-title-icon" style={{ color: '#ff3366' }}><ThunderboltOutlined /> 篡改实验结果</span>}
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

      {/* ── Charts: 数据可视化 ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><FireOutlined /> 日志趋势图</span>} extra={<span className="chart-badge">最近 7 个时间片</span>} variant="borderless">
            <LineTrendChart data={data.logTrend} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={7}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><SafetyCertificateOutlined /> 审计状态分布</span>} variant="borderless">
            <DistributionChart items={data.statusDistribution} variant="donut" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={7}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><WarningOutlined /> 异常等级分布</span>} variant="borderless">
            <DistributionChart items={data.alertDistribution} variant="bars" />
          </Card>
        </Col>
      </Row>

      {/* ── Timeline & Modules ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><BlockOutlined /> 审计流程时间线</span>} variant="borderless">
            <Timeline items={data.auditTimeline.map((item) => ({ color: item.color, children: item.content }))} />
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><RocketOutlined /> 模块建设进度</span>} variant="borderless">
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
                    <strong className="progress-item__pct">{module.progress}%</strong>
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
