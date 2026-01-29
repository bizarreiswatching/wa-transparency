import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoneyAmount } from '@/components/data-display/money-amount';
import type { Entity, EntityAggregate } from '@wa-transparency/db';

interface OrgCardProps {
  organization: Entity;
  aggregate?: EntityAggregate;
}

export function OrgCard({ organization, aggregate }: OrgCardProps) {
  return (
    <Link href={`/org/${organization.slug}`}>
      <Card className="p-4 transition-shadow hover:shadow-lg">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-semibold text-gray-900">{organization.name}</h3>
          <Badge variant="secondary">Organization</Badge>
        </div>

        {organization.description && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
            {organization.description}
          </p>
        )}

        {aggregate && (
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div className="font-semibold text-wa-green">
                <MoneyAmount amount={aggregate.total_contributions_given} short />
              </div>
              <div className="text-xs text-gray-500">Given</div>
            </div>
            <div>
              <div className="font-semibold text-wa-blue">
                <MoneyAmount amount={aggregate.total_contracts_received} short />
              </div>
              <div className="text-xs text-gray-500">Contracts</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">
                {aggregate.lobbying_registration_count}
              </div>
              <div className="text-xs text-gray-500">Lobbyists</div>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
