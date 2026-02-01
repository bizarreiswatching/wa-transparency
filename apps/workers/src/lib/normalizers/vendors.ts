// Vendor name normalization for contract data
// Handles DBA variations, government agency patterns, and business suffixes

import { normalizeContributorName } from './names';

// Common DBA (Doing Business As) indicators
const DBA_PATTERNS = [
  /\s+d\.?b\.?a\.?\s+/i, // "DBA", "D.B.A.", "d/b/a"
  /\s+dba:\s*/i,
  /\s+trading\s+as\s+/i,
  /\s+t\/a\s+/i,
  /\s+a\.?k\.?a\.?\s+/i, // "AKA", "A.K.A."
];

// Washington state agency name standardization
const WA_AGENCY_MAPPINGS: Record<string, string> = {
  'wa state': 'State of Washington',
  'washington state': 'State of Washington',
  'state of wa': 'State of Washington',
  'wa dept': 'Washington Department',
  'wa department': 'Washington Department',
  'dept of': 'Department of',
  'wsdot': 'Washington State Department of Transportation',
  'dshs': 'Department of Social and Health Services',
  'doh': 'Department of Health',
  'dnr': 'Department of Natural Resources',
  'dol': 'Department of Licensing',
  'des': 'Department of Enterprise Services',
  'ofm': 'Office of Financial Management',
  'uw': 'University of Washington',
  'wsu': 'Washington State University',
  'ewu': 'Eastern Washington University',
  'cwu': 'Central Washington University',
  'wwu': 'Western Washington University',
};

// Common abbreviations in vendor names
const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  'intl': 'International',
  "int'l": 'International',
  'natl': 'National',
  "nat'l": 'National',
  'svcs': 'Services',
  'svc': 'Service',
  'mgmt': 'Management',
  'mgt': 'Management',
  'grp': 'Group',
  'assoc': 'Associates',
  'assocs': 'Associates',
  'engr': 'Engineering',
  'engrg': 'Engineering',
  'tech': 'Technology',
  'sys': 'Systems',
  'govt': 'Government',
  "gov't": 'Government',
  'ctr': 'Center',
  'cntr': 'Center',
  'univ': 'University',
  'hosp': 'Hospital',
  'med': 'Medical',
  'hlth': 'Health',
  'cons': 'Consulting',
  'consult': 'Consulting',
};

// Business suffix standardization (extends names.ts suffixes)
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
  'pllc': 'PLLC', // Professional Limited Liability Company
  'p.l.l.c.': 'PLLC',
  'pc': 'PC', // Professional Corporation
  'p.c.': 'PC',
  'ps': 'PS', // Professional Service
  'p.s.': 'PS',
  'llp': 'LLP', // Limited Liability Partnership
  'l.l.p.': 'LLP',
};

/**
 * Normalize a vendor/contractor name for consistent matching
 * Handles DBA variations, agency names, and business suffixes
 */
export function normalizeVendorName(name: string): string {
  if (!name) return '';

  let normalized = name.trim();

  // Extract primary name if DBA pattern exists (use the name BEFORE dba)
  for (const pattern of DBA_PATTERNS) {
    if (pattern.test(normalized)) {
      const parts = normalized.split(pattern);
      normalized = parts[0].trim();
      break;
    }
  }

  // Standardize WA agency names
  const lowerName = normalized.toLowerCase();
  for (const [pattern, replacement] of Object.entries(WA_AGENCY_MAPPINGS)) {
    if (lowerName.includes(pattern)) {
      // Replace the pattern with standardized name (case-insensitive)
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      normalized = normalized.replace(regex, replacement);
    }
  }

  // Expand common abbreviations
  for (const [abbrev, expansion] of Object.entries(ABBREVIATION_EXPANSIONS)) {
    const regex = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    normalized = normalized.replace(regex, expansion);
  }

  // Standardize business suffixes
  for (const [pattern, replacement] of Object.entries(BUSINESS_SUFFIXES)) {
    const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  // Use the standard contributor name normalization for final cleanup
  normalized = normalizeContributorName(normalized);

  return normalized;
}

/**
 * Extract the DBA (trading) name from a vendor name
 * Returns undefined if no DBA pattern found
 */
export function extractDbaName(name: string): string | undefined {
  if (!name) return undefined;

  for (const pattern of DBA_PATTERNS) {
    if (pattern.test(name)) {
      const parts = name.split(pattern);
      if (parts.length > 1 && parts[1].trim()) {
        return normalizeVendorName(parts[1].trim());
      }
    }
  }

  return undefined;
}

/**
 * Get all name variations for a vendor (legal name + DBA names)
 * Useful for entity matching
 */
export function getVendorNameVariations(name: string): string[] {
  if (!name) return [];

  const variations: Set<string> = new Set();

  // Add normalized full name
  variations.add(normalizeVendorName(name));

  // Add DBA name if present
  const dbaName = extractDbaName(name);
  if (dbaName) {
    variations.add(dbaName);
  }

  // Also check for the name after DBA to get legal name
  for (const pattern of DBA_PATTERNS) {
    if (pattern.test(name)) {
      const parts = name.split(pattern);
      if (parts[0].trim()) {
        variations.add(normalizeVendorName(parts[0].trim()));
      }
    }
  }

  return Array.from(variations);
}

/**
 * Check if a name appears to be a government agency
 */
export function isGovernmentAgency(name: string): boolean {
  if (!name) return false;

  const lowerName = name.toLowerCase();

  const govPatterns = [
    /\bstate of\b/i,
    /\bcity of\b/i,
    /\bcounty of\b/i,
    /\bport of\b/i,
    /\btown of\b/i,
    /\bdistrict\b/i,
    /\bdepartment of\b/i,
    /\boffice of\b/i,
    /\buniversity\b/i,
    /\bcollege\b/i,
    /\bschool district\b/i,
    /\bpublic utility\b/i,
    /\btribal\b/i,
    /\btribe\b/i,
    /\bfederal\b/i,
  ];

  return govPatterns.some((pattern) => pattern.test(lowerName));
}

/**
 * Determine entity type from vendor name
 */
export function inferEntityType(
  name: string
): 'organization' | 'person' | 'government' {
  if (isGovernmentAgency(name)) {
    return 'government';
  }

  // Check for business indicators
  const businessPatterns = [
    /\b(inc|corp|llc|ltd|llp|pllc|co|company|corporation|partnership)\b/i,
    /\b(associates|consulting|solutions|services|group|enterprises)\b/i,
    /\b(technologies|systems|industries|international|holdings)\b/i,
  ];

  for (const pattern of businessPatterns) {
    if (pattern.test(name)) {
      return 'organization';
    }
  }

  // Default to organization for vendor/contractor context
  // (most government contractors are organizations)
  return 'organization';
}
