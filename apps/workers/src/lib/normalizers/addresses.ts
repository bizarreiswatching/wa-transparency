// Common street type abbreviations
const STREET_TYPES: Record<string, string> = {
  'street': 'St',
  'st': 'St',
  'st.': 'St',
  'avenue': 'Ave',
  'ave': 'Ave',
  'ave.': 'Ave',
  'boulevard': 'Blvd',
  'blvd': 'Blvd',
  'blvd.': 'Blvd',
  'drive': 'Dr',
  'dr': 'Dr',
  'dr.': 'Dr',
  'road': 'Rd',
  'rd': 'Rd',
  'rd.': 'Rd',
  'lane': 'Ln',
  'ln': 'Ln',
  'ln.': 'Ln',
  'court': 'Ct',
  'ct': 'Ct',
  'ct.': 'Ct',
  'place': 'Pl',
  'pl': 'Pl',
  'pl.': 'Pl',
  'circle': 'Cir',
  'cir': 'Cir',
  'highway': 'Hwy',
  'hwy': 'Hwy',
  'parkway': 'Pkwy',
  'pkwy': 'Pkwy',
  'way': 'Way',
};

// Direction abbreviations
const DIRECTIONS: Record<string, string> = {
  'north': 'N',
  'south': 'S',
  'east': 'E',
  'west': 'W',
  'northeast': 'NE',
  'northwest': 'NW',
  'southeast': 'SE',
  'southwest': 'SW',
  'n': 'N',
  's': 'S',
  'e': 'E',
  'w': 'W',
  'n.': 'N',
  's.': 'S',
  'e.': 'E',
  'w.': 'W',
  'ne': 'NE',
  'nw': 'NW',
  'se': 'SE',
  'sw': 'SW',
};

// Unit type abbreviations
const UNIT_TYPES: Record<string, string> = {
  'apartment': 'Apt',
  'apt': 'Apt',
  'apt.': 'Apt',
  'suite': 'Ste',
  'ste': 'Ste',
  'ste.': 'Ste',
  'unit': 'Unit',
  'floor': 'Fl',
  'fl': 'Fl',
  'room': 'Rm',
  'rm': 'Rm',
  'building': 'Bldg',
  'bldg': 'Bldg',
};

interface NormalizedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
}

export function normalizeAddress(
  address?: string,
  city?: string,
  state?: string,
  zip?: string
): NormalizedAddress {
  return {
    address: normalizeStreetAddress(address || ''),
    city: normalizeCity(city || ''),
    state: normalizeState(state || ''),
    zip: normalizeZip(zip || ''),
  };
}

export function normalizeStreetAddress(address: string): string {
  if (!address) return '';

  let normalized = address.trim();

  // Standardize street types
  for (const [pattern, replacement] of Object.entries(STREET_TYPES)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  // Standardize directions
  for (const [pattern, replacement] of Object.entries(DIRECTIONS)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  // Standardize unit types
  for (const [pattern, replacement] of Object.entries(UNIT_TYPES)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function normalizeCity(city: string): string {
  if (!city) return '';

  return city
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ');
}

export function normalizeState(state: string): string {
  if (!state) return '';

  const normalized = state.trim().toUpperCase();

  // Handle full state names
  const stateAbbreviations: Record<string, string> = {
    'WASHINGTON': 'WA',
    'OREGON': 'OR',
    'CALIFORNIA': 'CA',
    'IDAHO': 'ID',
    // Add more as needed
  };

  return stateAbbreviations[normalized] || normalized;
}

export function normalizeZip(zip: string): string {
  if (!zip) return '';

  // Extract just the 5-digit zip
  const match = zip.match(/(\d{5})/);
  return match ? match[1] : zip.trim();
}

export function addressToString(addr: NormalizedAddress): string {
  const parts = [addr.address];

  if (addr.city || addr.state || addr.zip) {
    parts.push([addr.city, addr.state, addr.zip].filter(Boolean).join(', '));
  }

  return parts.join(', ');
}
