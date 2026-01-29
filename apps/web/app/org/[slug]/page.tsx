import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { MoneyAmount } from '@/components/data-display/money-amount';
import { ContributionTable } from '@/components/data-display/contribution-table';
import { SpendingSummary } from '@/components/charts/spending-summary';
import {
  getOrganization,
  getOrganizationContributions,
  getAllOrganizationSlugs,
} from '@/lib/queries/organizations';
import { getEntitySpendingByYear } from '@/lib/queries/charts';

interface OrgPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: OrgPageProps): Promise<Metadata> {
  const org = await getOrganization(params.slug);
  if (!org) return { title: 'Organization Not Found' };

  return {
    title: org.name,
    description: `View political activity for ${org.name} including campaign contributions, lobbying, and contracts.`,
    openGraph: {
      title: `${org.name} | WA Transparency`,
      description: `View political activity for ${org.name} including campaign contributions, lobbying, and contracts.`,
      type: 'profile',
    },
  };
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllOrganizationSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Return empty array if database is unavailable during build
    return [];
  }
}

async function OrgContributions({ entityId }: { entityId: string }) {
  const contributions = await getOrganizationContributions(entityId);
  return <ContributionTable contributions={contributions} />;
}

async function OrgSpendingChart({ entityId }: { entityId: string }) {
  const data = await getEntitySpendingByYear(entityId);
  return <SpendingSummary entityId={entityId} data={data} />;
}

export default async function OrgPage({ params }: OrgPageProps) {
  const org = await getOrganization(params.slug);

  if (!org) {
    notFound();
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">Organization</Badge>
          {org.ein && <Badge variant="outline">EIN: {org.ein}</Badge>}
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{org.name}</h1>
        {org.description && (
          <p className="text-lg text-gray-600">{org.description}</p>
        )}
        {org.website && (
          <a
            href={org.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-wa-green hover:underline"
          >
            {org.website}
          </a>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Contributions</div>
          <div className="text-2xl font-bold">
            <MoneyAmount amount={0} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Contracts Received</div>
          <div className="text-2xl font-bold">
            <MoneyAmount amount={0} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Lobbying Spend</div>
          <div className="text-2xl font-bold">
            <MoneyAmount amount={0} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Bills Lobbied</div>
          <div className="text-2xl font-bold">0</div>
        </Card>
      </div>

      {/* Spending Summary Chart */}
      <Card className="mb-8 p-6">
        <h2 className="mb-4 text-xl font-semibold">Spending Over Time</h2>
        <Suspense fallback={<Loading />}>
          <OrgSpendingChart entityId={org.id} />
        </Suspense>
      </Card>

      {/* Contributions Table */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Campaign Contributions</h2>
        <Suspense fallback={<Loading />}>
          <OrgContributions entityId={org.id} />
        </Suspense>
      </Card>
    </div>
  );
}
