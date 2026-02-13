# Archestra Configuration

This directory contains the Archestra workspace configuration for running Corvus as an MCP server.

## What is Archestra?

Archestra is an orchestration tool for managing multiple MCP (Model Context Protocol) servers. It allows AI assistants like Claude to access multiple tools and services through a unified interface.

## Setup

### 1. Install Archestra

```bash
npm install -g @modelcontextprotocol/archestra
```

### 2. Configure Environment Variables

Make sure you have a `.env` file in the project root with your API keys:

```bash
HELIUS_API_KEY=your_helius_api_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional: for AI chat
GROQ_API_KEY=your_groq_key            # Optional: for AI chat
TELEGRAM_BOT_TOKEN=your_bot_token     # Optional: for alerts
```

### 3. Build the Project

```bash
npm run build
```

### 4. Start Corvus via Archestra

```bash
# From the project root
archestra start archestra/workspace.json
```

Or if you're in the archestra directory:

```bash
archestra start workspace.json
```

## Usage with Claude Desktop

### Option 1: Direct Integration (Recommended)

Add to your Claude Desktop config (`~/.config/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "corvus": {
      "command": "node",
      "args": ["/absolute/path/to/corvus/dist/index.js"],
      "env": {
        "HELIUS_API_KEY": "your_helius_api_key"
      }
    }
  }
}
```

### Option 2: Via Archestra

```json
{
  "mcpServers": {
    "corvus-workspace": {
      "command": "archestra",
      "args": ["start", "/absolute/path/to/corvus/archestra/workspace.json"]
    }
  }
}
```

## Available Tools

Once running, Claude will have access to these Corvus tools:

- `get_sol_balance` - Check SOL balance
- `get_token_balances` - List all token holdings
- `get_token_price` - Get real-time token prices
- `get_recent_transactions` - View transaction history
- `analyze_wallet_defi_positions` - In-depth DeFi analysis
- `get_protocol_tvl` - Query protocol metrics
- `get_top_protocols` - List top DeFi protocols
- `send_telegram_alert` - Send Telegram notifications

## Troubleshooting

### "Cannot find module" error

Make sure you've run `npm run build` first to generate the `dist/` directory.

### "HELIUS_API_KEY not found" error

Set the `HELIUS_API_KEY` environment variable in your `.env` file or pass it directly in the Archestra config.

### Check if MCP server is running

```bash
# Test the MCP server directly
node dist/index.js
```

You should see: `Corvus MCP Server running on stdio`

## More Information

- [MCP Documentation](https://modelcontextprotocol.io)
- [Archestra Documentation](https://github.com/modelcontextprotocol/archestra)
- [Corvus Main README](../README.md)
