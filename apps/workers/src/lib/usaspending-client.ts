import axios from 'axios';

interface UsaspendingClient {
  getWashingtonContracts(params: ContractParams): Promise<UsaspendingContract[]>;
}

interface ContractParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface UsaspendingContract {
  id: string;
  recipient_name: string;
  recipient_address?: string;
  recipient_city?: string;
  recipient_state?: string;
  recipient_zip?: string;
  awarding_agency: string;
  awarding_sub_agency?: string;
  award_type: string;
  amount: number;
  start_date: string;
  end_date?: string;
  description?: string;
  naics_code?: string;
  naics_description?: string;
  place_of_performance_state?: string;
  place_of_performance_city?: string;
  source_url: string;
}

interface UsaSpendingApiResponse {
  results: UsaSpendingAward[];
  page_metadata: {
    page: number;
    hasNext: boolean;
    total: number;
  };
}

interface UsaSpendingAward {
  'Award ID': string;
  'Recipient Name': string;
  'Recipient Address Line 1'?: string;
  'Recipient City Name'?: string;
  'Recipient State Code'?: string;
  'Recipient Zip Code'?: string;
  'Awarding Agency': string;
  'Awarding Sub Agency'?: string;
  'Award Type': string;
  'Award Amount': number;
  'Start Date': string;
  'End Date'?: string;
  Description?: string;
  'NAICS Code'?: string;
  'NAICS Description'?: string;
  'Place of Performance State Code'?: string;
  'Place of Performance City Name'?: string;
  generated_internal_id?: string;
}

let usaspendingClient: UsaspendingClient | null = null;

export function getUsaspendingClient(): UsaspendingClient {
  if (!usaspendingClient) {
    const baseUrl = 'https://api.usaspending.gov/api/v2';

    const http = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    usaspendingClient = {
      async getWashingtonContracts(params: ContractParams): Promise<UsaspendingContract[]> {
        const page = params.page || 1;
        const limit = params.limit || 100;

        // Build the time period filter
        const timePeriod: Array<{ start_date: string; end_date: string }> = [];
        if (params.startDate || params.endDate) {
          timePeriod.push({
            start_date: params.startDate || '2020-01-01',
            end_date: params.endDate || new Date().toISOString().split('T')[0],
          });
        } else {
          // Default to last 2 years
          const today = new Date();
          const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
          timePeriod.push({
            start_date: twoYearsAgo.toISOString().split('T')[0],
            end_date: today.toISOString().split('T')[0],
          });
        }

        // Use the spending_by_award endpoint for contract data
        const requestBody = {
          filters: {
            place_of_performance_locations: [
              { country: 'USA', state: 'WA' }
            ],
            award_type_codes: ['A', 'B', 'C', 'D'], // Contract types
            time_period: timePeriod,
          },
          fields: [
            'Award ID',
            'Recipient Name',
            'Recipient Address Line 1',
            'Recipient City Name',
            'Recipient State Code',
            'Recipient Zip Code',
            'Awarding Agency',
            'Awarding Sub Agency',
            'Award Type',
            'Award Amount',
            'Start Date',
            'End Date',
            'Description',
            'NAICS Code',
            'NAICS Description',
            'Place of Performance State Code',
            'Place of Performance City Name',
            'generated_internal_id',
          ],
          page,
          limit,
          sort: 'Award Amount',
          order: 'desc',
        };

        const response = await http.post<UsaSpendingApiResponse>(
          '/search/spending_by_award/',
          requestBody
        );

        return response.data.results.map((award) => ({
          id: award['Award ID'] || award.generated_internal_id || '',
          recipient_name: award['Recipient Name'] || '',
          recipient_address: award['Recipient Address Line 1'] || undefined,
          recipient_city: award['Recipient City Name'] || undefined,
          recipient_state: award['Recipient State Code'] || undefined,
          recipient_zip: award['Recipient Zip Code'] || undefined,
          awarding_agency: award['Awarding Agency'] || '',
          awarding_sub_agency: award['Awarding Sub Agency'] || undefined,
          award_type: mapAwardType(award['Award Type']),
          amount: award['Award Amount'] || 0,
          start_date: award['Start Date'] || '',
          end_date: award['End Date'] || undefined,
          description: award.Description || undefined,
          naics_code: award['NAICS Code'] || undefined,
          naics_description: award['NAICS Description'] || undefined,
          place_of_performance_state: award['Place of Performance State Code'] || undefined,
          place_of_performance_city: award['Place of Performance City Name'] || undefined,
          source_url: `https://www.usaspending.gov/award/${award.generated_internal_id || award['Award ID'] || ''}`,
        }));
      },
    };
  }

  return usaspendingClient;
}

function mapAwardType(type: string | undefined): string {
  if (!type) return 'contract';

  const typeMap: Record<string, string> = {
    'A': 'BPA Call',
    'B': 'Purchase Order',
    'C': 'Delivery Order',
    'D': 'Definitive Contract',
    'E': 'Unknown Type',
  };

  return typeMap[type] || type;
}
