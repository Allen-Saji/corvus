/**
 * Tool Converter
 *
 * Converts Corvus tools to different LLM provider formats
 */

import { Tool } from './types.js';

/**
 * Get all Corvus tools in standard format
 */
export function getCorvusTools(): Tool[] {
  return [
    {
      name: 'get_sol_balance',
      description: 'Get the SOL balance of a Solana wallet address. Returns the balance in SOL and its current USD value.',
      input_schema: {
        type: 'object',
        properties: {
          wallet: {
            type: 'string',
            description: 'Base58 Solana wallet address (32-44 characters)',
          },
        },
        required: ['wallet'],
      },
    },
    {
      name: 'get_token_balances',
      description: 'Get ALL token holdings for a Solana wallet address. Returns every SPL token the wallet holds with mint address, symbol, name, balance, and USD value.',
      input_schema: {
        type: 'object',
        properties: {
          wallet: {
            type: 'string',
            description: 'Base58 Solana wallet address (32-44 characters)',
          },
        },
        required: ['wallet'],
      },
    },
    {
      name: 'get_token_price',
      description: 'Get current prices for one or more Solana tokens. Accepts token symbols (SOL, USDC, JitoSOL, etc.) or mint addresses.',
      input_schema: {
        type: 'object',
        properties: {
          tokens: {
            type: 'string',
            description: 'Comma-separated list of token symbols or mint addresses (e.g., "SOL,USDC,JitoSOL")',
          },
        },
        required: ['tokens'],
      },
    },
    {
      name: 'get_recent_transactions',
      description: 'Get recent transaction history for a Solana wallet. Returns parsed transactions with human-readable descriptions.',
      input_schema: {
        type: 'object',
        properties: {
          wallet: {
            type: 'string',
            description: 'Base58 Solana wallet address',
          },
          limit: {
            type: 'number',
            description: 'Number of transactions to return (default 10, max 50)',
          },
        },
        required: ['wallet'],
      },
    },
    {
      name: 'get_protocol_tvl',
      description: 'Get detailed TVL and metrics for a specific Solana DeFi protocol.',
      input_schema: {
        type: 'object',
        properties: {
          protocol: {
            type: 'string',
            description: 'Protocol name (e.g., "kamino", "jito", "marinade", "raydium")',
          },
        },
        required: ['protocol'],
      },
    },
    {
      name: 'get_top_solana_protocols',
      description: 'Get the top Solana DeFi protocols ranked by Total Value Locked.',
      input_schema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of protocols to return (default 10, max 50)',
          },
          category: {
            type: 'string',
            description: 'Optional filter: "Lending", "DEX", "Liquid Staking", "Yield", "CDP"',
          },
        },
      },
    },
    {
      name: 'analyze_wallet_defi_positions',
      description: 'Analyze a Solana wallet\'s DeFi positions in depth. Identifies staking positions, lending deposits, LP tokens, and idle assets.',
      input_schema: {
        type: 'object',
        properties: {
          wallet: {
            type: 'string',
            description: 'Base58 Solana wallet address (32-44 characters)',
          },
        },
        required: ['wallet'],
      },
    },
    {
      name: 'send_telegram_alert',
      description: 'Send a formatted message to a Telegram chat. Use only when user explicitly requests alerts.',
      input_schema: {
        type: 'object',
        properties: {
          chat_id: {
            type: 'string',
            description: 'Telegram chat ID (numeric ID or @username)',
          },
          message: {
            type: 'string',
            description: 'Message content (supports Markdown formatting)',
          },
          severity: {
            type: 'string',
            enum: ['info', 'warning', 'critical'],
            description: 'Message severity level (default: info)',
          },
        },
        required: ['chat_id', 'message'],
      },
    },
  ];
}

/**
 * Convert to OpenAI function format
 */
export function toOpenAITools(tools: Tool[]): any[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}

/**
 * Convert to Anthropic tool format
 */
export function toAnthropicTools(tools: Tool[]): any[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));
}

/**
 * Convert to Google (Gemini) function format
 */
export function toGoogleTools(tools: Tool[]): any[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema,
  }));
}
