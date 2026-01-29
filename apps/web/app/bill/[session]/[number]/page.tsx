import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateDisplay } from '@/components/data-display/date-display';
import { SourceLink } from '@/components/data-display/source-link';
import { getBill, getBillSponsors, getBillVotes, getAllBillSlugs } from '@/lib/queries/bills';

interface BillPageProps {
  params: { session: string; number: string };
}

export async function generateMetadata({ params }: BillPageProps): Promise<Metadata> {
  const bill = await getBill(params.session, params.number);
  if (!bill) return { title: 'Bill Not Found' };

  return {
    title: `${bill.bill_number} - ${bill.title}`,
    description: bill.short_description || bill.title,
    openGraph: {
      title: `${bill.bill_number} - ${bill.title} | WA Transparency`,
      description: bill.short_description || bill.title,
      type: 'article',
    },
  };
}

export async function generateStaticParams() {
  try {
    const bills = await getAllBillSlugs();
    return bills.map((bill) => ({
      session: bill.session,
      number: bill.number,
    }));
  } catch {
    // Return empty array if database is unavailable during build
    return [];
  }
}

export default async function BillPage({ params }: BillPageProps) {
  const bill = await getBill(params.session, params.number);

  if (!bill) {
    notFound();
  }

  const sponsors = await getBillSponsors(bill.id);
  const votes = await getBillVotes(bill.id);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">{bill.session}</Badge>
          <Badge variant="outline">{bill.status}</Badge>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {bill.bill_number}: {bill.title}
        </h1>
        {bill.short_description && (
          <p className="text-lg text-gray-600">{bill.short_description}</p>
        )}
        {bill.source_url && <SourceLink url={bill.source_url} />}
      </div>

      {/* Bill Details */}
      <div className="mb-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Description */}
          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">Description</h2>
            <p className="text-gray-700">
              {bill.long_description || bill.short_description || 'No description available.'}
            </p>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Timeline</h2>
            <div className="space-y-4">
              {bill.introduced_date && (
                <div className="flex items-start gap-4">
                  <div className="h-3 w-3 mt-1.5 rounded-full bg-wa-green" aria-hidden="true" />
                  <div>
                    <div className="font-medium">Introduced</div>
                    <DateDisplay date={bill.introduced_date} />
                  </div>
                </div>
              )}
              {bill.last_action && (
                <div className="flex items-start gap-4">
                  <div className="h-3 w-3 mt-1.5 rounded-full bg-wa-blue" aria-hidden="true" />
                  <div>
                    <div className="font-medium">{bill.last_action}</div>
                    {bill.last_action_date && <DateDisplay date={bill.last_action_date} />}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sponsors */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Sponsors</h2>
            {sponsors.length > 0 ? (
              <ul className="space-y-2">
                {sponsors.map((sponsor) => (
                  <li key={sponsor.id}>
                    <Link
                      href={`/person/${sponsor.sponsor_slug}`}
                      className="text-wa-green hover:underline"
                    >
                      {sponsor.sponsor_type === 'primary' && '★ '}
                      {sponsor.sponsor_name}
                    </Link>
                    <Badge variant="outline" className="ml-2">
                      {sponsor.sponsor_type}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No sponsors listed.</p>
            )}
          </Card>

          {/* Subjects */}
          {bill.subjects.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Subjects</h2>
              <div className="flex flex-wrap gap-2">
                {bill.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Lobbying */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Lobbying Activity</h2>
            <p className="text-gray-500">No lobbying activity recorded.</p>
          </Card>
        </div>
      </div>

      {/* Votes */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Roll Call Votes</h2>
        {votes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-sm font-semibold">Legislator</th>
                  <th scope="col" className="px-4 py-2 text-left text-sm font-semibold">Vote</th>
                  <th scope="col" className="px-4 py-2 text-left text-sm font-semibold">Chamber</th>
                  <th scope="col" className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {votes.map((vote) => (
                  <tr key={vote.id}>
                    <td className="px-4 py-2">
                      <Link href={`/person/${vote.voter_slug}`} className="text-wa-green hover:underline">
                        {vote.voter_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={vote.vote_type === 'yea' ? 'default' : 'secondary'}
                      >
                        {vote.vote_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{vote.chamber}</td>
                    <td className="px-4 py-2">
                      <DateDisplay date={vote.vote_date} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No votes recorded yet.</p>
        )}
      </Card>
    </div>
  );
}
