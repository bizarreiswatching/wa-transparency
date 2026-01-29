import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoneyAmount } from './money-amount';
import { DateDisplay } from './date-display';
import type { ActivityLogEntry } from '@wa-transparency/db';

interface ActivityItemProps {
  activity: ActivityLogEntry;
}

const typeLabels: Record<string, string> = {
  contribution: 'Contribution',
  contract: 'Contract',
  lobbying: 'Lobbying',
  bill: 'Bill',
  vote: 'Vote',
};

const typeColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  contribution: 'default',
  contract: 'secondary',
  lobbying: 'outline',
  bill: 'secondary',
  vote: 'outline',
};

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant={typeColors[activity.activity_type]}>
              {typeLabels[activity.activity_type]}
            </Badge>
            <DateDisplay date={activity.activity_date} relative className="text-sm text-gray-500" />
          </div>
          <h3 className="font-medium text-gray-900">{activity.title}</h3>
          {activity.description && (
            <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
          )}
          {activity.entity_id && (
            <div className="mt-2">
              <Link
                href={`/org/${activity.entity_id}`}
                className="text-sm text-wa-green hover:underline"
              >
                View entity →
              </Link>
            </div>
          )}
        </div>
        {activity.amount && (
          <div className="text-right">
            <div className="text-lg font-semibold text-wa-green">
              <MoneyAmount amount={activity.amount} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
