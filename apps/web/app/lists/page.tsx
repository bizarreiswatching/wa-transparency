import Link from 'next/link';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Lists',
  description: 'Browse curated lists of top donors, recipients, contractors, and lobbyists.',
};

const lists = [
  {
    title: 'Top Donors',
    description: 'Organizations and individuals who have given the most to political campaigns.',
    href: '/lists/top-donors',
  },
  {
    title: 'Top Recipients',
    description: 'Candidates and committees who have received the most contributions.',
    href: '/lists/top-recipients',
  },
  {
    title: 'Top Contractors',
    description: 'Washington businesses receiving the largest federal contracts.',
    href: '/lists/top-contractors',
  },
  {
    title: 'Top Lobbyists',
    description: 'Most active lobbyists in Olympia and their clients.',
    href: '/lists/top-lobbyists',
  },
];

export default function ListsPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">Lists</h1>
      <p className="mb-8 text-gray-600">
        Browse curated rankings and discover who has the most influence in Washington State politics.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {lists.map((list) => (
          <Link key={list.href} href={list.href}>
            <Card className="h-full p-6 transition-shadow hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {list.title}
              </h2>
              <p className="text-gray-600">{list.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
