import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRecentTransactionsTool } from '../../../src/tools/transactions';
import * as helius from '../../../src/lib/helius';

vi.mock('../../../src/lib/helius');

describe('getRecentTransactionsTool', () => {
  const mockRecentTransactions = vi.mocked(helius.getRecentTransactions);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return recent transactions with default limit', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [
        {
          signature: 'sig123',
          timestamp: 1705000000,
          description: 'Transfer SOL',
          type: 'TRANSFER',
          fee_sol: 0.000005,
          native_transfers: [],
          token_transfers: [],
        },
        {
          signature: 'sig456',
          timestamp: 1705000100,
          description: 'Swap tokens',
          type: 'SWAP',
          fee_sol: 0.00001,
          native_transfers: [],
          token_transfers: [],
        },
      ],
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.wallet).toBe('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    expect(parsed.transaction_count).toBe(2);
    expect(parsed.transactions).toHaveLength(2);
    expect(parsed.transactions[0].signature).toBe('sig123');
    expect(parsed.transactions[0].description).toBe('Transfer SOL');
    expect(parsed.transactions[0].type).toBe('TRANSFER');
    expect(parsed.transactions[0].fee_sol).toBe(0.000005);
    expect(mockRecentTransactions).toHaveBeenCalledWith('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 10);
  });

  it('should respect custom limit parameter', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: Array(5).fill(null).map((_, i) => ({
        signature: `sig${i}`,
        timestamp: 1705000000 + i,
        description: 'Transaction',
        type: 'UNKNOWN',
        fee_sol: 0.000005,
        native_transfers: [],
        token_transfers: [],
      })),
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 5);
    const parsed = JSON.parse(result);

    expect(parsed.transaction_count).toBe(5);
    expect(mockRecentTransactions).toHaveBeenCalledWith('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 5);
  });

  it('should handle empty transaction list', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [],
    });

    const result = await getRecentTransactionsTool('11111111111111111111111111111111');
    const parsed = JSON.parse(result);

    expect(parsed.transaction_count).toBe(0);
    expect(parsed.transactions).toEqual([]);
  });

  it('should convert timestamps to ISO format', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [
        {
          signature: 'sig123',
          timestamp: 1705000000, // Unix timestamp
          description: 'Transfer',
          type: 'TRANSFER',
          fee_sol: 0.000005,
          native_transfers: [],
          token_transfers: [],
        },
      ],
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    // Should be ISO string
    expect(parsed.transactions[0].timestamp).toContain('T');
    expect(parsed.transactions[0].timestamp).toContain('Z');
    expect(() => new Date(parsed.transactions[0].timestamp)).not.toThrow();
  });

  it('should handle invalid wallet address', async () => {
    const result = await getRecentTransactionsTool('invalid-address');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Invalid Solana address');
    expect(parsed._meta.tool).toBe('get_recent_transactions');
    expect(mockRecentTransactions).not.toHaveBeenCalled();
  });

  it('should use default limit when zero provided', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [],
    });

    await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 0);

    // 0 is falsy, so default 10 is used
    expect(mockRecentTransactions).toHaveBeenCalledWith('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 10);
  });

  it('should validate limit parameter - reject negative', async () => {
    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', -1);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(mockRecentTransactions).not.toHaveBeenCalled();
  });

  it('should enforce maximum limit of 50', async () => {
    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 51);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('limit');
    expect(mockRecentTransactions).not.toHaveBeenCalled();
  });

  it('should allow exactly 50 transactions', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [],
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 50);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeUndefined();
    expect(mockRecentTransactions).toHaveBeenCalledWith('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 50);
  });

  it('should handle API error', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      error: 'Helius Enhanced Transactions API: Service temporarily unavailable',
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Service temporarily unavailable');
    expect(parsed._meta.tool).toBe('get_recent_transactions');
  });

  it('should include native_transfers and token_transfers', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [
        {
          signature: 'sig123',
          timestamp: 1705000000,
          description: 'Transfer',
          type: 'TRANSFER',
          fee_sol: 0.000005,
          native_transfers: [{ from: 'addr1', to: 'addr2', amount: 1000000000 }],
          token_transfers: [{ mint: 'USDC', from: 'addr1', to: 'addr2', amount: 100 }],
        },
      ],
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed.transactions[0].native_transfers).toBeDefined();
    expect(parsed.transactions[0].token_transfers).toBeDefined();
    expect(parsed.transactions[0].native_transfers).toHaveLength(1);
    expect(parsed.transactions[0].token_transfers).toHaveLength(1);
  });

  it('should include proper metadata', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [],
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    const parsed = JSON.parse(result);

    expect(parsed._meta).toBeDefined();
    expect(parsed._meta.data_source).toBe('Helius Enhanced Transactions API');
    expect(parsed._meta.timestamp).toBeDefined();
    expect(parsed._meta.note).toContain('current prices');
  });

  it('should return properly formatted JSON', async () => {
    mockRecentTransactions.mockResolvedValueOnce({
      data: [],
    });

    const result = await getRecentTransactionsTool('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

    expect(() => JSON.parse(result)).not.toThrow();
    expect(result).toContain('\n');
  });
});
