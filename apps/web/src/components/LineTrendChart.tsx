import { useState, useCallback, useId } from 'react';
import { Typography } from 'antd';
import type { TrendPoint } from '../types';

interface LineTrendChartProps {
  data: TrendPoint[];
}

/* ── Smooth monotone cubic interpolation ── */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildAreaPath(points: { x: number; y: number }[], bottom: number): string {
  const line = buildSmoothPath(points);
  if (!line || points.length === 0) return '';
  return `${line} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
}

export function LineTrendChart({ data }: LineTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');

  const width = 560;
  const height = 260;
  const padLeft = 48;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 36;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const maxValue = Math.max(...data.map((d) => Math.max(d.total, d.abnormal)), 1);
  const niceMax = Math.ceil(maxValue * 1.15);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round((mouseX - padLeft) / (stepX || 1));
    if (idx >= 0 && idx < data.length) setHoverIndex(idx);
    else setHoverIndex(null);
  }, [data.length, stepX, width, padLeft]);

  if (data.length === 0) {
    return <div className="chart-empty">暂无趋势数据</div>;
  }

  const getPoints = (selector: (d: TrendPoint) => number) =>
    data.map((d, i) => ({
      x: padLeft + i * stepX,
      y: padTop + chartH - (selector(d) / niceMax) * chartH,
    }));

  const totalPts = getPoints((d) => d.total);
  const abnormalPts = getPoints((d) => d.abnormal);
  const bottom = padTop + chartH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="chart-card__body chart-card__body--trend">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="trend-chart"
        role="img"
        aria-label="日志趋势图"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={`grad-primary-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`grad-danger-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.01" />
          </linearGradient>
          <filter id={`glow-p-${uid}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`glow-d-${uid}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Y-axis labels + grid */}
        {gridLines.map((ratio) => {
          const y = padTop + chartH - ratio * chartH;
          const val = Math.round(niceMax * ratio);
          return (
            <g key={ratio}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} className="trend-chart__grid" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="trend-chart__y-label">{val}</text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={buildAreaPath(totalPts, bottom)} fill={`url(#grad-primary-${uid})`} />
        <path d={buildAreaPath(abnormalPts, bottom)} fill={`url(#grad-danger-${uid})`} />

        {/* Smooth lines */}
        <path d={buildSmoothPath(totalPts)} className="trend-chart__line trend-chart__line--primary" filter={`url(#glow-p-${uid})`} />
        <path d={buildSmoothPath(abnormalPts)} className="trend-chart__line trend-chart__line--danger" filter={`url(#glow-d-${uid})`} />

        {/* Data points + X labels */}
        {data.map((item, i) => {
          const isActive = hoverIndex === i;
          return (
            <g key={item.label}>
              <circle cx={totalPts[i].x} cy={totalPts[i].y} r={isActive ? 6 : 3.5} className={`trend-chart__point trend-chart__point--primary${isActive ? ' active' : ''}`} />
              <circle cx={abnormalPts[i].x} cy={abnormalPts[i].y} r={isActive ? 6 : 3.5} className={`trend-chart__point trend-chart__point--danger${isActive ? ' active' : ''}`} />
              <text x={totalPts[i].x} y={height - 10} textAnchor="middle" className="trend-chart__label">{item.label}</text>
            </g>
          );
        })}

        {/* Hover crosshair + tooltip */}
        {hoverIndex !== null && (
          <g className="trend-chart__tooltip-group">
            <line x1={totalPts[hoverIndex].x} y1={padTop} x2={totalPts[hoverIndex].x} y2={bottom} className="trend-chart__crosshair" />
            <rect
              x={totalPts[hoverIndex].x - 56}
              y={Math.min(totalPts[hoverIndex].y, abnormalPts[hoverIndex].y) - 52}
              width={112}
              height={44}
              rx={8}
              className="trend-chart__tooltip-bg"
            />
            <text
              x={totalPts[hoverIndex].x}
              y={Math.min(totalPts[hoverIndex].y, abnormalPts[hoverIndex].y) - 34}
              textAnchor="middle"
              className="trend-chart__tooltip-text trend-chart__tooltip-text--primary"
            >
              总量: {data[hoverIndex].total}
            </text>
            <text
              x={totalPts[hoverIndex].x}
              y={Math.min(totalPts[hoverIndex].y, abnormalPts[hoverIndex].y) - 16}
              textAnchor="middle"
              className="trend-chart__tooltip-text trend-chart__tooltip-text--danger"
            >
              异常: {data[hoverIndex].abnormal}
            </text>
          </g>
        )}
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
