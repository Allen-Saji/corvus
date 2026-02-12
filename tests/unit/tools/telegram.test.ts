import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendTelegramAlertTool } from '../../../src/tools/telegram';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

const mockFetch = vi.mocked((await import('node-fetch')).default);

describe('sendTelegramAlertTool', () => {
  const originalEnv = process.env.TELEGRAM_BOT_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token-123';
  });

  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalEnv;
  });

  it('should send info alert successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          message_id: 123,
          chat: { id: 456 },
          date: 1705000000,
        },
      }),
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test message', 'info');
    const parsed = JSON.parse(result);

    expect(parsed.success).toBe(true);
    expect(parsed.message_id).toBe(123);
    expect(parsed.chat_id).toBe(456);
    expect(parsed.sent_at).toBeDefined();
    expect(parsed._meta.severity).toBe('info');
  });

  it('should send warning alert with proper emoji', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          message_id: 123,
          chat: { id: 456 },
          date: 1705000000,
        },
      }),
    } as any);

    await sendTelegramAlertTool('123456789', 'Warning message', 'warning');

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);

    expect(body.text).toContain('⚠️');
    expect(body.text).toContain('WARNING');
  });

  it('should send critical alert with proper emoji', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          message_id: 123,
          chat: { id: 456 },
          date: 1705000000,
        },
      }),
    } as any);

    await sendTelegramAlertTool('123456789', 'Critical alert', 'critical');

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);

    expect(body.text).toContain('🚨');
    expect(body.text).toContain('CRITICAL');
  });

  it('should escape Markdown special characters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          message_id: 123,
          chat: { id: 456 },
        },
      }),
    } as any);

    await sendTelegramAlertTool('123456789', 'Test *bold* _italic_ text\\', 'info');

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);

    expect(body.text).toContain('\\*bold\\*');
    expect(body.text).toContain('\\_italic\\_');
    expect(body.text).toContain('\\\\');
  });

  it('should handle numeric chat IDs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeUndefined();
  });

  it('should handle negative chat IDs (groups)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    const result = await sendTelegramAlertTool('-123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeUndefined();
  });

  it('should handle username chat IDs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    const result = await sendTelegramAlertTool('@username', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeUndefined();
  });

  it('should validate chat ID format', async () => {
    const result = await sendTelegramAlertTool('invalid-chat', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed._meta.tool).toBe('send_telegram_alert');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should reject empty chat ID', async () => {
    const result = await sendTelegramAlertTool('', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
  });

  it('should reject empty message', async () => {
    const result = await sendTelegramAlertTool('123456789', '');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('No message provided');
  });

  it('should reject whitespace-only message', async () => {
    const result = await sendTelegramAlertTool('123456789', '   ');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('No message provided');
  });

  it('should enforce 4096 character limit', async () => {
    const longMessage = 'a'.repeat(4100);
    const result = await sendTelegramAlertTool('123456789', longMessage);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('4096 character limit');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should allow messages up to 4000 characters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    const message = 'a'.repeat(4000);
    const result = await sendTelegramAlertTool('123456789', message);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeUndefined();
    expect(parsed.success).toBe(true);
  });

  it('should require TELEGRAM_BOT_TOKEN', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('TELEGRAM_BOT_TOKEN');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle Telegram API HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        ok: false,
        description: 'Chat not found',
        error_code: 400,
      }),
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Chat not found');
    expect(parsed._meta.telegram_error_code).toBe(400);
  });

  it('should handle Telegram API error without description', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Telegram API error');
  });

  it('should handle invalid JSON in error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('HTTP 500');
  });

  it('should handle network timeout', async () => {
    mockFetch.mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject({ name: 'AbortError' }), 10);
      });
    });

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('timed out after 5 seconds');
  });

  it('should handle connection refused', async () => {
    const error = new Error('Connection refused');
    (error as any).code = 'ECONNREFUSED';
    mockFetch.mockRejectedValueOnce(error);

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Cannot connect to Telegram API');
    expect(parsed.error).not.toContain('ECONNREFUSED');
  });

  it('should handle other network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Failed to send');
  });

  it('should validate response structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: null, // Invalid - no result
      }),
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Invalid response');
  });

  it('should send with parse_mode Markdown', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    await sendTelegramAlertTool('123456789', 'Test');

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);

    expect(body.parse_mode).toBe('Markdown');
  });

  it('should include proper metadata', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test');
    const parsed = JSON.parse(result);

    expect(parsed._meta).toBeDefined();
    expect(parsed._meta.tool).toBe('send_telegram_alert');
    expect(parsed._meta.timestamp).toBeDefined();
    expect(parsed._meta.data_source).toBe('Telegram Bot API');
  });

  it('should reject invalid severity level', async () => {
    const result = await sendTelegramAlertTool('123456789', 'Test', 'invalid' as any);
    const parsed = JSON.parse(result);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('Invalid severity');
  });

  it('should trim message whitespace', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    await sendTelegramAlertTool('123456789', '  Test message  ');

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1]?.body as string);

    expect(body.text).toContain('Test message');
    expect(body.text).not.toMatch(/^\s+/);
  });

  it('should return properly formatted JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        result: { message_id: 123 },
      }),
    } as any);

    const result = await sendTelegramAlertTool('123456789', 'Test');

    expect(() => JSON.parse(result)).not.toThrow();
    expect(result).toContain('\n');
  });
});
