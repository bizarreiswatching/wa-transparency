'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface TimelineChartProps {
  data: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  type?: 'line' | 'area';
  color?: string;
  formatValue?: (value: number) => string;
  height?: number;
}

const defaultFormatValue = (value: number) => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const CustomTooltip = ({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label?: string } }>;
  label?: string;
  formatValue: (value: number) => string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="mb-1 text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-wa-green">
        {formatValue(entry.value)}
      </p>
      {entry.payload.label && (
        <p className="text-xs text-gray-500">{entry.payload.label}</p>
      )}
    </div>
  );
};

export function TimelineChart({
  data,
  type = 'area',
  color = '#2e7d32',
  formatValue = defaultFormatValue,
  height = 192,
}: TimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-50"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto mb-2 h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p>No timeline data available.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    name: item.date,
  }));

  const Chart = type === 'line' ? LineChart : AreaChart;

  return (
    <div style={{ width: '100%', height }} role="img" aria-label="Timeline chart">
      <ResponsiveContainer width="100%" height="100%">
        <Chart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            tickFormatter={(value) => {
              // Format date for display (e.g., "2024-01" -> "Jan '24")
              const [year, month] = value.split('-');
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return `${monthNames[parseInt(month, 10) - 1]} '${year.slice(-2)}`;
            }}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
            width={60}
          />
          <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
          {type === 'line' ? (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          ) : (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
