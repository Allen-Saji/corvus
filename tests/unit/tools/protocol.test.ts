import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProtocolTVLTool, getTopProtocolsTool } from '../../../src/tools/protocol';
import * as defillama from '../../../src/lib/defillama';

vi.mock('../../../src/lib/defillama');

describe('Protocol Tools', () => {
  const mockGetProtocol = vi.mocked(defillama.getProtocol);
  const mockGetTopSolanaProtocols = vi.mocked(defillama.getTopSolanaProtocols);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProtocolTVLTool', () => {
    it('should return protocol TVL and metrics', async () => {
      mockGetProtocol.mockResolvedValueOnce({
        data: {
          name: 'Kamino Lend',
          slug: 'kamino-lend',
          category: 'Lending',
          tvl: 1648895170.19,
          chainTvls: { Solana: 1648895170.19, Ethereum: 500000 },
          change_1h: 0.5,
          change_1d: -1.2,
          change_7d: 3.4,
        },
      });

      const result = await getProtocolTVLTool('kamino');
      const parsed = JSON.parse(result);

      expect(parsed.protocol).toBe('Kamino Lend');
      expect(parsed.slug).toBe('kamino-lend');
      expect(parsed.category).toBe('Lending');
      expect(parsed.tvl_total).toBe(1648895170.19);
      expect(parsed.tvl_solana).toBe(1648895170.19);
      expect(parsed.chain_breakdown.Solana).toBe(1648895170.19);
      expect(parsed.chain_breakdown.Ethereum).toBe(500000);
      expect(parsed.changes['1h']).toBe(0.5);
      expect(parsed.changes['1d']).toBe(-1.2);
      expect(parsed.changes['7d']).toBe(3.4);
    });

    it('should handle chain_tvls field (alternate naming)', async () => {
      mockGetProtocol.mockResolvedValueOnce({
        data: {
          name: 'Test Protocol',
          slug: 'test-protocol',
          category: 'DEX',
          tvl: 1000000,
          chain_tvls: { Solana: 1000000 }, // Alternate field name
        },
      });

      const result = await getProtocolTVLTool('test');
      const parsed = JSON.parse(result);

      expect(parsed.tvl_solana).toBe(1000000);
      expect(parsed.chain_breakdown.Solana).toBe(1000000);
    });

    it('should handle protocol with no Solana TVL', async () => {
      mockGetProtocol.mockResolvedValueOnce({
        data: {
          name: 'Ethereum Protocol',
          slug: 'eth-protocol',
          category: 'DEX',
          tvl: 5000000,
          chainTvls: { Ethereum: 5000000 },
        },
      });

      const result = await getProtocolTVLTool('ethereum');
      const parsed = JSON.parse(result);

      expect(parsed.tvl_solana).toBe(0);
    });

    it('should handle empty protocol name', async () => {
      const result = await getProtocolTVLTool('');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('No protocol name provided');
      expect(parsed._meta.tool).toBe('get_protocol_tvl');
      expect(mockGetProtocol).not.toHaveBeenCalled();
    });

    it('should handle whitespace only input', async () => {
      const result = await getProtocolTVLTool('   ');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('No protocol name provided');
    });

    it('should handle unknown protocol', async () => {
      mockGetProtocol.mockResolvedValueOnce({
        error: 'Could not find Solana protocol matching "nonexistent"',
      });

      const result = await getProtocolTVLTool('nonexistent');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('Could not find');
      expect(parsed._meta.tool).toBe('get_protocol_tvl');
    });

    it('should handle API error', async () => {
      mockGetProtocol.mockResolvedValueOnce({
        error: 'DefiLlama Protocol API: Service temporarily unavailable',
      });

      const result = await getProtocolTVLTool('kamino');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('Service temporarily unavailable');
    });

    it('should include proper metadata', async () => {
      mockGetProtocol.mockResolvedValueOnce({
        data: {
          name: 'Kamino Lend',
          slug: 'kamino-lend',
          category: 'Lending',
          tvl: 1648895170.19,
          chainTvls: { Solana: 1648895170.19 },
        },
      });

      const result = await getProtocolTVLTool('kamino');
      const parsed = JSON.parse(result);

      expect(parsed._meta).toBeDefined();
      expect(parsed._meta.data_source).toBe('DefiLlama Protocol API');
      expect(parsed._meta.timestamp).toBeDefined();
      expect(parsed._meta.note).toContain('USD');
    });
  });

  describe('getTopProtocolsTool', () => {
    const mockProtocols = [
      {
        name: 'Kamino Lend',
        slug: 'kamino-lend',
        category: 'Lending',
        tvl: 1648895170.19,
        chainTvls: { Solana: 1648895170.19 },
        change_1h: 0.5,
        change_1d: -1.2,
        change_7d: 3.4,
      },
      {
        name: 'Jito',
        slug: 'jito',
        category: 'Liquid Staking',
        tvl: 1073373255.49,
        chainTvls: { Solana: 1073373255.49 },
        change_1h: 0.1,
        change_1d: 0.5,
        change_7d: 2.1,
      },
    ];

    it('should return top protocols with default limit', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: mockProtocols,
      });

      const result = await getTopProtocolsTool();
      const parsed = JSON.parse(result);

      expect(parsed.category).toBe('all');
      expect(parsed.protocol_count).toBe(2);
      expect(parsed.protocols).toHaveLength(2);
      expect(parsed.protocols[0].name).toBe('Kamino Lend');
      expect(parsed.protocols[0].tvl_solana).toBe(1648895170.19);
      expect(parsed.protocols[0].tvl_total).toBe(1648895170.19);
      expect(mockGetTopSolanaProtocols).toHaveBeenCalledWith(10, undefined);
    });

    it('should respect custom limit', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [mockProtocols[0]],
      });

      const result = await getTopProtocolsTool(1);
      const parsed = JSON.parse(result);

      expect(parsed.protocol_count).toBe(1);
      expect(mockGetTopSolanaProtocols).toHaveBeenCalledWith(1, undefined);
    });

    it('should filter by category', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [mockProtocols[0]], // Only Lending
      });

      const result = await getTopProtocolsTool(10, 'Lending');
      const parsed = JSON.parse(result);

      expect(parsed.category).toBe('Lending');
      expect(parsed.protocol_count).toBe(1);
      expect(parsed.protocols[0].category).toBe('Lending');
      expect(mockGetTopSolanaProtocols).toHaveBeenCalledWith(10, 'Lending');
    });

    it('should handle chain_tvls field (alternate naming)', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [
          {
            name: 'Test Protocol',
            slug: 'test',
            category: 'DEX',
            tvl: 1000000,
            chain_tvls: { Solana: 1000000 }, // Alternate field
          },
        ],
      });

      const result = await getTopProtocolsTool();
      const parsed = JSON.parse(result);

      expect(parsed.protocols[0].tvl_solana).toBe(1000000);
    });

    it('should handle protocol with no Solana TVL', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [
          {
            name: 'Protocol',
            slug: 'protocol',
            category: 'DEX',
            tvl: 1000000,
            chainTvls: {}, // No Solana
          },
        ],
      });

      const result = await getTopProtocolsTool();
      const parsed = JSON.parse(result);

      expect(parsed.protocols[0].tvl_solana).toBe(0);
    });

    it('should use default limit when zero provided', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [],
      });

      await getTopProtocolsTool(0);

      // 0 is falsy, so default 10 is used
      expect(mockGetTopSolanaProtocols).toHaveBeenCalledWith(10, undefined);
    });

    it('should validate limit - reject negative', async () => {
      const result = await getTopProtocolsTool(-1);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(mockGetTopSolanaProtocols).not.toHaveBeenCalled();
    });

    it('should enforce maximum limit of 50', async () => {
      const result = await getTopProtocolsTool(51);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('limit');
      expect(mockGetTopSolanaProtocols).not.toHaveBeenCalled();
    });

    it('should allow exactly 50 protocols', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [],
      });

      const result = await getTopProtocolsTool(50);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeUndefined();
      expect(mockGetTopSolanaProtocols).toHaveBeenCalledWith(50, undefined);
    });

    it('should handle API error', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        error: 'DefiLlama Protocols API: Service temporarily unavailable',
      });

      const result = await getTopProtocolsTool();
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('Service temporarily unavailable');
      expect(parsed._meta.tool).toBe('get_top_solana_protocols');
    });

    it('should include change metrics', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: mockProtocols,
      });

      const result = await getTopProtocolsTool();
      const parsed = JSON.parse(result);

      expect(parsed.protocols[0].changes['1h']).toBe(0.5);
      expect(parsed.protocols[0].changes['1d']).toBe(-1.2);
      expect(parsed.protocols[0].changes['7d']).toBe(3.4);
    });

    it('should include proper metadata', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [],
      });

      const result = await getTopProtocolsTool();
      const parsed = JSON.parse(result);

      expect(parsed._meta).toBeDefined();
      expect(parsed._meta.data_source).toBe('DefiLlama Protocols API');
      expect(parsed._meta.timestamp).toBeDefined();
      expect(parsed._meta.note).toContain('TVL');
    });

    it('should return properly formatted JSON', async () => {
      mockGetTopSolanaProtocols.mockResolvedValueOnce({
        data: [],
      });

      const result = await getTopProtocolsTool();

      expect(() => JSON.parse(result)).not.toThrow();
      expect(result).toContain('\n');
    });
  });
});
