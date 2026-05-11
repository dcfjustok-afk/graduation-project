import {
  AlertOutlined,
  FileTextOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';
import type { OverviewCard } from '../types';

const iconMap: Record<string, { icon: ReactNode; color: string }> = {
  '日志总量': { icon: <FileTextOutlined />, color: '#2563eb' },
  '链上存证记录': { icon: <LinkOutlined />, color: '#10b981' },
  '审计记录数': { icon: <SafetyCertificateOutlined />, color: '#8b5cf6' },
  '活动告警数': { icon: <AlertOutlined />, color: '#ef4444' },
};

interface MetricCardProps extends OverviewCard {}

export function MetricCard({ title, value, suffix, trend }: MetricCardProps) {
  const mapping = iconMap[title] || { icon: <FileTextOutlined />, color: '#2563eb' };

  return (
    <Card className="metric-card" variant="borderless">
      <div className="metric-card__body">
        <div className="metric-card__icon-ring" style={{ '--accent': mapping.color } as React.CSSProperties}>
          {mapping.icon}
        </div>
        <div className="metric-card__info">
          <div className="metric-card__label">{title}</div>
          <Statistic
            value={value}
            suffix={suffix}
            valueStyle={{ fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums', fontSize: 28 }}
          />
          <span className="metric-card__trend">{trend}</span>
        </div>
      </div>
    </Card>
  );
}
