import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { MoneyAmount } from '@/components/data-display/money-amount';
import { EntityLink } from '@/components/entities/entity-link';
import { getTopDonors } from '@/lib/queries/contributions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Top Donors',
  description: 'Organizations and individuals who have given the most to political campaigns in Washington State.',
};

async function TopDonorsList({ year }: { year?: number }) {
  const donors = await getTopDonors(year, 100);

  if (donors.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No donor data available yet.</p>
      </Card>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th className="text-left">Rank</th>
          <th className="text-left">Donor</th>
          <th className="text-right">Total Contributions</th>
          <th className="text-right">Recipients</th>
        </tr>
      </thead>
      <tbody>
        {donors.map((donor, index) => (
          <tr key={donor.id}>
            <td>{index + 1}</td>
            <td>
              <EntityLink entity={donor} />
            </td>
            <td className="text-right">
              <MoneyAmount amount={donor.total_amount} />
            </td>
            <td className="text-right">{donor.recipient_count}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function TopDonorsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Top Donors</h1>
      <p className="mb-8 text-gray-600">
        Organizations and individuals who have given the most to political campaigns.
      </p>

      {/* Year Filter */}
      <div className="mb-6 flex gap-2">
        <a
          href="/lists/top-donors"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !year
              ? 'bg-wa-green text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Time
        </a>
        {years.map((y) => (
          <a
            key={y}
            href={`/lists/top-donors?year=${y}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              year === y
                ? 'bg-wa-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {y}
          </a>
        ))}
      </div>

      <Suspense fallback={<Loading />}>
        <TopDonorsList year={year} />
      </Suspense>
    </div>
  );
}
