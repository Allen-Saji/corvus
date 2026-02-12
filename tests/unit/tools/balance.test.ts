import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSOLBalanceTool } from '../../../src/tools/balance';
import * as helius from '../../../src/lib/helius';
import * as defillama from '../../../src/lib/defillama';

vi.mock('../../../src/lib/helius');
vi.mock('../../../src/lib/defillama');

describe('getSOLBalanceTool', () => {
  const mockSolBalance = vi.mocked(helius.getSolBalance);
  const mockTokenPrices = vi.mocked(defillama.getTokenPrices);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return SOL balance with USD value', async () => {
    mockSolBalance.mockResolvedValueOnce({
      data: {
        balance_sol: 5.5,
        balance_lamports: 5500000000,
      },
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

    const result = await getSOLBalanceTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.wallet).toBe('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    expect(parsed.balance_sol).toBe(5.5);
    expect(parsed.balance_lamports).toBe(5500000000);
    expect(parsed.price_usd).toBe(80.5);
    expect(parsed.value_usd).toBe(5.5 * 80.5);
    expect(parsed._meta).toBeDefined();
    expect(parsed._meta.data_source).toContain('Helius');
    expect(parsed._meta.data_source).toContain('DefiLlama');
  });

  it('should handle zero balance', async () => {
    mockSolBalance.mockResolvedValueOnce({
      data: {
        balance_sol: 0,
        balance_lamports: 0,
      },
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

    const result = await getSOLBalanceTool('11111111111111111111111111111111');
    const parsed = JSON.parse(result);

    expect(parsed.balance_sol).toBe(0);
    expect(parsed.value_usd).toBe(0);
  });

  it('should handle missing price data gracefully', async () => {
    mockSolBalance.mockResolvedValueOnce({
      data: {
        balance_sol: 5.5,
        balance_lamports: 5500000000,
      },
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {}, // No price data
    });

    const result = await getSOLBalanceTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.balance_sol).toBe(5.5);
    expect(parsed.price_usd).toBeUndefined();
    expect(parsed.value_usd).toBeUndefined();
    expect(parsed._meta.note).toContain('unavailable');
  });

  it('should handle invalid wallet address', async () => {
    const result = await getSOLBalanceTool('invalid-address');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Invalid Solana address');
    expect(parsed._meta.tool).toBe('get_sol_balance');
    expect(mockSolBalance).not.toHaveBeenCalled();
  });

  it('should handle empty wallet address', async () => {
    const result = await getSOLBalanceTool('');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed._meta.tool).toBe('get_sol_balance');
  });

  it('should handle Helius API error', async () => {
    mockSolBalance.mockResolvedValueOnce({
      error: 'Helius RPC: Service temporarily unavailable',
    });

    const result = await getSOLBalanceTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Service temporarily unavailable');
    expect(parsed._meta.tool).toBe('get_sol_balance');
  });

  it('should handle price API error gracefully', async () => {
    mockSolBalance.mockResolvedValueOnce({
      data: {
        balance_sol: 5.5,
        balance_lamports: 5500000000,
      },
    });

    mockTokenPrices.mockResolvedValueOnce({
      error: 'DefiLlama API unavailable',
    });

    const result = await getSOLBalanceTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    // Should still return balance even if price fails
    expect(parsed.balance_sol).toBe(5.5);
    expect(parsed.price_usd).toBeUndefined();
    expect(parsed.value_usd).toBeUndefined();
  });

  it('should include proper metadata', async () => {
    mockSolBalance.mockResolvedValueOnce({
      data: {
        balance_sol: 5.5,
        balance_lamports: 5500000000,
      },
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getSOLBalanceTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed._meta).toBeDefined();
    expect(parsed._meta.data_source).toBeDefined();
    expect(parsed._meta.timestamp).toBeDefined();
    expect(parsed._meta.note).toBeDefined();
  });

  it('should calculate USD value correctly', async () => {
    mockSolBalance.mockResolvedValueOnce({
      data: {
        balance_sol: 10.5,
        balance_lamports: 10500000000,
      },
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
      },
    });

    const result = await getSOLBalanceTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.value_usd).toBe(1050); // 10.5 * 100
  });

  it('should return properly formatted JSON', async () => {
    mockSolBalance.mockResolvedValueOnce({
      data: {
        balance_sol: 5.5,
        balance_lamports: 5500000000,
      },
    });

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getSOLBalanceTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

    // Should be valid JSON
    expect(() => JSON.parse(result)).not.toThrow();

    // Should be pretty-printed (contains newlines)
    expect(result).toContain('\n');
  });
});
