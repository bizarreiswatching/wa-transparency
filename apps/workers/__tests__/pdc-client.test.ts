import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing the client
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
    })),
  },
}));

import axios from 'axios';
import { getPdcClient } from '../src/lib/pdc-client';

describe('PDC Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPdcClient', () => {
    it('creates client with correct base URL', () => {
      getPdcClient();
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://data.wa.gov/resource',
        })
      );
    });

    it('returns singleton instance', () => {
      const client1 = getPdcClient();
      const client2 = getPdcClient();
      expect(client1).toBe(client2);
    });
  });

  describe('getContributions', () => {
    it('builds correct query params with pagination', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: [] });
      (axios.create as any).mockReturnValue({ get: mockGet });

      // Reset singleton to use mocked axios
      vi.resetModules();
      const { getPdcClient: getFreshClient } = await import('../src/lib/pdc-client');
      const client = getFreshClient();

      await client.getContributions({ page: 2, limit: 50 });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.objectContaining({
          params: expect.objectContaining({
            $limit: '50',
            $offset: '50',
          }),
        })
      );
    });

    it('adds date filters when provided', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: [] });
      (axios.create as any).mockReturnValue({ get: mockGet });

      vi.resetModules();
      const { getPdcClient: getFreshClient } = await import('../src/lib/pdc-client');
      const client = getFreshClient();

      await client.getContributions({
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      });

      expect(mockGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            $where: expect.stringContaining('2023-01-01'),
          }),
        })
      );
    });
  });
});
