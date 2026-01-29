export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function generateEntitySlug(name: string, type: string): string {
  const base = slugify(name);
  const prefix = type === 'person' ? 'p' : 'o';
  return `${prefix}-${base}`;
}

export function generateBillSlug(session: string, billNumber: string): string {
  return `${session.toLowerCase()}-${slugify(billNumber)}`;
}

export function parseEntitySlug(slug: string): { type: 'person' | 'organization'; name: string } {
  const prefix = slug.charAt(0);
  const name = slug.slice(2);
  return {
    type: prefix === 'p' ? 'person' : 'organization',
    name: name.replace(/-/g, ' '),
  };
}

export function parseBillSlug(slug: string): { session: string; number: string } {
  const parts = slug.split('-');
  const session = parts[0].toUpperCase();
  const number = parts.slice(1).join('-').toUpperCase();
  return { session, number };
}
