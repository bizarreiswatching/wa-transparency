'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SpendingData {
  year: number;
  contributions_given: number;
  contributions_received: number;
  contracts_received: number;
}

interface SpendingSummaryProps {
  entityId: string;
  data?: SpendingData[];
}

const formatCurrency = (value: number) => {
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
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="mb-2 font-semibold">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="text-sm">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export function SpendingSummary({ entityId, data }: SpendingSummaryProps) {
  // If no data provided, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>No spending data available yet.</p>
          <p className="text-xs">Data for entity: {entityId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full" role="img" aria-label="Spending summary bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Bar
            dataKey="contributions_given"
            name="Contributions Given"
            fill="#2e7d32"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="contributions_received"
            name="Contributions Received"
            fill="#1565c0"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="contracts_received"
            name="Contracts Received"
            fill="#9c27b0"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
