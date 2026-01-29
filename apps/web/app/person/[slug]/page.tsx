import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { MoneyAmount } from '@/components/data-display/money-amount';
import { ContributionTable } from '@/components/data-display/contribution-table';
import { TimelineChart } from '@/components/charts/timeline-chart';
import {
  getPerson,
  getPersonContributions,
  getAllPersonSlugs,
} from '@/lib/queries/people';
import { getEntityActivityTimeline } from '@/lib/queries/charts';

interface PersonPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const person = await getPerson(params.slug);
  if (!person) return { title: 'Person Not Found' };

  return {
    title: person.name,
    description: `View political activity for ${person.name} including campaign contributions, votes, and sponsored bills.`,
    openGraph: {
      title: `${person.name} | WA Transparency`,
      description: `View political activity for ${person.name} including campaign contributions, votes, and sponsored bills.`,
      type: 'profile',
    },
  };
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPersonSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Return empty array if database is unavailable during build
    return [];
  }
}

async function PersonContributions({ entityId }: { entityId: string }) {
  const contributions = await getPersonContributions(entityId);
  return <ContributionTable contributions={contributions} />;
}

async function PersonActivityChart({ entityId }: { entityId: string }) {
  const data = await getEntityActivityTimeline(entityId, 12);
  const chartData = data.map((d) => ({
    date: d.date,
    value: d.amount,
    label: `${d.count} activities`,
  }));
  return <TimelineChart data={chartData} />;
}

export default async function PersonPage({ params }: PersonPageProps) {
  const person = await getPerson(params.slug);

  if (!person) {
    notFound();
  }

  const metadata = person.metadata as { party?: string; chamber?: string; district?: string | number } | null;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">Person</Badge>
          {metadata?.party && (
            <Badge variant={metadata.party === 'D' ? 'default' : 'outline'}>
              {metadata.party === 'D' ? 'Democrat' : 'Republican'}
            </Badge>
          )}
          {metadata?.chamber && (
            <Badge variant="outline">
              {metadata.chamber === 'senate' ? 'Senator' : 'Representative'}
            </Badge>
          )}
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{person.name}</h1>
        {metadata?.district && (
          <p className="text-lg text-gray-600">District {String(metadata.district)}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Contributions Received</div>
          <div className="text-2xl font-bold">
            <MoneyAmount amount={0} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Contributions Given</div>
          <div className="text-2xl font-bold">
            <MoneyAmount amount={0} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Bills Sponsored</div>
          <div className="text-2xl font-bold">0</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Votes Cast</div>
          <div className="text-2xl font-bold">0</div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="mb-8 p-6">
        <h2 className="mb-4 text-xl font-semibold">Activity Timeline</h2>
        <Suspense fallback={<Loading />}>
          <PersonActivityChart entityId={person.id} />
        </Suspense>
      </Card>

      {/* Top Donors */}
      <Card className="mb-8 p-6">
        <h2 className="mb-4 text-xl font-semibold">Top Donors</h2>
        <p className="text-gray-500">No donor data available yet.</p>
      </Card>

      {/* Recent Contributions */}
      <Card className="mb-8 p-6">
        <h2 className="mb-4 text-xl font-semibold">Recent Contributions</h2>
        <Suspense fallback={<Loading />}>
          <PersonContributions entityId={person.id} />
        </Suspense>
      </Card>

      {/* Sponsored Bills */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Sponsored Bills</h2>
        <p className="text-gray-500">No sponsored bills yet.</p>
      </Card>
    </div>
  );
}
