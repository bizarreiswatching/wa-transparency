import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Loading } from '@/components/ui/loading';
import { MoneyAmount } from '@/components/data-display/money-amount';
import { EntityLink } from '@/components/entities/entity-link';
import { getTopLobbyists } from '@/lib/queries/lobbying';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Top Lobbyists',
  description: 'Most active lobbyists in Olympia and their clients.',
};

async function TopLobbyistsList() {
  const lobbyists = await getTopLobbyists(100);

  if (lobbyists.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No lobbyist data available yet.</p>
      </Card>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th className="text-left">Rank</th>
          <th className="text-left">Lobbyist</th>
          <th className="text-right">Clients</th>
          <th className="text-right">Total Compensation</th>
        </tr>
      </thead>
      <tbody>
        {lobbyists.map((lobbyist, index) => (
          <tr key={lobbyist.lobbyist_entity_id}>
            <td>{index + 1}</td>
            <td>
              <EntityLink
                entity={{
                  id: lobbyist.lobbyist_entity_id || '',
                  name: lobbyist.lobbyist_name,
                  type: 'person',
                  slug: lobbyist.lobbyist_entity_id || '',
                }}
              />
            </td>
            <td className="text-right">{lobbyist.client_count}</td>
            <td className="text-right">
              <MoneyAmount amount={lobbyist.total_compensation || 0} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function TopLobbyistsPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Top Lobbyists</h1>
      <p className="mb-8 text-gray-600">
        Most active lobbyists in Olympia and their clients.
      </p>

      <Suspense fallback={<Loading />}>
        <TopLobbyistsList />
      </Suspense>
    </div>
  );
}
