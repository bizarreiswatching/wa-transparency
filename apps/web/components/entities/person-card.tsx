import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoneyAmount } from '@/components/data-display/money-amount';
import type { Entity, EntityAggregate } from '@wa-transparency/db';

interface PersonCardProps {
  person: Entity;
  aggregate?: EntityAggregate;
}

export function PersonCard({ person, aggregate }: PersonCardProps) {
  const metadata = person.metadata as { party?: string; chamber?: string; district?: string | number } | null;

  return (
    <Link href={`/person/${person.slug}`}>
      <Card className="p-4 transition-shadow hover:shadow-lg">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{person.name}</h3>
            {metadata?.district && (
              <p className="text-sm text-gray-500">District {String(metadata.district)}</p>
            )}
          </div>
          <div className="flex gap-1">
            {metadata?.party && (
              <Badge variant={metadata.party === 'D' ? 'default' : 'secondary'}>
                {metadata.party === 'D' ? 'D' : 'R'}
              </Badge>
            )}
            {metadata?.chamber && (
              <Badge variant="outline">
                {metadata.chamber === 'senate' ? 'Senate' : 'House'}
              </Badge>
            )}
          </div>
        </div>

        {aggregate && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-semibold text-wa-green">
                <MoneyAmount amount={aggregate.total_contributions_received} short />
              </div>
              <div className="text-xs text-gray-500">Received</div>
            </div>
            <div>
              <div className="font-semibold text-wa-blue">
                {aggregate.contribution_count_received}
              </div>
              <div className="text-xs text-gray-500">Donations</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">
                {aggregate.bill_sponsorship_count}
              </div>
              <div className="text-xs text-gray-500">Bills</div>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
