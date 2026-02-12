import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSolBalance, getTokenBalances, getRecentTransactions } from '../../src/lib/helius';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

const mockFetch = vi.mocked((await import('node-fetch')).default);

describe('Helius API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variable for tests
    process.env.HELIUS_API_KEY = 'test-api-key-12345';
  });

  describe('getSolBalance', () => {
    it('should fetch SOL balance successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { value: 5000000000 }, // 5 SOL
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.data).toBeDefined();
      expect(result.data?.balance_sol).toBe(5);
      expect(result.data?.balance_lamports).toBe(5000000000);
      expect(result.error).toBeUndefined();
    });

    it('should handle zero balance', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { value: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getSolBalance('11111111111111111111111111111111');

      expect(result.data).toBeDefined();
      expect(result.data?.balance_sol).toBe(0);
      expect(result.data?.balance_lamports).toBe(0);
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as any);

      const result = await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Helius RPC');
      expect(result.data).toBeUndefined();
    });

    it('should handle RPC error responses', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: { message: 'Invalid wallet address' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getSolBalance('invalid-address');

      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => {
          setTimeout(() => reject({ name: 'AbortError' }), 100);
        })
      );

      const result = await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('did not respond within');
      expect(result.error).toContain('5 seconds');
    });

    it('should sanitize ECONNREFUSED errors', async () => {
      const error = new Error('Connection refused');
      (error as any).code = 'ECONNREFUSED';

      mockFetch.mockRejectedValueOnce(error);

      const result = await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Service temporarily unavailable');
      expect(result.error).not.toContain('ECONNREFUSED');
    });

    it('should include Authorization header', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { value: 1000000000 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key-12345',
          }),
        })
      );
    });
  });

  describe('getTokenBalances', () => {
    it('should fetch token balances successfully', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          items: [
            {
              id: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              interface: 'FungibleToken',
              content: {
                metadata: {
                  symbol: 'USDC',
                  name: 'USD Coin',
                },
              },
              token_info: {
                balance: 1000000,
                decimals: 6,
                price_info: { price_per_token: 1.0 },
              },
            },
            {
              id: 'So11111111111111111111111111111111111111112',
              interface: 'FungibleAsset',
              content: {
                metadata: {
                  symbol: 'SOL',
                  name: 'Solana',
                },
              },
              token_info: {
                balance: 5000000000,
                decimals: 9,
              },
            },
          ],
          nativeBalance: {
            lamports: 3000000000,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getTokenBalances('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(3); // 2 tokens + native SOL
      expect(result.data?.[0].symbol).toBe('SOL'); // Native SOL should be first
      expect(result.data?.[0].balance).toBe(3); // 3 SOL
      expect(result.data?.[1].symbol).toBe('USDC');
      expect(result.data?.[1].balance).toBe(1); // 1 USDC
    });

    it('should handle empty wallet (no tokens)', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          items: [],
          nativeBalance: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getTokenBalances('11111111111111111111111111111111');

      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });

    it('should handle tokens with missing metadata', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          items: [
            {
              id: 'UnknownMint123456789',
              interface: 'FungibleToken',
              content: {
                metadata: {}, // No symbol or name
              },
              token_info: {
                balance: 1000000000,
                decimals: 9,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getTokenBalances('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].symbol).toBeUndefined();
      expect(result.data?.[0].name).toBeUndefined();
    });

    it('should filter non-fungible tokens', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          items: [
            {
              id: 'NFTMint123',
              interface: 'NFT', // Should be filtered out
              content: { metadata: { name: 'Cool NFT' } },
              token_info: { balance: 1, decimals: 0 },
            },
            {
              id: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              interface: 'FungibleToken',
              content: { metadata: { symbol: 'USDC' } },
              token_info: { balance: 1000000, decimals: 6 },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getTokenBalances('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].symbol).toBe('USDC');
    });

    it('should handle DAS API error', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: { message: 'Invalid request' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getTokenBalances('invalid-address');

      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should calculate token balances with decimals correctly', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          items: [
            {
              id: 'TestMint',
              interface: 'FungibleToken',
              content: { metadata: { symbol: 'TEST' } },
              token_info: {
                balance: 123456789,
                decimals: 6,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getTokenBalances('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.data).toBeDefined();
      expect(result.data?.[0].balance).toBe(123.456789);
      expect(result.data?.[0].decimals).toBe(6);
    });
  });

  describe('getRecentTransactions', () => {
    it('should fetch recent transactions successfully', async () => {
      const mockResponse = [
        {
          signature: 'sig123',
          timestamp: 1705000000,
          description: 'Transfer SOL',
          type: 'TRANSFER',
          fee: 5000,
          nativeTransfers: [],
          tokenTransfers: [],
        },
        {
          signature: 'sig456',
          timestamp: 1705000100,
          type: 'SWAP',
          fee: 10000,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getRecentTransactions('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.[0].signature).toBe('sig123');
      expect(result.data?.[0].description).toBe('Transfer SOL');
      expect(result.data?.[0].fee_sol).toBe(0.000005);
      expect(result.data?.[1].description).toBe('Unknown transaction');
    });

    it('should enforce limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

      await getRecentTransactions('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 5);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('limit=5');
    });

    it('should cap limit at 50', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

      await getRecentTransactions('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 100);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('limit=50');
    });

    it('should handle empty transaction list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

      const result = await getRecentTransactions('11111111111111111111111111111111');

      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });

    it('should handle HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      const result = await getRecentTransactions('invalid-address');

      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should handle non-array response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Invalid format' }),
      } as any);

      const result = await getRecentTransactions('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should properly encode wallet address in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

      const walletWithSpecialChars = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      await getRecentTransactions(walletWithSpecialChars);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain(encodeURIComponent(walletWithSpecialChars));
    });

    it('should handle missing optional fields', async () => {
      const mockResponse = [
        {
          signature: 'sig123',
          timestamp: 1705000000,
          // Missing description, type, fee
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await getRecentTransactions('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.data).toBeDefined();
      expect(result.data?.[0].description).toBe('Unknown transaction');
      expect(result.data?.[0].type).toBe('UNKNOWN');
      expect(result.data?.[0].fee_sol).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing HELIUS_API_KEY', async () => {
      delete process.env.HELIUS_API_KEY;

      // The error is caught by safeApiCall and returned as an error object
      const result = await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();

      // Restore for other tests
      process.env.HELIUS_API_KEY = 'test-api-key-12345';
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as any);

      const result = await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should handle network connection errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getSolBalance('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Request failed');
    });
  });
});
