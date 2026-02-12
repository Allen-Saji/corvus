#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import tool handlers
import { getSOLBalanceTool } from "./tools/balance.js";
import { getTokenBalancesTool } from "./tools/tokens.js";
import { getTokenPriceTool } from "./tools/price.js";
import { getRecentTransactionsTool } from "./tools/transactions.js";
import { getProtocolTVLTool, getTopProtocolsTool } from "./tools/protocol.js";
import { analyzeWalletDeFiPositionsTool } from "./tools/defi-positions.js";
import { sendTelegramAlertTool } from "./tools/telegram.js";

/**
 * Corvus MCP Server
 * Solana DeFi Intelligence via Model Context Protocol
 */

const server = new Server(
  {
    name: "corvus",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_sol_balance",
        description:
          "Get the SOL balance of a Solana wallet address. Returns the balance in SOL and its current USD value. Use this when the user asks specifically about SOL balance, not other tokens.",
        inputSchema: {
          type: "object",
          properties: {
            wallet: {
              type: "string",
              description: "Base58 Solana wallet address (32-44 characters)",
            },
          },
          required: ["wallet"],
        },
      },
      {
        name: "get_token_balances",
        description:
          "Get ALL token holdings for a Solana wallet address. Returns every SPL token the wallet holds with mint address, symbol, name, balance, and USD value where available. Use this when the user asks what tokens a wallet holds or wants a general overview of wallet contents.",
        inputSchema: {
          type: "object",
          properties: {
            wallet: {
              type: "string",
              description: "Base58 Solana wallet address (32-44 characters)",
            },
          },
          required: ["wallet"],
        },
      },
      {
        name: "get_token_price",
        description:
          "Get current prices for one or more Solana tokens. Accepts token symbols (SOL, USDC, JitoSOL, etc.) or mint addresses. Returns price in USD with confidence score. Use this for spot price checks.",
        inputSchema: {
          type: "object",
          properties: {
            tokens: {
              type: "string",
              description:
                "Comma-separated list of token symbols or mint addresses (e.g., 'SOL,USDC,JitoSOL' or mint addresses)",
            },
          },
          required: ["tokens"],
        },
      },
      {
        name: "get_recent_transactions",
        description:
          "Get recent transaction history for a Solana wallet. Returns parsed transactions with human-readable descriptions, timestamps, and token transfer details. Note: USD values shown are current prices, not prices at time of transaction.",
        inputSchema: {
          type: "object",
          properties: {
            wallet: {
              type: "string",
              description: "Base58 Solana wallet address",
            },
            limit: {
              type: "number",
              description: "Number of transactions to return (default 10, max 50)",
            },
          },
          required: ["wallet"],
        },
      },
      {
        name: "get_protocol_tvl",
        description:
          "Get detailed TVL and metrics for a specific Solana DeFi protocol. Returns current TVL, TVL by chain, category, and recent changes. Use this when the user asks about a specific protocol's health or TVL.",
        inputSchema: {
          type: "object",
          properties: {
            protocol: {
              type: "string",
              description: "Protocol name (e.g., 'kamino', 'jito', 'marinade', 'raydium')",
            },
          },
          required: ["protocol"],
        },
      },
      {
        name: "get_top_solana_protocols",
        description:
          "Get the top Solana DeFi protocols ranked by Total Value Locked. Returns protocol name, TVL, category, and percentage changes. Use this when the user asks about the overall Solana DeFi landscape or wants to compare protocols.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of protocols to return (default 10, max 50)",
            },
            category: {
              type: "string",
              description: "Optional filter: 'Lending', 'DEX', 'Liquid Staking', 'Yield', 'CDP'",
            },
          },
        },
      },
      {
        name: "analyze_wallet_defi_positions",
        description:
          "Analyze a Solana wallet's DeFi positions in depth. Identifies staking positions, lending deposits, LP tokens, and idle assets. Categorizes each position by protocol and type, calculates USD values, and flags tokens it cannot classify. This is the most comprehensive wallet analysis tool - use it when the user wants to understand their DeFi exposure, portfolio breakdown, or position details.",
        inputSchema: {
          type: "object",
          properties: {
            wallet: {
              type: "string",
              description: "Base58 Solana wallet address (32-44 characters)",
            },
          },
          required: ["wallet"],
        },
      },
      {
        name: "send_telegram_alert",
        description:
          "Send a formatted message to a Telegram chat. Use this when the user explicitly asks to send information to Telegram, get an alert, or be notified. Requires the user's Telegram chat ID.",
        inputSchema: {
          type: "object",
          properties: {
            chat_id: {
              type: "string",
              description: "Telegram chat ID (numeric ID or @username)",
            },
            message: {
              type: "string",
              description: "Message content (supports Markdown formatting)",
            },
            severity: {
              type: "string",
              enum: ["info", "warning", "critical"],
              description:
                "Message severity level - affects emoji prefix (default: info)",
            },
          },
          required: ["chat_id", "message"],
        },
      },
    ],
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_sol_balance": {
        const wallet = String(args?.wallet || "");
        const result = await getSOLBalanceTool(wallet);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_token_balances": {
        const wallet = String(args?.wallet || "");
        const result = await getTokenBalancesTool(wallet);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_token_price": {
        const tokens = String(args?.tokens || "");
        const result = await getTokenPriceTool(tokens);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_recent_transactions": {
        const wallet = String(args?.wallet || "");
        const limit = args?.limit ? Number(args.limit) : undefined;
        const result = await getRecentTransactionsTool(wallet, limit);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_protocol_tvl": {
        const protocol = String(args?.protocol || "");
        const result = await getProtocolTVLTool(protocol);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "get_top_solana_protocols": {
        const limit = args?.limit ? Number(args.limit) : undefined;
        const category = args?.category ? String(args.category) : undefined;
        const result = await getTopProtocolsTool(limit, category);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "analyze_wallet_defi_positions": {
        const wallet = String(args?.wallet || "");
        const result = await analyzeWalletDeFiPositionsTool(wallet);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      case "send_telegram_alert": {
        const chat_id = String(args?.chat_id || "");
        const message = String(args?.message || "");
        const severity = (args?.severity as "info" | "warning" | "critical") || "info";
        const result = await sendTelegramAlertTool(chat_id, message, severity);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Unknown tool: ${name}`,
              }),
            },
          ],
          isError: true,
        };
    }
  } catch (error: any) {
    // Sanitize error messages - don't expose internal details
    const sanitizedError = error.code === "ECONNREFUSED"
      ? "External service unavailable"
      : error.message?.includes("HELIUS")
      ? "API service error"
      : "Tool execution failed";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: sanitizedError,
            _meta: {
              tool: name,
              timestamp: new Date().toISOString(),
            },
          }),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Corvus MCP Server running on stdio");
  // Removed API key logging for security
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
