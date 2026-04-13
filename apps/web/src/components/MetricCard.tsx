import { Card, Statistic, Typography } from 'antd';
import type { OverviewCard } from '../types';

interface MetricCardProps extends OverviewCard {}

export function MetricCard({ title, value, suffix, trend }: MetricCardProps) {
  return (
    <Card className="metric-card" variant="borderless">
      <div className="metric-card__label">{title}</div>
      <Statistic value={value} suffix={suffix} valueStyle={{ fontWeight: 700, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }} />
      <Typography.Text className="metric-trend neutral">
        {trend}
      </Typography.Text>
    </Card>
  );
}
