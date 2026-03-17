import { Typography } from 'antd';
import type { TrendPoint } from '../types';

interface LineTrendChartProps {
  data: TrendPoint[];
}

export function LineTrendChart({ data }: LineTrendChartProps) {
  if (data.length === 0) {
    return <div className="chart-empty">暂无趋势数据</div>;
  }

  const width = 520;
  const height = 220;
  const padding = 24;
  const maxValue = Math.max(...data.map((item) => Math.max(item.total, item.abnormal)), 1);
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const buildPath = (selector: (item: TrendPoint) => number) =>
    data
      .map((item, index) => {
        const x = padding + index * stepX;
        const y = height - padding - (selector(item) / maxValue) * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  const totalPath = buildPath((item) => item.total);
  const abnormalPath = buildPath((item) => item.abnormal);

  return (
    <div className="chart-card__body chart-card__body--trend">
      <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" role="img" aria-label="日志趋势图">
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padding - ratio * (height - padding * 2);
          return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} className="trend-chart__grid" />;
        })}

        <path d={totalPath} className="trend-chart__line trend-chart__line--primary" />
        <path d={abnormalPath} className="trend-chart__line trend-chart__line--danger" />

        {data.map((item, index) => {
          const x = padding + index * stepX;
          const totalY = height - padding - (item.total / maxValue) * (height - padding * 2);
          const abnormalY = height - padding - (item.abnormal / maxValue) * (height - padding * 2);

          return (
            <g key={item.label}>
              <circle cx={x} cy={totalY} r={4} className="trend-chart__point trend-chart__point--primary" />
              <circle cx={x} cy={abnormalY} r={4} className="trend-chart__point trend-chart__point--danger" />
              <text x={x} y={height - 6} textAnchor="middle" className="trend-chart__label">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="chart-legend">
        <Legend label="日志总量" color="primary" />
        <Legend label="异常数量" color="danger" />
      </div>
    </div>
  );
}

function Legend({ label, color }: { label: string; color: 'primary' | 'danger' }) {
  return (
    <div className="chart-legend__item">
      <span className={`chart-legend__dot chart-legend__dot--${color}`} />
      <Typography.Text>{label}</Typography.Text>
    </div>
  );
}
