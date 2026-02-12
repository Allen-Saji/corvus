import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeWalletDeFiPositionsTool } from '../../../src/tools/defi-positions';
import * as helius from '../../../src/lib/helius';
import * as defillama from '../../../src/lib/defillama';

vi.mock('../../../src/lib/helius');
vi.mock('../../../src/lib/defillama');

describe('analyzeWalletDeFiPositionsTool', () => {
  const mockTokenBalances = vi.mocked(helius.getTokenBalances);
  const mockTokenPrices = vi.mocked(defillama.getTokenPrices);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify known DeFi tokens correctly', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          balance: 5.5,
          decimals: 9,
        },
        {
          mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
          symbol: 'JitoSOL',
          name: 'Jito Staked SOL',
          balance: 10,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        'So11111111111111111111111111111111111111112': {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          price: 80.5,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
        'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': {
          mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
          symbol: 'JitoSOL',
          price: 101.5,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.known_positions).toHaveLength(2);
    expect(parsed.known_positions[0].confidence).toBe('high');
    expect(parsed.known_positions[0].protocol).toBeDefined();
    expect(parsed.known_positions[1].symbol).toBe('JitoSOL');
    expect(parsed.known_positions[1].protocol).toBe('Jito');
    expect(parsed.summary.known_positions_count).toBe(2);
  });

  it('should classify LP tokens as likely_defi', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'LPTokenMint123',
          symbol: 'SOL-USDC-LP',
          name: 'Orca LP Token',
          balance: 100,
          decimals: 6,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {}, // No price for LP token
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.likely_defi).toHaveLength(1);
    expect(parsed.likely_defi[0].confidence).toBe('medium');
    expect(parsed.likely_defi[0].signals).toContain('lp_in_symbol');
    expect(parsed.likely_defi[0].signals).toContain('known_protocol_in_name');
    expect(parsed.summary.likely_defi_count).toBe(1);
  });

  it('should classify vault tokens as likely_defi', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'VaultMint123',
          symbol: 'kUSDC-USDT',
          name: 'Kamino Vault Token',
          balance: 50,
          decimals: 6,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.likely_defi).toHaveLength(1);
    expect(parsed.likely_defi[0].signals).toContain('k_prefix');
    expect(parsed.likely_defi[0].signals).toContain('known_protocol_in_name');
  });

  it('should classify unknown tokens as unclassified', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'UnknownMint123',
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          balance: 100,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        'UnknownMint123': {
          mint: 'UnknownMint123',
          symbol: 'UNKNOWN',
          price: 1.5,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.unclassified).toHaveLength(1);
    expect(parsed.unclassified[0].confidence).toBe('none');
    expect(parsed.summary.unclassified_count).toBe(1);
  });

  it('should filter dust (< $1 USD)', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'Token1',
          symbol: 'TK1',
          balance: 0.001, // Worth $0.10
          decimals: 9,
        },
        {
          mint: 'Token2',
          symbol: 'TK2',
          balance: 10, // Worth $10
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        'Token1': { mint: 'Token1', symbol: 'TK1', price: 100, decimals: 9, confidence: 0.99, timestamp: 1705000000 },
        'Token2': { mint: 'Token2', symbol: 'TK2', price: 1, decimals: 9, confidence: 0.99, timestamp: 1705000000 },
      },
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.summary.dust_filtered).toBe(1);
    // Only Token2 should be included
    expect(parsed.unclassified).toHaveLength(1);
    expect(parsed.unclassified[0].symbol).toBe('TK2');
  });

  it('should filter dust without price (< 0.01 balance)', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'Token1',
          symbol: 'TK1',
          balance: 0.005, // Too small, no price
          decimals: 9,
        },
        {
          mint: 'Token2',
          symbol: 'TK2',
          balance: 0.1, // Significant, no price
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {}, // No prices
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.summary.dust_filtered).toBe(1);
    expect(parsed.unclassified).toHaveLength(1);
    expect(parsed.unclassified[0].symbol).toBe('TK2');
  });

  it('should calculate summary values correctly', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          balance: 10,
          decimals: 9,
        },
        {
          mint: 'LPMint',
          symbol: 'SOL-USDC-LP',
          balance: 50,
          decimals: 6,
        },
        {
          mint: 'Unknown',
          symbol: 'UNK',
          balance: 100,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        'So11111111111111111111111111111111111111112': {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          price: 100,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
        'Unknown': {
          mint: 'Unknown',
          symbol: 'UNK',
          price: 2,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.summary.total_known_value_usd).toBe(1000); // 10 * 100
    expect(parsed.summary.total_likely_defi_value_usd).toBe(0); // LP has no price
    expect(parsed.summary.total_unclassified_value_usd).toBe(200); // 100 * 2
    expect(parsed.summary.total_estimated_usd).toBe(1200);
  });

  it('should handle empty wallet', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await analyzeWalletDeFiPositionsTool('11111111111111111111111111111111');
    const parsed = JSON.parse(result);

    expect(parsed.known_positions).toEqual([]);
    expect(parsed.likely_defi).toEqual([]);
    expect(parsed.unclassified).toEqual([]);
    expect(parsed.summary.total_estimated_usd).toBe(0);
    expect(parsed.summary.dust_filtered).toBe(0);
  });

  it('should prevent NaN in calculations', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'Token1',
          symbol: 'TK1',
          balance: NaN as any, // Invalid balance
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        'Token1': {
          mint: 'Token1',
          symbol: 'TK1',
          price: 100,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    // Should be filtered as dust (balance becomes 0)
    expect(isNaN(parsed.summary.total_estimated_usd)).toBe(false);
    expect(isFinite(parsed.summary.total_estimated_usd)).toBe(true);
  });

  it('should filter tokens with Infinity prices as dust', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          balance: 10,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        'So11111111111111111111111111111111111111112': {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          price: Infinity as any, // Invalid price
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    // Token with Infinity price gets filtered (no value_usd, and price exists so balance check doesn't help)
    expect(parsed.known_positions).toHaveLength(0);
    expect(parsed.summary.dust_filtered).toBe(1);
    expect(isFinite(parsed.summary.total_estimated_usd)).toBe(true);
  });

  it('should handle invalid wallet address', async () => {
    const result = await analyzeWalletDeFiPositionsTool('invalid-address');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Invalid Solana address');
    expect(parsed._meta.tool).toBe('analyze_wallet_defi_positions');
    expect(mockTokenBalances).not.toHaveBeenCalled();
  });

  it('should handle Helius API error', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      error: 'Helius DAS API: Service temporarily unavailable',
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Service temporarily unavailable');
    expect(parsed._meta.tool).toBe('analyze_wallet_defi_positions');
  });

  it('should handle null token data', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: null as any,
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('No token data returned');
  });

  it('should handle price API error gracefully', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          balance: 10,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      error: 'DefiLlama API unavailable',
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    // Should still classify tokens, just without prices
    expect(parsed.known_positions).toHaveLength(1);
    expect(parsed.known_positions[0].price_usd).toBeUndefined();
    expect(parsed.known_positions[0].value_usd).toBeUndefined();
  });

  it('should include proper metadata', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed._meta).toBeDefined();
    expect(parsed._meta.data_source).toContain('Helius');
    expect(parsed._meta.data_source).toContain('DefiLlama');
    expect(parsed._meta.timestamp).toBeDefined();
    expect(parsed._meta.tokens_scanned).toBe(0);
    expect(parsed._meta.classification).toBeDefined();
  });

  it('should include limitations array', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.limitations).toBeDefined();
    expect(Array.isArray(parsed.limitations)).toBe(true);
    expect(parsed.limitations.length).toBeGreaterThan(0);
    expect(parsed.limitations.some((l: string) => l.includes('Orca Whirlpool'))).toBe(true);
  });

  it('should return properly formatted JSON', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await analyzeWalletDeFiPositionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

    expect(() => JSON.parse(result)).not.toThrow();
    expect(result).toContain('\n');
  });
});
