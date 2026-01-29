'use client';

import { useState, useEffect } from 'react';
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

      <ActivityFeedWrapper filter={activeFilter} />
    </div>
  );
}

function ActivityFeedWrapper({ filter }: { filter: string }) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      setError(null);
      try {
        const type = filter === 'all' ? '' : filter;
        const res = await fetch(`/api/activity?type=${type}&limit=50`);
        if (!res.ok) {
          throw new Error('Failed to fetch activity');
        }
        const { data } = await res.json();
        setActivities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [filter]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No recent activity.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
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
