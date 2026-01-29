'use client';

import { Suspense, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { ActivityItem } from '@/components/data-display/activity-item';
import type { ActivityLogEntry } from '@wa-transparency/db';

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Recent Activity</h1>
      <p className="mb-8 text-gray-600">
        Latest updates from campaign finance filings, lobbying disclosures, and contract awards.
      </p>

      {/* Filters */}
      <nav aria-label="Activity filters" className="mb-6">
        <ul className="flex flex-wrap gap-2" role="list">
          {[
            { id: 'all', label: 'All' },
            { id: 'contribution', label: 'Contributions' },
            { id: 'lobbying', label: 'Lobbying' },
            { id: 'contract', label: 'Contracts' },
            { id: 'bill', label: 'Bills' },
          ].map((filter) => (
            <li key={filter.id}>
              <FilterButton
                active={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
                aria-pressed={activeFilter === filter.id}
              >
                {filter.label}
              </FilterButton>
            </li>
          ))}
        </ul>
      </nav>

      <Suspense fallback={<Loading />}>
        <ActivityFeedWrapper filter={activeFilter} />
      </Suspense>
    </div>
  );
}

function ActivityFeedWrapper({ filter }: { filter: string }) {
  // For now, show placeholder since we need to implement the API route
  // In production, this would fetch data based on the filter
  return (
    <Card className="p-8 text-center">
      <p className="text-gray-500">
        No recent activity. Data will appear once syncing begins.
      </p>
      <p className="mt-2 text-sm text-gray-400">
        Filter: {filter}
      </p>
    </Card>
  );
}

function FilterButton({
  active,
  children,
  onClick,
  'aria-pressed': ariaPressed,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  'aria-pressed'?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2 ${
        active
          ? 'bg-wa-green text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
