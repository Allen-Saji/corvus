import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock all tool imports
vi.mock('../../src/tools/balance', () => ({
  getSOLBalanceTool: vi.fn(),
}));
vi.mock('../../src/tools/tokens', () => ({
  getTokenBalancesTool: vi.fn(),
}));
vi.mock('../../src/tools/price', () => ({
  getTokenPriceTool: vi.fn(),
}));
vi.mock('../../src/tools/transactions', () => ({
  getRecentTransactionsTool: vi.fn(),
}));
vi.mock('../../src/tools/protocol', () => ({
  getProtocolTVLTool: vi.fn(),
  getTopProtocolsTool: vi.fn(),
}));
vi.mock('../../src/tools/defi-positions', () => ({
  analyzeWalletDeFiPositionsTool: vi.fn(),
}));
vi.mock('../../src/tools/telegram', () => ({
  sendTelegramAlertTool: vi.fn(),
}));

// Mock the MCP SDK to capture handlers
let capturedListToolsHandler: any;
let capturedCallToolHandler: any;

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: (schema: string, handler: any) => {
      if (schema === 'ListToolsRequestSchema') {
        capturedListToolsHandler = handler;
      } else if (schema === 'CallToolRequestSchema') {
        capturedCallToolHandler = handler;
      }
    },
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
}));

// Import the server once to trigger setup
await import('../../src/index.js');

describe('MCP Server', () => {
  describe('ListTools Handler', () => {
    it('should return all 8 tools', async () => {
      const result = await capturedListToolsHandler();

      expect(result.tools).toBeDefined();
      expect(result.tools).toHaveLength(8);

      const toolNames = result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('get_sol_balance');
      expect(toolNames).toContain('get_token_balances');
      expect(toolNames).toContain('get_token_price');
      expect(toolNames).toContain('get_recent_transactions');
      expect(toolNames).toContain('get_protocol_tvl');
      expect(toolNames).toContain('get_top_solana_protocols');
      expect(toolNames).toContain('analyze_wallet_defi_positions');
      expect(toolNames).toContain('send_telegram_alert');
    });

    it('should have valid schemas for all tools', async () => {
      const result = await capturedListToolsHandler();

      result.tools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should have required wallet parameter for wallet-based tools', async () => {
      const result = await capturedListToolsHandler();

      const walletTools = ['get_sol_balance', 'get_token_balances', 'get_recent_transactions', 'analyze_wallet_defi_positions'];

      walletTools.forEach(toolName => {
        const tool = result.tools.find((t: any) => t.name === toolName);
        expect(tool.inputSchema.properties.wallet).toBeDefined();
        expect(tool.inputSchema.required).toContain('wallet');
      });
    });

    it('should have telegram tool with correct severity enum', async () => {
      const result = await capturedListToolsHandler();
      const tool = result.tools.find((t: any) => t.name === 'send_telegram_alert');

      expect(tool.inputSchema.properties.severity.enum).toEqual(['info', 'warning', 'critical']);
    });
  });

  describe('CallTool Handler', () => {
    beforeAll(() => {
      vi.clearAllMocks();
    });

    it('should execute get_sol_balance tool', async () => {
      const { getSOLBalanceTool } = await import('../../src/tools/balance');
      vi.mocked(getSOLBalanceTool).mockResolvedValueOnce(JSON.stringify({ balance_sol: 5.5 }));

      const request = {
        params: {
          name: 'get_sol_balance',
          arguments: { wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
        },
      };

      const result = await capturedCallToolHandler(request);

      expect(getSOLBalanceTool).toHaveBeenCalledWith('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
    });

    it('should execute all 8 tools correctly', async () => {
      const tools = await import('../../src/tools/balance');
      const { getTokenBalancesTool } = await import('../../src/tools/tokens');
      const { getTokenPriceTool } = await import('../../src/tools/price');
      const { getRecentTransactionsTool } = await import('../../src/tools/transactions');
      const { getProtocolTVLTool, getTopProtocolsTool } = await import('../../src/tools/protocol');
      const { analyzeWalletDeFiPositionsTool } = await import('../../src/tools/defi-positions');
      const { sendTelegramAlertTool } = await import('../../src/tools/telegram');

      // Test each tool
      const testCases = [
        { name: 'get_sol_balance', mock: tools.getSOLBalanceTool, args: { wallet: 'addr' } },
        { name: 'get_token_balances', mock: getTokenBalancesTool, args: { wallet: 'addr' } },
        { name: 'get_token_price', mock: getTokenPriceTool, args: { tokens: 'SOL' } },
        { name: 'get_recent_transactions', mock: getRecentTransactionsTool, args: { wallet: 'addr' } },
        { name: 'get_protocol_tvl', mock: getProtocolTVLTool, args: { protocol: 'kamino' } },
        { name: 'get_top_solana_protocols', mock: getTopProtocolsTool, args: {} },
        { name: 'analyze_wallet_defi_positions', mock: analyzeWalletDeFiPositionsTool, args: { wallet: 'addr' } },
        { name: 'send_telegram_alert', mock: sendTelegramAlertTool, args: { chat_id: '123', message: 'test' } },
      ];

      for (const testCase of testCases) {
        vi.mocked(testCase.mock).mockResolvedValueOnce('{}');

        const result = await capturedCallToolHandler({
          params: { name: testCase.name, arguments: testCase.args },
        });

        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('text');
      }
    });

    it('should handle unknown tool name', async () => {
      const result = await capturedCallToolHandler({
        params: { name: 'unknown_tool', arguments: {} },
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain('Unknown tool');
      expect(result.isError).toBe(true);
    });

    it('should handle missing arguments gracefully', async () => {
      const { getSOLBalanceTool } = await import('../../src/tools/balance');
      vi.mocked(getSOLBalanceTool).mockResolvedValueOnce('{}');

      const result = await capturedCallToolHandler({
        params: { name: 'get_sol_balance', arguments: {} },
      });

      expect(getSOLBalanceTool).toHaveBeenCalledWith('');
    });

    it('should convert parameters to correct types', async () => {
      const { getRecentTransactionsTool } = await import('../../src/tools/transactions');
      vi.mocked(getRecentTransactionsTool).mockResolvedValueOnce('{}');

      await capturedCallToolHandler({
        params: {
          name: 'get_recent_transactions',
          arguments: { wallet: 'addr', limit: '10' },
        },
      });

      expect(getRecentTransactionsTool).toHaveBeenCalledWith('addr', 10);
    });
  });

  describe('Error Handling', () => {
    it('should sanitize ECONNREFUSED errors', async () => {
      const { getSOLBalanceTool } = await import('../../src/tools/balance');
      const error = new Error('Connection refused');
      (error as any).code = 'ECONNREFUSED';
      vi.mocked(getSOLBalanceTool).mockRejectedValueOnce(error);

      const result = await capturedCallToolHandler({
        params: { name: 'get_sol_balance', arguments: { wallet: 'addr' } },
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('External service unavailable');
      expect(parsed.error).not.toContain('ECONNREFUSED');
      expect(result.isError).toBe(true);
    });

    it('should sanitize HELIUS errors', async () => {
      const { getSOLBalanceTool } = await import('../../src/tools/balance');
      vi.mocked(getSOLBalanceTool).mockRejectedValueOnce(new Error('HELIUS API failed'));

      const result = await capturedCallToolHandler({
        params: { name: 'get_sol_balance', arguments: { wallet: 'addr' } },
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('API service error');
      expect(result.isError).toBe(true);
    });

    it('should sanitize generic errors', async () => {
      const { getSOLBalanceTool } = await import('../../src/tools/balance');
      vi.mocked(getSOLBalanceTool).mockRejectedValueOnce(new Error('Internal error'));

      const result = await capturedCallToolHandler({
        params: { name: 'get_sol_balance', arguments: { wallet: 'addr' } },
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('Tool execution failed');
      expect(parsed._meta.tool).toBe('get_sol_balance');
      expect(parsed._meta.timestamp).toBeDefined();
      expect(result.isError).toBe(true);
    });
  });
});
