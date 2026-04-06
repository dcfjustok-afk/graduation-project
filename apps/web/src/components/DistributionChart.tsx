import { Typography } from 'antd';
import type { AlertDistributionItem, StatusDistributionItem } from '../types';

type DistributionItem = AlertDistributionItem | StatusDistributionItem;

interface DistributionChartProps {
  items: DistributionItem[];
  variant?: 'donut' | 'bars';
}

export function DistributionChart({ items, variant = 'donut' }: DistributionChartProps) {
  if (items.length === 0) {
    return <div className="chart-empty">暂无分布数据</div>;
  }

  return variant === 'donut' ? <DonutChart items={items} /> : <BarChart items={items} />;
}

function DonutChart({ items }: { items: DistributionItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let currentOffset = 0;

  return (
    <div className="distribution-layout">
      <svg viewBox="0 0 220 220" className="donut-chart" role="img" aria-label="状态统计图">
        <circle cx="110" cy="110" r="70" className="donut-chart__track" />
        {total > 0 && items.map((item) => {
          const ratio = item.value / total;
          const dash = ratio * 439.6;
          const segment = (
            <circle
              key={item.label}
              cx="110"
              cy="110"
              r="70"
              className="donut-chart__segment"
              style={{ stroke: item.color, strokeDasharray: `${dash} ${439.6 - dash}`, strokeDashoffset: -currentOffset }}
            />
          );
          currentOffset += dash;
          return segment;
        })}
        <text x="110" y="104" textAnchor="middle" className="donut-chart__total-value">
          {total}
        </text>
        <text x="110" y="126" textAnchor="middle" className="donut-chart__total-label">
          总计
        </text>
      </svg>

      <div className="distribution-list">
        {items.map((item) => (
          <div key={item.label} className="distribution-list__item">
            <span className="distribution-list__swatch" style={{ background: item.color }} />
            <div>
              <Typography.Text strong>{item.label}</Typography.Text>
              <div className="distribution-list__meta">{item.value} 条</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ items }: { items: DistributionItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div className="bar-chart__row" key={item.label}>
          <div className="bar-chart__head">
            <Typography.Text>{item.label}</Typography.Text>
            <Typography.Text strong>{item.value}</Typography.Text>
          </div>
          <div className="bar-chart__track">
            <div className="bar-chart__fill" style={{ width: `${(item.value / maxValue) * 100}%`, background: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
