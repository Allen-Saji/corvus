import { describe, it, expect } from 'vitest';
import { resolveMint, getSymbolForMint, TOKEN_REGISTRY } from '../../src/data/token-registry';

describe('resolveMint', () => {
  it('should resolve known token symbols to mints', () => {
    expect(resolveMint('SOL')).toBe(TOKEN_REGISTRY.SOL);
    expect(resolveMint('USDC')).toBe(TOKEN_REGISTRY.USDC);
    expect(resolveMint('JITOSOL')).toBe(TOKEN_REGISTRY.JITOSOL);
  });

  it('should be case-insensitive', () => {
    expect(resolveMint('sol')).toBe(TOKEN_REGISTRY.SOL);
    expect(resolveMint('JitoSOL')).toBe(TOKEN_REGISTRY.JITOSOL);
    expect(resolveMint('usdc')).toBe(TOKEN_REGISTRY.USDC);
  });

  it('should return input for unknown symbols (assumed to be mint)', () => {
    const unknownMint = 'UnknownMintAddress123';
    expect(resolveMint(unknownMint)).toBe(unknownMint);
  });

  it('should handle whitespace', () => {
    expect(resolveMint(' SOL ')).toBe(TOKEN_REGISTRY.SOL);
    expect(resolveMint('  USDC  ')).toBe(TOKEN_REGISTRY.USDC);
  });
});

describe('getSymbolForMint', () => {
  it('should return symbol for known mints', () => {
    expect(getSymbolForMint(TOKEN_REGISTRY.SOL)).toBe('SOL');
    expect(getSymbolForMint(TOKEN_REGISTRY.USDC)).toBe('USDC');
    expect(getSymbolForMint(TOKEN_REGISTRY.JITOSOL)).toBe('JITOSOL');
  });

  it('should return undefined for unknown mints', () => {
    expect(getSymbolForMint('UnknownMint123')).toBeUndefined();
  });
});

describe('TOKEN_REGISTRY', () => {
  it('should have all expected tokens', () => {
    const expectedTokens = [
      'SOL', 'USDC', 'USDT',
      'JITOSOL', 'MSOL', 'BSOL', 'JUPSOL', 'STSOL',
      'JUP', 'JTO', 'RAY', 'ORCA', 'MNDE', 'BONK'
    ];

    expectedTokens.forEach(token => {
      expect(TOKEN_REGISTRY[token]).toBeDefined();
      expect(typeof TOKEN_REGISTRY[token]).toBe('string');
      expect(TOKEN_REGISTRY[token].length).toBeGreaterThan(32);
    });
  });
});
