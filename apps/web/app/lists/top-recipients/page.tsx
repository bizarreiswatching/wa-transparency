import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { MoneyAmount } from '@/components/data-display/money-amount';
import { EntityLink } from '@/components/entities/entity-link';
import { getTopRecipients } from '@/lib/queries/contributions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Top Recipients',
  description: 'Candidates and committees who have received the most contributions in Washington State.',
};

async function TopRecipientsList({ year }: { year?: number }) {
  const recipients = await getTopRecipients(year, 100);

  if (recipients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No recipient data available yet.</p>
      </Card>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th className="text-left">Rank</th>
          <th className="text-left">Recipient</th>
          <th className="text-right">Total Received</th>
          <th className="text-right">Donors</th>
        </tr>
      </thead>
      <tbody>
        {recipients.map((recipient, index) => (
          <tr key={recipient.id}>
            <td>{index + 1}</td>
            <td>
              <EntityLink entity={recipient} />
            </td>
            <td className="text-right">
              <MoneyAmount amount={recipient.total_amount} />
            </td>
            <td className="text-right">{recipient.donor_count}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function TopRecipientsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const currentYear = new Date().getFullYear();
  // Default to current year, 'all' for all time
  const year = searchParams.year === 'all' ? undefined : (searchParams.year ? parseInt(searchParams.year) : currentYear);
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Top Recipients</h1>
      <p className="mb-8 text-gray-600">
        Candidates and committees who have received the most contributions.
      </p>

      {/* Year Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {years.map((y) => (
          <a
            key={y}
            href={`/lists/top-recipients?year=${y}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              year === y
                ? 'bg-wa-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {y}
          </a>
        ))}
        <a
          href="/lists/top-recipients?year=all"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !year
              ? 'bg-wa-green text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Time
        </a>
      </div>

      <Suspense fallback={<Loading />}>
        <TopRecipientsList year={year} />
      </Suspense>
    </div>
  );
}
