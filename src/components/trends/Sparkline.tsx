'use client';

import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

export interface SparklineData {
  x: number;
  y: number;
}

export interface SparklineProps {
  data: number[] | SparklineData[];
  height?: number;
  strokeWidth?: number;
  strokeColor?: string;
  className?: string;
  showTooltip?: boolean;
}

export default function Sparkline({
  data,
  height = 64,
  strokeWidth = 2,
  strokeColor = '#3b82f6',
  className,
  showTooltip = true
}: SparklineProps) {
  // Transform data to the format expected by Recharts
  const chartData = Array.isArray(data) && data.length > 0
    ? typeof data[0] === 'number'
      ? data.map((value, index) => ({ x: index, y: value }))
      : data
    : [];

  // Handle empty or invalid data
  if (chartData.length === 0) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-200',
          className
        )}
        style={{ height }}
      >
        <span className="text-gray-400 text-xs">No data</span>
      </div>
    );
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-xs text-gray-600">
            Point {dataPoint.x + 1}: <span className="font-semibold">{dataPoint.y}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={{
              r: 4,
              fill: strokeColor,
              stroke: 'white',
              strokeWidth: 2
            }}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
