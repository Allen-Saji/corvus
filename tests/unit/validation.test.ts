import { describe, it, expect } from 'vitest';
import { validateSolanaAddress, validatePositiveInteger, validateTelegramChatId } from '../../src/lib/validation';

describe('validateSolanaAddress', () => {
  it('should accept valid Solana addresses', () => {
    const validAddresses = [
      'So11111111111111111111111111111111111111112', // SOL mint
      '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // Random valid address
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
    ];

    validAddresses.forEach(addr => {
      const result = validateSolanaAddress(addr);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject invalid addresses', () => {
    const invalidAddresses = [
      '', // Empty
      '   ', // Whitespace only
      'short', // Too short
      '0OIl' + 'a'.repeat(40), // Contains invalid base58 chars (0, O, I, l)
      'x'.repeat(100), // Too long
    ];

    invalidAddresses.forEach(addr => {
      const result = validateSolanaAddress(addr);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  it('should handle null/undefined input', () => {
    const result1 = validateSolanaAddress(null as any);
    expect(result1.valid).toBe(false);

    const result2 = validateSolanaAddress(undefined as any);
    expect(result2.valid).toBe(false);
  });
});

describe('validatePositiveInteger', () => {
  it('should accept valid positive integers', () => {
    expect(validatePositiveInteger(1, 'test').valid).toBe(true);
    expect(validatePositiveInteger(100, 'test').valid).toBe(true);
    expect(validatePositiveInteger('50', 'test').valid).toBe(true);
  });

  it('should reject negative numbers and zero', () => {
    expect(validatePositiveInteger(0, 'test').valid).toBe(false);
    expect(validatePositiveInteger(-1, 'test').valid).toBe(false);
    expect(validatePositiveInteger(-100, 'test').valid).toBe(false);
  });

  it('should reject non-numeric values', () => {
    expect(validatePositiveInteger('abc', 'test').valid).toBe(false);
    expect(validatePositiveInteger(NaN, 'test').valid).toBe(false);
  });

  it('should enforce max limits', () => {
    expect(validatePositiveInteger(50, 'test', 100).valid).toBe(true);
    expect(validatePositiveInteger(150, 'test', 100).valid).toBe(false);
  });

  it('should allow optional parameters', () => {
    expect(validatePositiveInteger(undefined, 'test').valid).toBe(true);
    expect(validatePositiveInteger(null, 'test').valid).toBe(true);
  });
});

describe('validateTelegramChatId', () => {
  it('should accept valid chat IDs', () => {
    expect(validateTelegramChatId('123456789').valid).toBe(true);
    expect(validateTelegramChatId('-123456789').valid).toBe(true); // Group IDs are negative
    expect(validateTelegramChatId('@username').valid).toBe(true);
  });

  it('should reject invalid chat IDs', () => {
    expect(validateTelegramChatId('').valid).toBe(false);
    expect(validateTelegramChatId('   ').valid).toBe(false);
    expect(validateTelegramChatId('abc123').valid).toBe(false); // Not numeric, not @username
  });

  it('should handle null/undefined input', () => {
    expect(validateTelegramChatId(null as any).valid).toBe(false);
    expect(validateTelegramChatId(undefined as any).valid).toBe(false);
  });
});
