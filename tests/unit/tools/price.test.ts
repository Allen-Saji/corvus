import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTokenPriceTool } from '../../../src/tools/price';
import * as defillama from '../../../src/lib/defillama';

vi.mock('../../../src/lib/defillama');

describe('getTokenPriceTool', () => {
  const mockTokenPrices = vi.mocked(defillama.getTokenPrices);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return prices for known tokens by symbol', async () => {
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

    const result = await getTokenPriceTool('SOL,USDC');
    const parsed = JSON.parse(result);

    expect(parsed.requested).toBe(2);
    expect(parsed.found).toBe(2);
    expect(parsed.not_found).toBe(0);
    expect(parsed.prices).toHaveLength(2);
    expect(parsed.prices[0].token).toBe('SOL');
    expect(parsed.prices[0].price_usd).toBe(80.5);
    expect(parsed.prices[1].token).toBe('USDC');
    expect(parsed.prices[1].price_usd).toBe(1.0);
  });

  it('should handle single token', async () => {
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

    const result = await getTokenPriceTool('SOL');
    const parsed = JSON.parse(result);

    expect(parsed.requested).toBe(1);
    expect(parsed.found).toBe(1);
    expect(parsed.prices).toHaveLength(1);
  });

  it('should handle mint addresses directly', async () => {
    const mint = 'So11111111111111111111111111111111111111112';

    mockTokenPrices.mockResolvedValueOnce({
      data: {
        [mint]: {
          mint,
          symbol: 'SOL',
          price: 80.5,
          decimals: 9,
          confidence: 0.99,
          timestamp: 1705000000,
        },
      },
    });

    const result = await getTokenPriceTool(mint);
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(1);
    expect(parsed.prices[0].mint).toBe(mint);
  });

  it('should handle unknown tokens', async () => {
    mockTokenPrices.mockResolvedValueOnce({
      data: {}, // No prices found
    });

    const result = await getTokenPriceTool('UNKNOWN');
    const parsed = JSON.parse(result);

    expect(parsed.requested).toBe(1);
    expect(parsed.found).toBe(0);
    expect(parsed.not_found).toBe(1);
    expect(parsed.prices[0].error).toBeDefined();
    expect(parsed.prices[0].error).toContain('Price unavailable');
    expect(parsed._meta.note).toContain('not found');
  });

  it('should handle mixed found and not found tokens', async () => {
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
        // UNKNOWN has no price
      },
    });

    const result = await getTokenPriceTool('SOL,UNKNOWN');
    const parsed = JSON.parse(result);

    expect(parsed.requested).toBe(2);
    expect(parsed.found).toBe(1);
    expect(parsed.not_found).toBe(1);
    expect(parsed.prices[0].price_usd).toBe(80.5);
    expect(parsed.prices[1].error).toBeDefined();
  });

  it('should handle empty input', async () => {
    const result = await getTokenPriceTool('');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('No tokens provided');
    expect(parsed._meta.tool).toBe('get_token_price');
    expect(mockTokenPrices).not.toHaveBeenCalled();
  });

  it('should handle whitespace only input', async () => {
    const result = await getTokenPriceTool('   ');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('No tokens provided');
  });

  it('should enforce 50 token limit', async () => {
    const manyTokens = Array(51).fill('SOL').join(',');
    const result = await getTokenPriceTool(manyTokens);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Maximum 50 tokens');
    expect(parsed.error).toContain('51');
    expect(mockTokenPrices).not.toHaveBeenCalled();
  });

  it('should allow exactly 50 tokens', async () => {
    const tokens = Array(50).fill('SOL').join(',');

    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getTokenPriceTool(tokens);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeUndefined();
    expect(parsed.requested).toBe(50);
    expect(mockTokenPrices).toHaveBeenCalled();
  });

  it('should trim whitespace from token names', async () => {
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

    const result = await getTokenPriceTool('  SOL  ,  USDC  ');
    const parsed = JSON.parse(result);

    expect(parsed.prices[0].token).toBe('SOL');
    expect(parsed.prices[1].token).toBe('USDC');
  });

  it('should filter out empty tokens from comma-separated list', async () => {
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

    const result = await getTokenPriceTool('SOL,,,,USDC,,,');
    const parsed = JSON.parse(result);

    expect(parsed.requested).toBe(2);
    expect(parsed.prices).toHaveLength(2);
  });

  it('should handle API error', async () => {
    mockTokenPrices.mockResolvedValueOnce({
      error: 'DefiLlama Coins API: Service temporarily unavailable',
    });

    const result = await getTokenPriceTool('SOL');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Service temporarily unavailable');
    expect(parsed._meta.tool).toBe('get_token_price');
  });

  it('should include all price data fields', async () => {
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

    const result = await getTokenPriceTool('SOL');
    const parsed = JSON.parse(result);

    const price = parsed.prices[0];
    expect(price.token).toBe('SOL');
    expect(price.mint).toBe('So11111111111111111111111111111111111111112');
    expect(price.symbol).toBe('SOL');
    expect(price.price_usd).toBe(80.5);
    expect(price.decimals).toBe(9);
    expect(price.confidence).toBe(0.99);
  });

  it('should include proper metadata', async () => {
    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getTokenPriceTool('SOL');
    const parsed = JSON.parse(result);

    expect(parsed._meta).toBeDefined();
    expect(parsed._meta.data_source).toBe('DefiLlama Coins API');
    expect(parsed._meta.timestamp).toBeDefined();
    expect(parsed._meta.note).toBeDefined();
  });

  it('should be case-insensitive for symbols', async () => {
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

    const result = await getTokenPriceTool('sol');
    const parsed = JSON.parse(result);

    expect(parsed.found).toBe(1);
    expect(parsed.prices[0].symbol).toBe('SOL');
  });

  it('should return properly formatted JSON', async () => {
    mockTokenPrices.mockResolvedValueOnce({
      data: {},
    });

    const result = await getTokenPriceTool('SOL');

    expect(() => JSON.parse(result)).not.toThrow();
    expect(result).toContain('\n');
  });
});
