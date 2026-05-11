import { VIEW_ALERT_LEVELS, VIEW_ALERT_STATUSES } from '@graduation-project/shared';
import { BellOutlined, FireOutlined, PieChartOutlined, WarningOutlined } from '@ant-design/icons';
import { Badge, Card, Col, Empty, Row, Statistic, Tag, Timeline, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getAlerts } from '../api/dataService';
import { SectionHeader } from '../components/SectionHeader';
import { DistributionChart } from '../components/DistributionChart';
import type { AlertRecord } from '../types';

const colorMap: Record<AlertRecord['level'], string> = {
  高危: 'red',
  中危: 'gold',
  提示: 'blue',
};

const badgeMap: Record<AlertRecord['status'], 'error' | 'processing' | 'default'> = {
  待处理: 'error',
  处理中: 'processing',
  已忽略: 'default',
};

const timelineColorMap: Record<AlertRecord['level'], 'red' | 'blue' | 'gray'> = {
  高危: 'red',
  中危: 'blue',
  提示: 'gray',
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);

  useEffect(() => {
    void getAlerts().then(setAlerts);
  }, []);

  const distribution = [
    { label: VIEW_ALERT_LEVELS.HIGH, value: alerts.filter((item) => item.level === VIEW_ALERT_LEVELS.HIGH).length, color: '#ef4444' },
    { label: VIEW_ALERT_LEVELS.MEDIUM, value: alerts.filter((item) => item.level === VIEW_ALERT_LEVELS.MEDIUM).length, color: '#f59e0b' },
    { label: VIEW_ALERT_LEVELS.INFO, value: alerts.filter((item) => item.level === VIEW_ALERT_LEVELS.INFO).length, color: '#2563eb' },
  ];

  const stats = useMemo(() => ({
    open: alerts.filter((item) => item.status === VIEW_ALERT_STATUSES.OPEN).length,
    processing: alerts.filter((item) => item.status === VIEW_ALERT_STATUSES.PROCESSING).length,
    highRatio: alerts.length === 0 ? '0%' : `${Math.round((alerts.filter((item) => item.level === VIEW_ALERT_LEVELS.HIGH).length / alerts.length) * 100)}%`,
  }), [alerts]);

  return (
    <div className="section-space">
      <SectionHeader title="异常告警" subtitle="审计过程中检测到的篡改、哈希不匹配等异常事件，按严重程度分级展示" />

      {/* ── Stats + Distribution ── */}
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="告警总数" value={alerts.length} prefix={<BellOutlined />} valueStyle={{ color: '#2563eb' }} />
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="待处理" value={stats.open} prefix={<WarningOutlined />} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#f59e0b' }} />
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Card className="metric-card" variant="borderless">
            <Statistic title="高危占比" value={stats.highRatio} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={8}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><PieChartOutlined /> 异常分布</span>} variant="borderless">
            <DistributionChart items={distribution} variant="bars" />
          </Card>
        </Col>
        <Col xs={24} xl={16}>
          <Card className="panel-card cyber-card" title={<span className="card-title-icon"><FireOutlined /> 告警时间线</span>} variant="borderless">
            {alerts.length === 0 ? (
              <Empty description="暂无告警记录" />
            ) : (
              <Timeline
                items={alerts.slice(0, 10).map((item) => ({
                  color: timelineColorMap[item.level] || 'gray',
                  children: (
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <Tag color={colorMap[item.level]}>{item.level}</Tag>
                        <Typography.Text strong>{item.title}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Typography.Text>
                      </div>
                      <Typography.Text type="secondary">{item.description}</Typography.Text>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Alert Cards ── */}
      {alerts.length === 0 ? (
        <Card className="panel-card cyber-card" variant="borderless">
          <Empty description="暂无告警" />
        </Card>
      ) : (
        <Row gutter={[18, 18]}>
          {alerts.map((item) => (
            <Col xs={24} md={12} xl={8} key={item.id}>
              <Card className="alert-card cyber-card" variant="borderless">
                <div className="alert-card__top">
                  <div className="alert-card__icon">
                    <BellOutlined />
                  </div>
                  <div>
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {item.title}
                    </Typography.Title>
                    <Typography.Text type="secondary">{item.time}</Typography.Text>
                  </div>
                </div>

                <Typography.Paragraph className="alert-card__desc">{item.description}</Typography.Paragraph>

                <div className="alert-card__footer">
                  <Tag color={colorMap[item.level]}>{item.level}</Tag>
                  <Badge status={badgeMap[item.status]} text={item.status} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
