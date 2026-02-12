import { describe, it, expect } from 'vitest';
import { getKnownDeFiEntry, classifyUnknownToken } from '../../src/data/defi-registry';

describe('getKnownDeFiEntry', () => {
  it('should return known DeFi tokens', () => {
    const solEntry = getKnownDeFiEntry('So11111111111111111111111111111111111111112');
    expect(solEntry).toBeDefined();
    expect(solEntry?.symbol).toBe('SOL');
    expect(solEntry?.protocol).toBe('Native');

    const jitoEntry = getKnownDeFiEntry('J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn');
    expect(jitoEntry).toBeDefined();
    expect(jitoEntry?.symbol).toBe('JitoSOL');
    expect(jitoEntry?.category).toBe('Liquid Staking');
  });

  it('should return undefined for unknown tokens', () => {
    const unknown = getKnownDeFiEntry('UnknownMintAddress123456789');
    expect(unknown).toBeUndefined();
  });
});

describe('classifyUnknownToken', () => {
  it('should score LP tokens correctly', () => {
    const result = classifyUnknownToken('SOL-USDC-LP', 'Orca LP Pool', false);

    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.signals).toContain('lp_in_symbol');
    expect(result.signals).toContain('no_market_price');
    expect(result.signals).toContain('known_protocol_in_name');
  });

  it('should score vault tokens correctly', () => {
    const result = classifyUnknownToken('kUSDC-USDT', 'Kamino Vault Token', false);

    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.signals).toContain('k_prefix');
    expect(result.signals).toContain('no_market_price');
    expect(result.signals).toContain('known_protocol_in_name');
  });

  it('should score pair format tokens', () => {
    const result = classifyUnknownToken('SOL-USDC', 'Some Pool', false);

    expect(result.score).toBeGreaterThanOrEqual(2);
    expect(result.signals).toContain('pair_format');
    expect(result.signals).toContain('no_market_price');
  });

  it('should not score regular tokens with market price', () => {
    const result = classifyUnknownToken('BONK', 'Bonk Token', true);

    // Should have low score since it has a market price
    expect(result.score).toBeLessThan(2);
  });

  it('should handle undefined symbol and name', () => {
    const result = classifyUnknownToken(undefined, undefined, true);

    expect(result.score).toBeDefined();
    expect(result.signals).toBeDefined();
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it('should detect pool/vault keywords', () => {
    const result1 = classifyUnknownToken('TOKEN', 'Marinade Pool Reserve', false);
    expect(result1.signals).toContain('pool_or_vault_in_name');
    expect(result1.signals).toContain('known_protocol_in_name');

    const result2 = classifyUnknownToken('TOKEN', 'Deposit Vault', false);
    expect(result2.signals).toContain('pool_or_vault_in_name');
  });

  it('should detect known protocol names', () => {
    const protocols = ['kamino', 'orca', 'raydium', 'meteora', 'marinade', 'solend'];

    protocols.forEach(protocol => {
      const result = classifyUnknownToken('TOKEN', `${protocol} Token`, false);
      expect(result.signals).toContain('known_protocol_in_name');
    });
  });

  it('should require multiple signals for classification', () => {
    // Only one signal (no market price)
    const result = classifyUnknownToken('TOKEN', 'Random Token', false);
    expect(result.score).toBe(1);
    expect(result.signals).toEqual(['no_market_price']);
  });
});
