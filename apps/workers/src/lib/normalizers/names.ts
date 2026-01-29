// Common business suffixes to standardize
const BUSINESS_SUFFIXES: Record<string, string> = {
  'incorporated': 'Inc',
  'inc.': 'Inc',
  'inc': 'Inc',
  'corporation': 'Corp',
  'corp.': 'Corp',
  'corp': 'Corp',
  'limited liability company': 'LLC',
  'limited liability co': 'LLC',
  'l.l.c.': 'LLC',
  'llc': 'LLC',
  'limited partnership': 'LP',
  'l.p.': 'LP',
  'lp': 'LP',
  'limited': 'Ltd',
  'ltd.': 'Ltd',
  'ltd': 'Ltd',
  'company': 'Co',
  'co.': 'Co',
  'association': 'Assn',
  'assn.': 'Assn',
  'foundation': 'Foundation',
  'fdn': 'Foundation',
};

// Common name prefixes
const NAME_PREFIXES = ['mr', 'mrs', 'ms', 'dr', 'hon', 'rev'];

// Common name suffixes
const NAME_SUFFIXES = ['jr', 'sr', 'ii', 'iii', 'iv', 'md', 'phd', 'esq'];

export function normalizeContributorName(name: string): string {
  if (!name) return '';

  let normalized = name.trim();

  // Convert to title case
  normalized = normalized
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Standardize business suffixes
  for (const [pattern, replacement] of Object.entries(BUSINESS_SUFFIXES)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function normalizePersonName(name: string): string {
  if (!name) return '';

  let normalized = name.trim().toLowerCase();

  // Remove common prefixes
  for (const prefix of NAME_PREFIXES) {
    const regex = new RegExp(`^${prefix}\\.?\\s+`, 'i');
    normalized = normalized.replace(regex, '');
  }

  // Convert to title case
  normalized = normalized.replace(/\b\w/g, (c) => c.toUpperCase());

  // Handle suffixes (keep but standardize)
  for (const suffix of NAME_SUFFIXES) {
    const regex = new RegExp(`\\b${suffix}\\.?$`, 'i');
    if (regex.test(normalized)) {
      normalized = normalized.replace(regex, suffix.toUpperCase());
    }
  }

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function extractLastName(name: string): string {
  const parts = name.trim().split(/\s+/);

  // Remove suffix if present
  let lastPart = parts[parts.length - 1];
  if (NAME_SUFFIXES.includes(lastPart.toLowerCase().replace('.', ''))) {
    lastPart = parts[parts.length - 2] || lastPart;
  }

  return lastPart;
}

export function extractFirstName(name: string): string {
  const parts = name.trim().split(/\s+/);

  // Skip prefix if present
  let firstPart = parts[0];
  if (NAME_PREFIXES.includes(firstPart.toLowerCase().replace('.', ''))) {
    firstPart = parts[1] || firstPart;
  }

  return firstPart;
}
