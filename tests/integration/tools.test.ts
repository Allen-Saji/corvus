import { describe, it, expect, beforeAll } from 'vitest';
import { config } from 'dotenv';

// Load environment variables for integration tests
beforeAll(() => {
  config();
});

describe('Integration Tests - Tool Responses', () => {
  it('should have required environment variables', () => {
    expect(process.env.HELIUS_API_KEY).toBeDefined();
    expect(process.env.HELIUS_API_KEY).not.toBe('');
  });

  describe('Error Handling', () => {
    it('should handle invalid wallet addresses gracefully', async () => {
      const { getSOLBalanceTool } = await import('../../src/tools/balance');

      const result = await getSOLBalanceTool('invalid');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed._meta).toBeDefined();
      expect(parsed._meta.tool).toBe('get_sol_balance');
    });

    it('should handle empty token list in price tool', async () => {
      const { getTokenPriceTool } = await import('../../src/tools/price');

      const result = await getTokenPriceTool('');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('No tokens provided');
    });

    it('should enforce token limit in price tool', async () => {
      const { getTokenPriceTool } = await import('../../src/tools/price');

      // Create 51 tokens (exceeds max of 50)
      const manyTokens = Array(51).fill('SOL').join(',');
      const result = await getTokenPriceTool(manyTokens);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('Maximum 50 tokens');
    });

    it('should validate Telegram message length', async () => {
      const { sendTelegramAlertTool } = await import('../../src/tools/telegram');

      const longMessage = 'a'.repeat(4100);
      const result = await sendTelegramAlertTool('123', longMessage);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('4096 character limit');
    });

    it('should require TELEGRAM_BOT_TOKEN for alerts', async () => {
      const { sendTelegramAlertTool } = await import('../../src/tools/telegram');

      // Temporarily remove token
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;

      const result = await sendTelegramAlertTool('123', 'test');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain('TELEGRAM_BOT_TOKEN');

      // Restore token
      if (originalToken) process.env.TELEGRAM_BOT_TOKEN = originalToken;
    });
  });

  describe('Response Structure', () => {
    it('should return consistent error format', async () => {
      const { getSOLBalanceTool } = await import('../../src/tools/balance');

      const result = await getSOLBalanceTool('invalid');
      const parsed = JSON.parse(result);

      // Check error response structure
      expect(parsed).toHaveProperty('error');
      expect(parsed).toHaveProperty('_meta');
      expect(parsed._meta).toHaveProperty('tool');
      expect(parsed._meta).toHaveProperty('timestamp');

      // Validate timestamp format
      expect(() => new Date(parsed._meta.timestamp)).not.toThrow();
    });

    it('should include _meta in all tool responses', async () => {
      const { getTokenPriceTool } = await import('../../src/tools/price');

      const result = await getTokenPriceTool('SOL');
      const parsed = JSON.parse(result);

      expect(parsed._meta).toBeDefined();
      expect(parsed._meta.data_source).toBeDefined();
      expect(parsed._meta.timestamp).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should handle numeric edge cases in DeFi analysis', async () => {
      const { analyzeWalletDeFiPositionsTool } = await import('../../src/tools/defi-positions');

      // Test with a valid but likely empty wallet
      const emptyWallet = '11111111111111111111111111111111';
      const result = await analyzeWalletDeFiPositionsTool(emptyWallet);
      const parsed = JSON.parse(result);

      // Should handle gracefully even if wallet has no tokens
      expect(parsed.summary || parsed.error).toBeDefined();

      if (parsed.summary) {
        // Validate numeric fields are valid numbers
        expect(typeof parsed.summary.total_known_value_usd).toBe('number');
        expect(isNaN(parsed.summary.total_known_value_usd)).toBe(false);
        expect(isFinite(parsed.summary.total_known_value_usd)).toBe(true);
      }
    });
  });
});
