import axios, { AxiosInstance } from 'axios';

// Socrata API hosts
export const SOCRATA_HOSTS = {
  waData: 'https://data.wa.gov/resource',
  kingCounty: 'https://data.kingcounty.gov/resource',
} as const;

// Known dataset IDs
export const SOCRATA_DATASETS = {
  // data.wa.gov datasets
  waAgencyContracts: 'cy5i-fz5c', // Agency Contracts by Fiscal Year
  waStatewideSales: 'eudq-e5ku', // Statewide Contract Sales Data
  // data.kingcounty.gov datasets
  kingCountyProcurement: 'dqit-zt74', // King County Procurement Data
} as const;

export interface SocrataQueryParams {
  $limit?: number;
  $offset?: number;
  $where?: string;
  $order?: string;
  $select?: string;
  $group?: string;
}

export interface SocrataClient {
  /**
   * Fetch records from a Socrata dataset
   */
  fetch<T = Record<string, unknown>>(
    host: string,
    datasetId: string,
    params?: SocrataQueryParams
  ): Promise<T[]>;

  /**
   * Generator for paginated fetches - yields batches of records
   */
  fetchAll<T = Record<string, unknown>>(
    host: string,
    datasetId: string,
    params?: Omit<SocrataQueryParams, '$limit' | '$offset'>,
    options?: { batchSize?: number }
  ): AsyncGenerator<T[], void, unknown>;

  /**
   * Get record count for a dataset with optional filter
   */
  count(host: string, datasetId: string, where?: string): Promise<number>;
}

// WA Agency Contract record from data.wa.gov
export interface WaAgencyContract {
  agency_name?: string;
  contract_number?: string;
  contractor_name?: string;
  contractor_address?: string;
  contractor_city?: string;
  contractor_state?: string;
  contractor_zip?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  original_contract_value?: string;
  total_contract_value?: string;
  fiscal_year?: string;
  procurement_method?: string;
  contract_description?: string;
  omwbe_certified?: string; // OMWBE = Office of Minority and Women's Business Enterprises
  veteran_owned?: string;
  small_business?: string;
  // Some datasets have different field names
  vendor_name?: string;
  award_amount?: string;
}

// WA Statewide Contract Sales record
export interface WaStatewideSale {
  contract_number?: string;
  contract_title?: string;
  vendor_name?: string;
  vendor_city?: string;
  vendor_state?: string;
  sales_amount?: string;
  fiscal_year?: string;
  fiscal_month?: string;
  purchasing_agency?: string;
}

// King County Procurement record
export interface KingCountyContract {
  supplier_name?: string;
  supplier_address?: string;
  supplier_city?: string;
  supplier_state?: string;
  supplier_zip?: string;
  contract_id?: string;
  contract_title?: string;
  contract_amount?: string;
  execution_date?: string;
  expiration_date?: string;
  department?: string;
  contract_type?: string;
  // Alternative field names
  vendor_name?: string;
  vendor?: string;
  award_amount?: string;
  amount?: string;
}

let socrataClient: SocrataClient | null = null;

export function getSocrataClient(): SocrataClient {
  if (!socrataClient) {
    const appToken = process.env.SOCRATA_APP_TOKEN;

    const createAxiosInstance = (baseUrl: string): AxiosInstance =>
      axios.create({
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(appToken ? { 'X-App-Token': appToken } : {}),
        },
        timeout: 60000, // Longer timeout for large datasets
      });

    // Cache axios instances per host
    const axiosInstances: Map<string, AxiosInstance> = new Map();

    const getAxios = (host: string): AxiosInstance => {
      if (!axiosInstances.has(host)) {
        axiosInstances.set(host, createAxiosInstance(host));
      }
      return axiosInstances.get(host)!;
    };

    // Define fetch as arrow function to avoid strict mode issues
    const fetchData = async <T = Record<string, unknown>>(
      host: string,
      datasetId: string,
      params?: SocrataQueryParams
    ): Promise<T[]> => {
      const http = getAxios(host);
      const queryParams: Record<string, string> = {};

      if (params?.$limit !== undefined) queryParams.$limit = String(params.$limit);
      if (params?.$offset !== undefined) queryParams.$offset = String(params.$offset);
      if (params?.$where) queryParams.$where = params.$where;
      if (params?.$order) queryParams.$order = params.$order;
      if (params?.$select) queryParams.$select = params.$select;
      if (params?.$group) queryParams.$group = params.$group;

      try {
        const response = await http.get(`/${datasetId}.json`, { params: queryParams });
        return response.data as T[];
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          // Rate limited - wait and retry
          console.log('Rate limited by Socrata API, waiting 60 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 60000));
          const response = await http.get(`/${datasetId}.json`, { params: queryParams });
          return response.data as T[];
        }
        throw error;
      }
    };

    // Create fetchAll generator factory (to avoid async generator issues)
    const createFetchAll = <T = Record<string, unknown>>(
      host: string,
      datasetId: string,
      params?: Omit<SocrataQueryParams, '$limit' | '$offset'>,
      options?: { batchSize?: number }
    ): AsyncGenerator<T[], void, unknown> => {
      const batchSize = options?.batchSize || 1000;
      let offset = 0;
      let done = false;

      return {
        async next(): Promise<IteratorResult<T[], void>> {
          if (done) {
            return { done: true, value: undefined };
          }

          const batch = await fetchData<T>(host, datasetId, {
            ...params,
            $limit: batchSize,
            $offset: offset,
          });

          if (batch.length === 0) {
            done = true;
            return { done: true, value: undefined };
          }

          offset += batch.length;
          if (batch.length < batchSize) {
            done = true;
          }

          return { done: false, value: batch };
        },
        [Symbol.asyncIterator]() {
          return this;
        },
        async return(): Promise<IteratorResult<T[], void>> {
          done = true;
          return { done: true, value: undefined };
        },
        async throw(e: unknown): Promise<IteratorResult<T[], void>> {
          done = true;
          throw e;
        },
      };
    };

    socrataClient = {
      fetch: fetchData,

      fetchAll<T = Record<string, unknown>>(
        host: string,
        datasetId: string,
        params?: Omit<SocrataQueryParams, '$limit' | '$offset'>,
        options?: { batchSize?: number }
      ): AsyncGenerator<T[], void, unknown> {
        return createFetchAll<T>(host, datasetId, params, options);
      },

      async count(host: string, datasetId: string, where?: string): Promise<number> {
        const http = getAxios(host);
        const queryParams: Record<string, string> = {
          $select: 'count(*)',
        };
        if (where) {
          queryParams.$where = where;
        }

        const response = await http.get(`/${datasetId}.json`, { params: queryParams });
        const data = response.data as Array<{ count: string }>;
        return parseInt(data[0]?.count || '0', 10);
      },
    };
  }

  return socrataClient;
}

// Helper function to parse Socrata date formats
export function parseSocrataDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;

  // Socrata returns dates in various formats:
  // - ISO 8601: "2024-01-15T00:00:00.000"
  // - Date only: "2024-01-15"
  // - Floating timestamp: "2024-01-15T00:00:00"

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

// Helper function to parse money amounts from Socrata
export function parseSocrataMoney(value: string | undefined): number {
  if (!value) return 0;
  // Remove currency symbols, commas, and parse
  const cleaned = String(value).replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to extract certifications from Socrata fields
export function extractCertifications(record: WaAgencyContract): string[] {
  const certs: string[] = [];

  if (record.omwbe_certified?.toLowerCase() === 'yes' || record.omwbe_certified === 'Y') {
    certs.push('OMWBE');
  }
  if (record.veteran_owned?.toLowerCase() === 'yes' || record.veteran_owned === 'Y') {
    certs.push('VETERAN');
  }
  if (record.small_business?.toLowerCase() === 'yes' || record.small_business === 'Y') {
    certs.push('SMALL_BUSINESS');
  }

  return certs;
}
