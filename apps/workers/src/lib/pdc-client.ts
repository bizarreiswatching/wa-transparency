import axios, { AxiosInstance } from 'axios';

interface PdcClient {
  getContributions(params: ContributionParams): Promise<PdcContribution[]>;
  getLobbyingRegistrations(params: LobbyingParams): Promise<PdcLobbyingRegistration[]>;
  getLobbyingActivities(): Promise<PdcLobbyingActivity[]>;
  getCandidates(params: CandidateParams): Promise<PdcCandidate[]>;
}

interface ContributionParams {
  startDate?: string;
  endDate?: string;
  cursor?: string | null;
  page?: number;
  limit?: number;
}

interface LobbyingParams {
  status?: string;
}

interface CandidateParams {
  electionYear?: number;
}

interface PdcContribution {
  id: string;
  contributor_name: string;
  contributor_address?: string;
  contributor_city?: string;
  contributor_state?: string;
  contributor_zip?: string;
  employer?: string;
  occupation?: string;
  recipient_name: string;
  recipient_type: string;
  amount: number;
  date: string;
  election_year: number;
  type: string;
  description?: string;
  source_url: string;
}

interface PdcLobbyingRegistration {
  id: string;
  lobbyist_name: string;
  employer_name: string;
  registration_date: string;
  termination_date?: string;
  status: string;
  subjects: string[];
  source_url: string;
}

interface PdcLobbyingActivity {
  registration_id: string;
  lobbyist_name: string;
  employer_name: string;
  date: string;
  description?: string;
  compensation?: number;
  expenses?: number;
}

interface PdcCandidate {
  id: string;
  name: string;
  office: string;
  party: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// PDC Open Data API endpoints (Socrata-based)
// See: https://www.pdc.wa.gov/political-disclosure-reporting-data/open-data
const PDC_DATASETS = {
  contributions: 'kv7h-kjye', // Campaign contributions
  expenditures: 'tijg-9ber', // Campaign expenditures
  lobbyist_registrations: 'xhn7-64im', // Lobbyist Employment Registrations
  lobbyist_compensation: '9nnw-c693', // Lobbyist Compensation and Expenses by Source
  candidates: 'w97b-9m5a', // Registered candidates
};

let pdcClient: PdcClient | null = null;

export function getPdcClient(): PdcClient {
  if (!pdcClient) {
    const baseUrl = 'https://data.wa.gov/resource';
    const apiKey = process.env.PDC_API_KEY;

    const http = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-App-Token': apiKey } : {}),
      },
      timeout: 30000,
    });

    pdcClient = {
      async getContributions(params: ContributionParams): Promise<PdcContribution[]> {
        const limit = params.limit || 1000;
        const offset = (params.page || 0) * limit;

        // Build SoQL query
        const queryParams: Record<string, string> = {
          $limit: String(limit),
          $offset: String(offset),
          $order: 'receipt_date DESC',
        };

        // Add date filters if provided
        const whereConditions: string[] = [];
        if (params.startDate) {
          whereConditions.push(`receipt_date >= '${params.startDate}'`);
        }
        if (params.endDate) {
          whereConditions.push(`receipt_date <= '${params.endDate}'`);
        }
        if (whereConditions.length > 0) {
          queryParams.$where = whereConditions.join(' AND ');
        }

        const response = await http.get(`/${PDC_DATASETS.contributions}.json`, {
          params: queryParams,
        });

        return response.data.map((row: Record<string, unknown>) => ({
          id: String(row.id || row.contribution_id || `${row.filer_id}-${row.receipt_date}-${row.amount}`),
          contributor_name: String(row.contributor_name || row.contributor || ''),
          contributor_address: row.contributor_address ? String(row.contributor_address) : undefined,
          contributor_city: row.contributor_city ? String(row.contributor_city) : undefined,
          contributor_state: row.contributor_state ? String(row.contributor_state) : undefined,
          contributor_zip: row.contributor_zip ? String(row.contributor_zip) : undefined,
          employer: row.contributor_employer ? String(row.contributor_employer) : undefined,
          occupation: row.contributor_occupation ? String(row.contributor_occupation) : undefined,
          recipient_name: String(row.filer_name || row.recipient || ''),
          recipient_type: mapRecipientType(row.filer_type),
          amount: parseFloat(String(row.amount || 0)),
          date: String(row.receipt_date || row.contribution_date || ''),
          election_year: parseInt(String(row.election_year || new Date().getFullYear()), 10),
          type: String(row.cash_or_in_kind || row.contribution_type || 'monetary'),
          description: row.description ? String(row.description) : undefined,
          source_url: `https://www.pdc.wa.gov/browse/campaign-explorer/contribution/${row.id || ''}`,
        }));
      },

      async getLobbyingRegistrations(params: LobbyingParams): Promise<PdcLobbyingRegistration[]> {
        const queryParams: Record<string, string> = {
          $limit: '1000',
          $order: 'employment_year DESC',
        };

        // Filter by current year for active registrations
        if (params.status === 'active') {
          const currentYear = new Date().getFullYear();
          queryParams.$where = `employment_year >= '${currentYear - 1}'`;
        }

        const response = await http.get(`/${PDC_DATASETS.lobbyist_registrations}.json`, {
          params: queryParams,
        });

        return response.data.map((row: Record<string, unknown>) => ({
          id: String(row.id || `${row.lobbyist_id}-${row.employer_id}-${row.employment_year}`),
          lobbyist_name: String(row.lobbyist_name || ''),
          employer_name: String(row.employer_name || ''),
          registration_date: `${row.employment_year}-01-01`, // Year-based registration
          termination_date: undefined, // Not available in this dataset
          status: 'active',
          subjects: [], // Not available in this dataset
          source_url: row.employment_url
            ? String((row.employment_url as { url?: string }).url || '')
            : `https://www.pdc.wa.gov/browse/lobby-explorer`,
        }));
      },

      async getLobbyingActivities(): Promise<PdcLobbyingActivity[]> {
        const allActivities: PdcLobbyingActivity[] = [];
        const limit = 1000;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const queryParams: Record<string, string> = {
            $limit: String(limit),
            $offset: String(offset),
            $order: 'filing_period DESC',
          };

          const response = await http.get(`/${PDC_DATASETS.lobbyist_compensation}.json`, {
            params: queryParams,
          });

          const activities = response.data.map((row: Record<string, unknown>) => ({
            registration_id: String(row.employment_registration_id || row.filer_id || row.id || ''),
            // NOTE: Compensation dataset uses 'filer_name' for lobbyist, not 'lobbyist_name'
            lobbyist_name: String(row.filer_name || row.lobbyist_name || ''),
            employer_name: String(row.employer_name || ''),
            date: String(row.filing_period || row.receipt_date || ''),
            description: row.funding_source ? String(row.funding_source) : undefined,
            compensation: row.compensation ? parseFloat(String(row.compensation)) : undefined,
            expenses: row.total_expenses ? parseFloat(String(row.total_expenses)) : undefined,
          }));

          allActivities.push(...activities);

          if (response.data.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        }

        return allActivities;
      },

      async getCandidates(params: CandidateParams): Promise<PdcCandidate[]> {
        const queryParams: Record<string, string> = {
          $limit: '1000',
          $order: 'candidate_name ASC',
        };

        if (params.electionYear) {
          queryParams.$where = `election_year = '${params.electionYear}'`;
        }

        const response = await http.get(`/${PDC_DATASETS.candidates}.json`, {
          params: queryParams,
        });

        return response.data.map((row: Record<string, unknown>) => ({
          id: String(row.filer_id || row.id || ''),
          name: String(row.candidate_name || row.filer_name || ''),
          office: String(row.office || row.position || ''),
          party: String(row.party || row.political_party || ''),
          address: row.address ? String(row.address) : undefined,
          city: row.city ? String(row.city) : undefined,
          state: row.state ? String(row.state) : 'WA',
          zip: row.zip ? String(row.zip) : undefined,
        }));
      },
    };
  }

  return pdcClient;
}

function mapRecipientType(filerType: unknown): string {
  const type = String(filerType || '').toLowerCase();
  if (type.includes('candidate')) return 'candidate';
  if (type.includes('committee') || type.includes('pac')) return 'committee';
  if (type.includes('party')) return 'party';
  return 'committee';
}

function parseSubjects(subjects: unknown): string[] {
  if (!subjects) return [];
  if (Array.isArray(subjects)) return subjects.map(String);
  if (typeof subjects === 'string') {
    return subjects.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
