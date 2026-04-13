import { useState, useId } from 'react';
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

/* ── Donut Chart ── */
function DonutChart({ items }: { items: DistributionItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');

  const radius = 80;
  const cx = 110;
  const cy = 110;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const segments = items.map((item, idx) => {
    const ratio = total > 0 ? item.value / total : 0;
    const dash = ratio * circumference;
    const offset = currentOffset;
    currentOffset += dash;
    return { item, ratio, dash, offset, idx };
  });

  return (
    <div className="distribution-layout">
      <div className="donut-chart-wrapper">
        <svg viewBox="0 0 220 220" className="donut-chart" role="img" aria-label="状态统计图">
          <defs>
            {segments.map((seg) => (
              <linearGradient key={seg.idx} id={`donut-grad-${uid}-${seg.idx}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={seg.item.color} stopOpacity="1" />
                <stop offset="100%" stopColor={seg.item.color} stopOpacity="0.7" />
              </linearGradient>
            ))}
            <filter id={`donut-shadow-${uid}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* Track */}
          <circle cx={cx} cy={cy} r={radius} className="donut-chart__track" />

          {/* Segments */}
          {total > 0 && segments.map((seg) => (
            <circle
              key={seg.idx}
              cx={cx}
              cy={cy}
              r={radius}
              className={`donut-chart__segment${hoverIdx === seg.idx ? ' donut-chart__segment--active' : ''}`}
              style={{
                stroke: `url(#donut-grad-${uid}-${seg.idx})`,
                strokeDasharray: `${seg.dash} ${circumference - seg.dash}`,
                strokeDashoffset: -seg.offset,
                strokeWidth: hoverIdx === seg.idx ? 26 : 22,
              }}
              onMouseEnter={() => setHoverIdx(seg.idx)}
              onMouseLeave={() => setHoverIdx(null)}
              filter={hoverIdx === seg.idx ? `url(#donut-shadow-${uid})` : undefined}
            />
          ))}

          {/* Center text */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="donut-chart__total-value">
            {hoverIdx !== null ? items[hoverIdx].value : total}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" className="donut-chart__total-label">
            {hoverIdx !== null ? items[hoverIdx].label : '总计'}
          </text>
          {hoverIdx !== null && total > 0 && (
            <text x={cx} y={cy + 34} textAnchor="middle" className="donut-chart__total-pct">
              {Math.round((items[hoverIdx].value / total) * 100)}%
            </text>
          )}
        </svg>
      </div>

      <div className="distribution-list">
        {items.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div
              key={item.label}
              className={`distribution-list__item${hoverIdx === idx ? ' distribution-list__item--active' : ''}`}
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <span className="distribution-list__swatch" style={{ background: item.color }} />
              <div className="distribution-list__info">
                <Typography.Text strong>{item.label}</Typography.Text>
                <div className="distribution-list__meta">
                  <span className="distribution-list__value">{item.value} 条</span>
                  <span className="distribution-list__pct">{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Bar Chart ── */
function BarChart({ items }: { items: DistributionItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const uid = useId().replace(/:/g, '');

  return (
    <div className="bar-chart">
      {items.map((item, idx) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const totalPct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div className="bar-chart__row" key={item.label}>
            <div className="bar-chart__head">
              <div className="bar-chart__label-group">
                <span className="bar-chart__dot" style={{ background: item.color }} />
                <Typography.Text>{item.label}</Typography.Text>
              </div>
              <div className="bar-chart__values">
                <Typography.Text strong className="bar-chart__count">{item.value}</Typography.Text>
                <span className="bar-chart__pct">{totalPct}%</span>
              </div>
            </div>
            <div className="bar-chart__track">
              <div className="bar-chart__fill" style={{ width: `${pct}%` }}>
                <svg width="100%" height="100%" aria-hidden="true">
                  <defs>
                    <linearGradient id={`bar-grad-${uid}-${idx}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={item.color} stopOpacity="0.85" />
                      <stop offset="100%" stopColor={item.color} stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" rx="6" fill={`url(#bar-grad-${uid}-${idx})`} />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
