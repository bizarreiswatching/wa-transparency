import { Suspense } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { ActivityItem } from '@/components/data-display/activity-item';
import { getRecentActivity, getActivityByType } from '@/lib/queries/activity';

export const dynamic = 'force-dynamic';

interface ActivityPageProps {
  searchParams: { type?: string };
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'contribution', label: 'Contributions' },
  { id: 'lobbying', label: 'Lobbying' },
  { id: 'contract', label: 'Contracts' },
  { id: 'bill', label: 'Bills' },
];

async function ActivityFeed({ type }: { type?: string }) {
  const activities = type && type !== 'all'
    ? await getActivityByType(type, 50)
    : await getRecentActivity(50);

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

export default function ActivityPage({ searchParams }: ActivityPageProps) {
  const activeFilter = searchParams.type || 'all';

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Recent Activity</h1>
      <p className="mb-8 text-gray-600">
        Latest updates from campaign finance filings, lobbying disclosures, and contract awards.
      </p>

      {/* Filters */}
      <nav aria-label="Activity filters" className="mb-6">
        <ul className="flex flex-wrap gap-2" role="list">
          {filters.map((filter) => (
            <li key={filter.id}>
              <Link
                href={filter.id === 'all' ? '/activity' : `/activity?type=${filter.id}`}
                className={`inline-block rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2 ${
                  activeFilter === filter.id
                    ? 'bg-wa-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Suspense fallback={<Loading />}>
        <ActivityFeed type={activeFilter} />
      </Suspense>
    </div>
  );
}
