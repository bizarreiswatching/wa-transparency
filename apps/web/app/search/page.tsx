import { Suspense } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { EntityLink } from '@/components/entities/entity-link';
import { searchEntities } from '@/lib/queries/search';

interface SearchPageProps {
  searchParams: { q?: string; type?: string; page?: string };
}

export const metadata = {
  title: 'Search',
  description: 'Search for organizations, people, bills, and more.',
};

async function SearchResults({ query, type }: { query: string; type?: string }) {
  if (!query) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Enter a search term to find results.</p>
      </Card>
    );
  }

  const results = await searchEntities(query, type);

  if (results.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((entity) => (
        <Card key={entity.id} className="p-4">
          <EntityLink entity={entity} showType />
        </Card>
      ))}
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const type = searchParams.type;

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Search</h1>

      <div className="mb-8">
        <SearchInput
          defaultValue={query}
          placeholder="Search organizations, people, bills..."
          className="max-w-xl"
        />
      </div>

      {/* Type filters */}
      <div className="mb-6 flex gap-2">
        <FilterButton href={`/search?q=${query}`} active={!type}>
          All
        </FilterButton>
        <FilterButton
          href={`/search?q=${query}&type=organization`}
          active={type === 'organization'}
        >
          Organizations
        </FilterButton>
        <FilterButton
          href={`/search?q=${query}&type=person`}
          active={type === 'person'}
        >
          People
        </FilterButton>
        <FilterButton
          href={`/search?q=${query}&type=committee`}
          active={type === 'committee'}
        >
          Committees
        </FilterButton>
      </div>

      <Suspense fallback={<Loading />}>
        <SearchResults query={query} type={type} />
      </Suspense>
    </div>
  );
}

function FilterButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-wa-green text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </a>
  );
}
