/**
 * Parse a money string into cents (integer)
 */
export function parseMoney(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }

  if (!value) return 0;

  // Remove currency symbols, commas, and spaces
  const cleaned = value.replace(/[$,\s]/g, '');

  // Handle negative values in parentheses
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  const numStr = cleaned.replace(/[()]/g, '');

  const amount = parseFloat(numStr);
  if (isNaN(amount)) return 0;

  return Math.round((isNegative ? -amount : amount) * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string
 */
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format dollars as currency string (for display)
 */
export function formatDollars(dollars: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

/**
 * Round to nearest cent
 */
export function roundToCents(dollars: number): number {
  return Math.round(dollars * 100) / 100;
}

/**
 * Parse a contribution amount that might be in various formats
 */
export function parseContributionAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return roundToCents(value);

  const cleaned = value.toString().trim();
  if (!cleaned) return 0;

  // Handle negative values
  const isNegative = cleaned.startsWith('-') || (cleaned.startsWith('(') && cleaned.endsWith(')'));

  // Remove all non-numeric except decimal point
  const numStr = cleaned.replace(/[^0-9.]/g, '');
  const amount = parseFloat(numStr);

  if (isNaN(amount)) return 0;

  return roundToCents(isNegative ? -amount : amount);
}
