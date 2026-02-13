# Corvus

**Solana DeFi Intelligence — Dual Interface (MCP Server + CLI)**

Natural language interface for querying wallets, DeFi positions, protocol metrics, and token prices on Solana blockchain.

**Two Deployment Modes:**
- 🤖 **MCP Server**: Integrate with Archestra/Claude Desktop for AI-powered analysis
- ⚡ **CLI Tool**: Standalone terminal commands for direct queries

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Archestra Platform Deployment (Recommended)](#archestra-platform-deployment-recommended)
  - [Docker Deployment](#docker-deployment)
  - [Claude Desktop Integration](#claude-desktop-integration)
  - [CLI Mode (Terminal)](#cli-mode-terminal)
- [Available Tools](#available-tools)
- [Architecture](#architecture)
- [Testing](#testing)
- [Example Usage](#example-usage)
- [Security](#security)
- [Data Sources](#data-sources)
- [The Differentiator: 3-Bucket Classification](#the-differentiator-3-bucket-classification)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Contact](#contact)

---

## Features

### Wallet Intelligence
- **SOL Balance**: Get native SOL balance with real-time USD valuation
- **Token Holdings**: Complete SPL token portfolio with prices and values
- **Transaction History**: Human-readable transaction descriptions (powered by Helius Enhanced Transactions)

### DeFi Market Data
- **Token Pricing**: Batch price lookups for up to 50 tokens (symbols or mint addresses)
- **Protocol TVL**: Detailed Total Value Locked metrics for 358+ Solana protocols
- **Protocol Rankings**: Top protocols by TVL with category filtering

### Advanced Analytics (The Differentiator)
- **DeFi Position Analysis**: Intelligent 3-bucket classification system
  - **Known DeFi**: Registry-based identification (jupSOL, mSOL, JLP, etc.)
  - **Likely DeFi**: Heuristic detection (LP tokens, vault tokens, protocol patterns)
  - **Unclassified**: Regular tokens and assets
- **Dust Filtering**: Automatically filters tokens < $1 USD or < 0.01 balance
- **Telegram Alerts**: Send formatted notifications with severity levels

---

## Quick Start

### Prerequisites
- Node.js 18+
- [Helius API key](https://dashboard.helius.dev) (free tier: 100k credits/day)
- Optional: Telegram Bot Token (for alerts)

### Installation

```bash
# Clone repository
git clone https://github.com/Allen-Saji/corvus.git
cd corvus

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your HELIUS_API_KEY

# Build
npm run build

# Run
npm start
```

### Archestra Platform Deployment (Recommended)

1. Navigate to **MCP Registry** in Archestra UI
2. Click **"Self-hosted (orchestrated by Archestra in K8s)"**
3. Fill in the form:
   - **Name**: `Corvus`
   - **Command**: `node`
   - **Docker Image**: `corvus-mcp:latest`
   - **Arguments**: `dist/index.js`
   - **Environment Variables**:
     - `HELIUS_API_KEY`: Your Helius API key
     - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (optional)
4. Click **"Add Server"**
5. Assign to an Agent and test via Chat UI

### Docker Deployment

```bash
# Build Docker image
docker build -t corvus-mcp:latest .

# Run with environment variables
docker run -d \
  -e HELIUS_API_KEY=your-key \
  -e TELEGRAM_BOT_TOKEN=your-token \
  corvus-mcp:latest
```

### Claude Desktop Integration

**Note:** This configuration follows standard MCP server patterns but has not been tested with Claude Desktop.

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "corvus": {
      "command": "node",
      "args": ["/path/to/corvus/dist/index.js"],
      "env": {
        "HELIUS_API_KEY": "your-helius-api-key",
        "TELEGRAM_BOT_TOKEN": "your-telegram-token"
      }
    }
  }
}
```

### CLI Mode (Terminal)

Corvus can also run as a standalone command-line tool for direct wallet and DeFi analysis.

#### Global Installation

```bash
# Install globally
npm install -g .

# Or use npm link for development
npm link
```

#### CLI Commands

**Direct Commands (No AI required):**
```bash
# Get SOL balance
corvus balance <wallet>

# Get all token holdings
corvus tokens <wallet>

# Get token prices (comma-separated)
corvus price SOL,USDC,JitoSOL

# Get recent transactions
corvus tx <wallet> --limit 20

# Analyze DeFi positions
corvus analyze <wallet>

# Get protocol TVL
corvus protocol jito

# Get top protocols
corvus top --limit 10 --category "Liquid Staking"

# Send Telegram alert
corvus alert <chat_id> "Alert message" --severity warning

# Output raw JSON for any command
corvus balance <wallet> --json
```

**Agentic Chat Mode (AI-powered):**
```bash
# Start interactive AI chat (auto-detects available provider)
corvus chat

# Use specific provider
corvus chat --provider anthropic
corvus chat --provider openai
corvus chat --provider google

# Use local LLM (free, private)
corvus chat --local

# Example conversation:
You: What are my DeFi positions in wallet 7xKXtg...?
Corvus: [AI analyzes wallet and presents results]

You: Now show me the top 5 lending protocols
Corvus: [AI fetches and displays top lending protocols]
```

#### Examples

```bash
# Check your wallet balance
corvus balance 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# Analyze DeFi positions with pretty formatting
corvus analyze 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# Get current SOL and USDC prices
corvus price SOL,USDC

# View top 5 lending protocols
corvus top --limit 5 --category Lending

# Get last 25 transactions
corvus tx <wallet> --limit 25

# Pipe to other tools using --json flag
corvus balance <wallet> --json | jq '.balance_sol'
```

**CLI Features:**
- 🎨 Colored terminal output for better readability
- 📊 Formatted tables for structured data
- 🔁 `--json` flag for raw JSON output (scripting-friendly)
- ⚡ Direct access to all Corvus tools
- 🛠️ Cross-platform (Linux, macOS, Windows)
- 🤖 **Agentic chat mode** with multi-LLM support (5 providers)
- 🎯 **Custom model selection** - use any model from any provider

---

## Agentic Chat Mode

Corvus now supports **natural language queries** through an interactive AI chat interface. Ask questions in plain English and let the AI orchestrate tool calls automatically.

### **Supported LLM Providers**

| Provider | Default Model | Cost Range | Custom Models |
|----------|--------------|-----------|---------------|
| **Anthropic** | Claude 3.5 Sonnet | $3-75/1M tokens | ✅ All Claude models supported |
| **OpenAI** | GPT-4o | $0.15-30/1M tokens | ✅ All GPT models supported |
| **Google** | Gemini 1.5 Flash | $0.075-5/1M tokens | ✅ All Gemini models supported |
| **Groq** | Llama 3.3 70B | $0.05-0.24/1M tokens | ✅ All Groq models supported |
| **Ollama** (Local) | Llama 3.2 | **FREE** | ✅ Any locally installed model |

💡 **Use `corvus models` to see all available models** | [Full Model Guide →](CUSTOM_MODELS.md)

### **Setup**

1. **Add API key to `.env`** (choose at least one):
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...  # Recommended
   OPENAI_API_KEY=sk-...
   GOOGLE_API_KEY=...
   GROQ_API_KEY=gsk-...
   ```

2. **Or use local Ollama** (no API key needed):
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.com/install.sh | sh

   # Pull a model
   ollama pull llama2

   # Use with Corvus
   corvus chat --local
   ```

3. **🆕 Custom Model Selection** (choose any model from any provider):
   ```bash
   # View all available models
   corvus models              # List all providers
   corvus models anthropic    # Filter by provider

   # Use custom model via CLI flag
   corvus chat --provider openai --model gpt-4o-mini
   corvus chat --provider anthropic --model claude-3-5-haiku-20241022
   corvus chat --local --model mistral

   # Or set default in config
   corvus config set llm.model gpt-4o-mini
   corvus chat  # Uses config default
   ```

   **📖 See [CUSTOM_MODELS.md](CUSTOM_MODELS.md) for full model list and recommendations**

### **Usage Examples**

**Basic Chat:**
```bash
$ corvus chat

🤖 Corvus AI Chat
Provider: anthropic | Model: claude-3-5-sonnet-20241022

You: What's the SOL price?
Corvus: The current SOL price is $79.17 USD.

You: Analyze wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
Corvus: [Analyzes wallet and shows DeFi positions]

You: exit
📊 Session Summary:
  Turns: 2
  Estimated cost: $0.0023
```

**Advanced Options:**
```bash
# Use specific provider
corvus chat --provider openai

# Use specific model
corvus chat --provider anthropic --model claude-3-opus-20240229

# Use local LLM (private, free)
corvus chat --local

# Skip privacy warning
corvus chat --no-privacy-warning
```

### **Chat Commands**

During a chat session:
- `exit` or `quit` - End session and show summary
- `clear` - Reset conversation history
- Any natural language query - Ask questions about Solana/DeFi

### **Security & Privacy**

- ⚠️ **Data Privacy:** Queries (including wallet addresses) are sent to the selected LLM provider
- 🔒 **Private Mode:** Use `--local` flag for Ollama to keep all data on your machine
- 💰 **Cost Limits:** Sessions auto-terminate after 15 turns or $0.50 estimated cost
- 🛡️ **Input Validation:** All tool parameters are validated before execution
- 🚫 **Safety:** AI cannot execute destructive actions without confirmation

---

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_sol_balance` | Get SOL balance with USD value | `wallet` (required) |
| `get_token_balances` | Get all SPL token holdings | `wallet` (required) |
| `get_recent_transactions` | Get transaction history | `wallet` (required), `limit` (default: 10, max: 50) |
| `get_token_price` | Get token prices | `tokens` (comma-separated, max: 50) |
| `get_protocol_tvl` | Get protocol TVL metrics | `protocol` (name or slug) |
| `get_top_solana_protocols` | Get top protocols by TVL | `limit` (default: 10, max: 50), `category` (optional) |
| `analyze_wallet_defi_positions` | Analyze DeFi positions | `wallet` (required) |
| `send_telegram_alert` | Send Telegram notification | `chat_id`, `message`, `severity` (info/warning/critical) |

---

## Architecture

Three-layer design with deterministic tool execution:

```
┌─────────────────────────────────┐
│   Tools (MCP Interface)         │  8 production-ready tools
│   src/tools/*.ts                │  Input validation, response formatting
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│   Libraries (API Clients)       │  Helius, DeFiLlama clients
│   src/lib/*.ts                  │  Error handling, retries, sanitization
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│   Data (Static Registries)      │  Known DeFi tokens, token symbols
│   src/data/*.ts                 │  Registry-based classification
└─────────────────────────────────┘
```

**Design Principle:** All data fetching, validation, formatting, and error handling happens inside the tools. The LLM only selects which tool to use.

---

## Testing

Comprehensive test suite with **210 passing tests** (~6 seconds execution):

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

**Test Coverage:**
- Input validation (11 tests)
- DeFi classifier (10 tests)
- Token registry (7 tests)
- Helius API client (24 tests)
- DeFiLlama API client (24 tests)
- Tool implementations (113 tests)
- MCP server integration (12 tests)
- Integration tests (9 tests)

All tests are mock-based (no external API dependencies) for fast, deterministic execution.

---

## Example Usage

### Get Wallet Balance
```
User: "Get the SOL balance for wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"

Response:
{
  "balance_sol": 5.5,
  "balance_usd": 550.00,
  "price_per_sol": 100.00
}
```

### Analyze DeFi Positions
```
User: "Analyze DeFi positions in wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"

Response:
Known DeFi Positions:
  - jupSOL: 2.5 tokens ($250 USD) - Jito Liquid Staking
  - mSOL: 1.0 tokens ($100 USD) - Marinade Staking

Likely DeFi Positions:
  - SOL-USDC-LP: 0.5 tokens ($50 USD) - LP token detected

Summary:
  - Total DeFi Value: $400 USD
  - Protocols: Jito, Marinade, Unknown DEX
```

### Get Protocol Rankings
```
User: "What are the top 5 Solana DeFi protocols by TVL?"

Response:
1. Kamino Lend - $1.65B (Lending)
2. Jito - $1.07B (Liquid Staking)
3. Marinade - $850M (Liquid Staking)
4. Jupiter - $600M (DEX)
5. Drift - $400M (Perpetuals)
```

---

## Security

- **API Key Management**: Environment variables, never hardcoded
- **Input Validation**: Solana SDK PublicKey validation for wallet addresses
- **Error Sanitization**: Generic error messages, no internal details leaked
- **Request Timeouts**: 5-second default with AbortController
- **Rate Limiting**: Built-in limits (50 tokens max for pricing, 50 transactions max)
- **Authorization Headers**: Proper API authentication

---

## Data Sources

| Source | Purpose | API Key Required | Rate Limits |
|--------|---------|------------------|-------------|
| **Helius** | Blockchain data (balances, transactions) | Yes (free tier) | 100k credits/day |
| **DeFiLlama** | Protocol TVL, token prices | No | Public API |

---

## The Differentiator: 3-Bucket Classification

Corvus uses a unique **dual-strategy approach** to identify DeFi positions:

### 1. Known DeFi (Registry-Based)
Hardcoded registry of verified receipt tokens:
- **Liquid Staking**: jupSOL, mSOL, bSOL, stSOL
- **Governance**: JUP, JTO, MNDE, RAY, ORCA
- **LP Tokens**: JLP, USDC-USDT-LP

### 2. Likely DeFi (Heuristic-Based)
Pattern detection for unknown tokens:
- **LP Tokens**: Contains "LP" or hyphen (SOL-USDC)
- **Vault Tokens**: k-prefix (kUSDC = Kamino vault)
- **Protocol Names**: Contains known protocol names
- **No Market Price**: Receipt tokens typically not traded

Requires **2+ signals** to classify as "Likely DeFi"

### 3. Unclassified
Everything else (regular tokens, base assets, stablecoins)

**Why This Matters:** Users can instantly see their staking positions, lending deposits, and LP tokens across all protocols without manual tracking.

---

## Contributing

Contributions are welcome! Here's how to help:

### Adding DeFi Tokens to Registry

Edit `src/data/defi-registry.ts`:

```typescript
{
  mint: "token-mint-address",
  symbol: "TOKEN",
  name: "Token Name",
  protocol: "Protocol Name",
  category: "Liquid Staking" | "Governance" | "LP Token",
  underlying_asset: "SOL", // optional
  description: "Brief description"
}
```

### Adding New Tools

1. Create `src/tools/your-tool.ts`
2. Implement with validation, API calls, structured response
3. Register in `src/index.ts` (ListTools and CallTool handlers)
4. Add tests in `tests/unit/tools/your-tool.test.ts`
5. Run `npm test` to verify

### Code Standards

- TypeScript strict mode
- All responses include `_meta` field (data source, timestamp)
- Input validation before API calls
- Error handling with sanitized messages
- Mock-based unit tests (no real API calls)

---

## License

MIT License - see [LICENSE](./LICENSE) for details

---

## Acknowledgments

Built with:
- [Helius](https://helius.dev) - Solana blockchain infrastructure
- [DeFiLlama](https://defillama.com) - DeFi protocol metrics
- [Model Context Protocol](https://modelcontextprotocol.io) - AI-application integration standard
- [Archestra](https://archestra.ai) - MCP orchestration platform

---

## Contact

- **GitHub**: [@Allen-Saji](https://github.com/Allen-Saji)
- **Repository**: [corvus](https://github.com/Allen-Saji/corvus)
- **Issues**: [Report a bug](https://github.com/Allen-Saji/corvus/issues)

---

**Built for the [2 Fast 2 MCP](https://www.wemakedevs.org/hackathons/2fast2mcp) Hackathon**
