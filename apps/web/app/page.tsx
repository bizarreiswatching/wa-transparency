import Link from 'next/link';
import { Suspense } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { ActivityItem } from '@/components/data-display/activity-item';
import { getGlobalStats } from '@/lib/queries/stats';
import { getRecentActivity } from '@/lib/queries/activity';

// Force dynamic rendering since we fetch live data from DB
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

async function RecentActivityPreview() {
  const activities = await getRecentActivity(5);

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">
          No recent activity. Data will appear once syncing begins.
        </p>
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

export default async function HomePage() {
  const stats = await getGlobalStats();
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Follow the Money in Washington State Politics
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          Explore campaign contributions, lobbying activities, and government
          contracts. Connect the dots between donors, politicians, and policy.
        </p>
        <div className="mx-auto max-w-xl">
          <SearchInput
            placeholder="Search organizations, people, or bills..."
            className="w-full"
          />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-wa-green">{formatCurrency(stats.total_contributions)}</div>
          <div className="text-sm text-gray-600">Total Contributions Tracked</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-wa-blue">{formatNumber(stats.org_count)}</div>
          <div className="text-sm text-gray-600">Organizations</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-wa-green">{formatNumber(stats.lobbyist_count)}</div>
          <div className="text-sm text-gray-600">Active Lobbyists</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-wa-blue">{formatNumber(stats.bill_count)}</div>
          <div className="text-sm text-gray-600">Bills Tracked</div>
        </Card>
      </section>

      {/* Quick Links */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Explore</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/lists/top-donors">
            <Card className="p-6 transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-900">Top Donors</h3>
              <p className="text-sm text-gray-600">
                See who&apos;s giving the most to political campaigns.
              </p>
            </Card>
          </Link>
          <Link href="/lists/top-recipients">
            <Card className="p-6 transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-900">Top Recipients</h3>
              <p className="text-sm text-gray-600">
                Discover which candidates receive the most funding.
              </p>
            </Card>
          </Link>
          <Link href="/lists/top-contractors">
            <Card className="p-6 transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-900">
                Top Contractors
              </h3>
              <p className="text-sm text-gray-600">
                Track Washington State government contracts.
              </p>
            </Card>
          </Link>
          <Link href="/lists/top-lobbyists">
            <Card className="p-6 transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-900">Active Lobbyists</h3>
              <p className="text-sm text-gray-600">
                See who&apos;s lobbying in Olympia and for whom.
              </p>
            </Card>
          </Link>
          <Link href="/activity">
            <Card className="p-6 transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">
                Stay up to date with the latest filings and disclosures.
              </p>
            </Card>
          </Link>
          <Link href="/about">
            <Card className="p-6 transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-semibold text-gray-900">About</h3>
              <p className="text-sm text-gray-600">
                Learn about our methodology and data sources.
              </p>
            </Card>
          </Link>
        </div>
      </section>

      {/* Recent Activity Preview */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <Link
            href="/activity"
            className="text-sm font-medium text-wa-green hover:underline"
          >
            View all
          </Link>
        </div>
        <Suspense fallback={<Loading />}>
          <RecentActivityPreview />
        </Suspense>
      </section>
    </div>
  );
}
