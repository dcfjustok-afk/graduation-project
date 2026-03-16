import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card, Statistic, Typography } from 'antd';
import type { OverviewCard } from '../types';

interface MetricCardProps extends OverviewCard {}

export function MetricCard({ title, value, suffix, trend }: MetricCardProps) {
  const isNegative = trend.startsWith('-');

  return (
    <Card className="metric-card" bordered={false}>
      <div className="metric-card__label">{title}</div>
      <Statistic value={value} suffix={suffix} valueStyle={{ fontWeight: 700, color: '#0f172a' }} />
      <Typography.Text className={isNegative ? 'metric-trend negative' : 'metric-trend positive'}>
        {isNegative ? <ArrowDownOutlined /> : <ArrowUpOutlined />} 较昨日 {trend}
      </Typography.Text>
    </Card>
  );
}
