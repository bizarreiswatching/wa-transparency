import Link from 'next/link';
import { Table } from '@/components/ui/table';
import { MoneyAmount } from './money-amount';
import { DateDisplay } from './date-display';
import type { Contribution, EntityType } from '@wa-transparency/db';

interface ContributionWithEntities extends Contribution {
  contributor_entity_type?: EntityType;
  contributor_entity_slug?: string;
  recipient_entity_type?: EntityType;
  recipient_entity_slug?: string;
}

interface ContributionTableProps {
  contributions: ContributionWithEntities[];
  showContributor?: boolean;
  showRecipient?: boolean;
}

function getEntityRoute(type?: EntityType): string {
  switch (type) {
    case 'person':
      return '/person';
    case 'organization':
      return '/org';
    case 'committee':
      return '/org'; // Committees use org route
    case 'government':
      return '/org'; // Government entities use org route
    default:
      return '/org';
  }
}

export function ContributionTable({
  contributions,
  showContributor = true,
  showRecipient = true,
}: ContributionTableProps) {
  if (contributions.length === 0) {
    return (
      <p className="py-4 text-center text-gray-500">No contributions found.</p>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th className="text-left" scope="col">Date</th>
          {showContributor && <th className="text-left" scope="col">Contributor</th>}
          {showRecipient && <th className="text-left" scope="col">Recipient</th>}
          <th className="text-right" scope="col">Amount</th>
          <th className="text-left" scope="col">Type</th>
        </tr>
      </thead>
      <tbody>
        {contributions.map((contribution) => {
          const contributorSlug = contribution.contributor_entity_slug || contribution.contributor_entity_id;
          const recipientSlug = contribution.recipient_entity_slug || contribution.recipient_entity_id;
          const contributorRoute = getEntityRoute(contribution.contributor_entity_type);
          const recipientRoute = getEntityRoute(contribution.recipient_entity_type);

          return (
            <tr key={contribution.id}>
              <td>
                <DateDisplay date={contribution.contribution_date} />
              </td>
              {showContributor && (
                <td>
                  {contribution.contributor_entity_id && contributorSlug ? (
                    <Link
                      href={`${contributorRoute}/${contributorSlug}`}
                      className="text-wa-green hover:underline"
                    >
                      {contribution.contributor_name}
                    </Link>
                  ) : (
                    contribution.contributor_name
                  )}
                </td>
              )}
              {showRecipient && (
                <td>
                  {contribution.recipient_entity_id && recipientSlug ? (
                    <Link
                      href={`${recipientRoute}/${recipientSlug}`}
                      className="text-wa-green hover:underline"
                    >
                      {contribution.recipient_name}
                    </Link>
                  ) : (
                    contribution.recipient_name
                  )}
                </td>
              )}
              <td className="text-right">
                <MoneyAmount amount={contribution.amount} />
              </td>
              <td className="text-sm text-gray-500">
                {contribution.contribution_type || 'Monetary'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
