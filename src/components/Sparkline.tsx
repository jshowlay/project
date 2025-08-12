'use client';
import { memo, useMemo } from 'react';

type Props = {
  data: number[];          // 0..100
  width?: number;          // px
  height?: number;         // px
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
};

export default memo(function Sparkline({
  data,
  width = 160,
  height = 36,
  strokeWidth = 2,
  className = '',
  ariaLabel = 'Sparkline'
}: Props) {
  const path = useMemo(() => {
    const n = data.length;
    if (!n) return '';
    const w = width, h = height;
    const step = n > 1 ? w / (n - 1) : w;
    const clamp = (v:number) => Math.max(0, Math.min(100, v));
    const pts = data.map((v, i) => {
      const x = i * step;
      const y = h - (clamp(v) / 100) * h;
      return [x, y];
    });
    return pts.map(([x,y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`)).join(' ');
  }, [data, width, height]);

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{ display:'block' }}
    >
      <path d={path} fill="none" stroke="var(--accent, #e5c35b)" strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  );
});
