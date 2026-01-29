import { Badge } from '@/components/ui/badge';

interface EntityBadgeProps {
  type: string;
}

const typeLabels: Record<string, string> = {
  organization: 'Organization',
  person: 'Person',
  committee: 'Committee',
  government: 'Government',
};

const typeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  organization: 'secondary',
  person: 'default',
  committee: 'outline',
  government: 'secondary',
};

export function EntityBadge({ type }: EntityBadgeProps) {
  return (
    <Badge variant={typeVariants[type] || 'secondary'}>
      {typeLabels[type] || type}
    </Badge>
  );
}
