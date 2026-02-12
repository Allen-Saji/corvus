import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTokenBalancesTool } from '../../../src/tools/tokens';
import * as helius from '../../../src/lib/helius';
import * as defillama from '../../../src/lib/defillama';

vi.mock('../../../src/lib/helius');
vi.mock('../../../src/lib/defillama');

describe('getTokenBalancesTool', () => {
  const mockTokenBalances = vi.mocked(helius.getTokenBalances);
  const mockTokenPrices = vi.mocked(defillama.getTokenPrices);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tokens with prices and USD values', async () => {
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
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 1000,
          decimals: 6,
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
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          price: 1.0,
          decimals: 6,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.wallet).toBe('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    expect(parsed.token_count).toBe(2);
    expect(parsed.tokens).toHaveLength(2);
    expect(parsed.tokens[0].price_usd).toBe(80.5);
    expect(parsed.tokens[0].value_usd).toBe(5.5 * 80.5);
    expect(parsed.tokens[1].price_usd).toBe(1.0);
    expect(parsed.tokens[1].value_usd).toBe(1000);
    expect(parsed.summary.total_value_usd).toBe(5.5 * 80.5 + 1000);
    expect(parsed.summary.tokens_priced).toBe(2);
    expect(parsed.summary.tokens_unpriced).toBe(0);
  });

  it('should handle empty wallet', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getTokenBalancesTool('11111111111111111111111111111111');
    const parsed = JSON.parse(result);

    expect(parsed.token_count).toBe(0);
    expect(parsed.tokens).toEqual([]);
    expect(parsed.summary.total_value_usd).toBe(0);
    expect(parsed.summary.tokens_priced).toBe(0);
    expect(parsed.summary.tokens_unpriced).toBe(0);
  });

  it('should handle tokens without prices', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'UnknownMint123',
          symbol: 'UNKNOWN',
          balance: 100,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {}, // No prices available
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.tokens[0].price_usd).toBeUndefined();
    expect(parsed.tokens[0].value_usd).toBeUndefined();
    expect(parsed.summary.tokens_priced).toBe(0);
    expect(parsed.summary.tokens_unpriced).toBe(1);
    expect(parsed._meta.note).toContain('no market price');
  });

  it('should handle mixed priced and unpriced tokens', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          balance: 5,
          decimals: 9,
        },
        {
          mint: 'UnknownMint123',
          symbol: 'UNKNOWN',
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
          price: 80.5,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.summary.tokens_priced).toBe(1);
    expect(parsed.summary.tokens_unpriced).toBe(1);
    expect(parsed.summary.total_value_usd).toBe(5 * 80.5);
  });

  it('should handle invalid wallet address', async () => {
    const result = await getTokenBalancesTool('invalid-address');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Invalid Solana address');
    expect(parsed._meta.tool).toBe('get_token_balances');
    expect(mockTokenBalances).not.toHaveBeenCalled();
  });

  it('should handle Helius API error', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      error: 'Helius DAS API: Service temporarily unavailable',
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Service temporarily unavailable');
    expect(parsed._meta.tool).toBe('get_token_balances');
  });

  it('should handle price API error gracefully', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          balance: 5,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      error: 'DefiLlama API unavailable',
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    // Should still return tokens even if pricing fails
    expect(parsed.tokens).toHaveLength(1);
    expect(parsed.tokens[0].price_usd).toBeUndefined();
    expect(parsed.summary.tokens_unpriced).toBe(1);
  });

  it('should calculate total value correctly', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [
        {
          mint: 'Token1',
          symbol: 'TK1',
          balance: 10,
          decimals: 9,
        },
        {
          mint: 'Token2',
          symbol: 'TK2',
          balance: 20,
          decimals: 6,
        },
        {
          mint: 'Token3',
          symbol: 'TK3',
          balance: 30,
          decimals: 9,
        },
      ],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        'Token1': { mint: 'Token1', symbol: 'TK1', price: 5, decimals: 9, confidence: 0.99, timestamp: 1705000000 },
        'Token2': { mint: 'Token2', symbol: 'TK2', price: 10, decimals: 6, confidence: 0.99, timestamp: 1705000000 },
        // Token3 has no price
      },
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.summary.total_value_usd).toBe(10 * 5 + 20 * 10); // 50 + 200 = 250
    expect(parsed.summary.tokens_priced).toBe(2);
    expect(parsed.summary.tokens_unpriced).toBe(1);
  });

  it('should include proper metadata', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed._meta).toBeDefined();
    expect(parsed._meta.data_source).toContain('Helius');
    expect(parsed._meta.data_source).toContain('DefiLlama');
    expect(parsed._meta.timestamp).toBeDefined();
    expect(parsed._meta.note).toBeDefined();
  });

  it('should return properly formatted JSON', async () => {
    mockTokenBalances.mockResolvedValueOnce({
      data: [],
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getTokenBalancesTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

    expect(() => JSON.parse(result)).not.toThrow();
    expect(result).toContain('\n');
  });
});
