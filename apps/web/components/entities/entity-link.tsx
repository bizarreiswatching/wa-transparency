import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface EntityLinkEntity {
  id: string;
  name: string;
  type: string;
  slug: string;
}

interface EntityLinkProps {
  entity: EntityLinkEntity;
  showType?: boolean;
}

export function EntityLink({ entity, showType = false }: EntityLinkProps) {
  const href = entity.type === 'person' ? `/person/${entity.slug}` : `/org/${entity.slug}`;

  return (
    <span className="inline-flex items-center gap-2">
      <Link href={href} className="text-wa-green hover:underline">
        {entity.name}
      </Link>
      {showType && (
        <Badge variant="outline" className="text-xs">
          {entity.type}
        </Badge>
      )}
    </span>
  );
}
