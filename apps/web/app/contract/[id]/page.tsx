import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoneyAmount } from '@/components/data-display/money-amount';
import { DateDisplay } from '@/components/data-display/date-display';
import { SourceLink } from '@/components/data-display/source-link';
import { getContract, getAllContractIds } from '@/lib/queries/contracts';

interface ContractPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ContractPageProps): Promise<Metadata> {
  const contract = await getContract(params.id);
  if (!contract) return { title: 'Contract Not Found' };

  return {
    title: `Contract: ${contract.recipient_name}`,
    description: contract.description || `Federal contract awarded to ${contract.recipient_name}`,
    openGraph: {
      title: `Contract: ${contract.recipient_name} | WA Transparency`,
      description: contract.description || `Federal contract awarded to ${contract.recipient_name}`,
      type: 'article',
    },
  };
}

export async function generateStaticParams() {
  try {
    const ids = await getAllContractIds();
    return ids.map((id) => ({ id }));
  } catch {
    // Return empty array if database is unavailable during build
    return [];
  }
}

export default async function ContractPage({ params }: ContractPageProps) {
  const contract = await getContract(params.id);

  if (!contract) {
    notFound();
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">Federal Contract</Badge>
          <Badge variant="outline">{contract.award_type}</Badge>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          <MoneyAmount amount={contract.amount} /> Contract
        </h1>
        <p className="text-lg text-gray-600">
          Awarded to{' '}
          {contract.recipient_entity_id ? (
            <Link
              href={`/org/${contract.recipient_entity_id}`}
              className="text-wa-green hover:underline"
            >
              {contract.recipient_name}
            </Link>
          ) : (
            contract.recipient_name
          )}
        </p>
        {contract.source_url && <SourceLink url={contract.source_url} />}
      </div>

      {/* Contract Details */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Description */}
          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">Description</h2>
            <p className="text-gray-700">
              {contract.description || 'No description available.'}
            </p>
          </Card>

          {/* Awarding Agency */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Awarding Agency</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Agency:</span>
                <span className="ml-2 font-medium">{contract.awarding_agency}</span>
              </div>
              {contract.awarding_sub_agency && (
                <div>
                  <span className="text-sm text-gray-500">Sub-Agency:</span>
                  <span className="ml-2">{contract.awarding_sub_agency}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Details */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Award Amount</dt>
                <dd className="text-lg font-semibold">
                  <MoneyAmount amount={contract.amount} />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Start Date</dt>
                <dd>
                  <DateDisplay date={contract.start_date} />
                </dd>
              </div>
              {contract.end_date && (
                <div>
                  <dt className="text-sm text-gray-500">End Date</dt>
                  <dd>
                    <DateDisplay date={contract.end_date} />
                  </dd>
                </div>
              )}
              {contract.naics_code && (
                <div>
                  <dt className="text-sm text-gray-500">NAICS Code</dt>
                  <dd>
                    {contract.naics_code}
                    {contract.naics_description && (
                      <span className="block text-sm text-gray-600">
                        {contract.naics_description}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Recipient Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Recipient</h2>
            <div className="space-y-2">
              <div className="font-medium">{contract.recipient_name}</div>
              {contract.recipient_address && (
                <div className="text-sm text-gray-600">
                  {contract.recipient_address}
                  <br />
                  {contract.recipient_city}, {contract.recipient_state}{' '}
                  {contract.recipient_zip}
                </div>
              )}
              {contract.recipient_entity_id && (
                <Link
                  href={`/org/${contract.recipient_entity_id}`}
                  className="inline-block mt-2 text-sm text-wa-green hover:underline"
                >
                  View organization profile →
                </Link>
              )}
            </div>
          </Card>

          {/* Place of Performance */}
          {contract.place_of_performance_state && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Place of Performance</h2>
              <div>
                {contract.place_of_performance_city && (
                  <span>{contract.place_of_performance_city}, </span>
                )}
                {contract.place_of_performance_state}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
