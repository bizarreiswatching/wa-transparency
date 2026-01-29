import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { MoneyAmount } from '@/components/data-display/money-amount';
import { EntityLink } from '@/components/entities/entity-link';
import { getTopContractors } from '@/lib/queries/contracts';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Top Contractors',
  description: 'Washington businesses receiving the largest federal contracts.',
};

async function TopContractorsList() {
  const contractors = await getTopContractors(100);

  if (contractors.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No contractor data available yet.</p>
      </Card>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th className="text-left">Rank</th>
          <th className="text-left">Contractor</th>
          <th className="text-right">Total Contracts</th>
          <th className="text-right">Contract Count</th>
        </tr>
      </thead>
      <tbody>
        {contractors.map((contractor, index) => (
          <tr key={contractor.id}>
            <td>{index + 1}</td>
            <td>
              <EntityLink entity={contractor} />
            </td>
            <td className="text-right">
              <MoneyAmount amount={contractor.total_amount} />
            </td>
            <td className="text-right">{contractor.contract_count}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function TopContractorsPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Top Contractors</h1>
      <p className="mb-8 text-gray-600">
        Washington businesses receiving the largest federal contracts.
      </p>

      <Suspense fallback={<Loading />}>
        <TopContractorsList />
      </Suspense>
    </div>
  );
}
