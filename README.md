# Corvus

**Solana DeFi Intelligence MCP Server**

Natural language interface for querying wallets, DeFi positions, protocol metrics, and token prices on Solana blockchain.

---

## ✨ Features

### 🔍 Wallet Intelligence
- **SOL Balance**: Get native SOL balance with real-time USD valuation
- **Token Holdings**: Complete SPL token portfolio with prices and values
- **Transaction History**: Human-readable transaction descriptions (powered by Helius Enhanced Transactions)

### 📊 DeFi Market Data
- **Token Pricing**: Batch price lookups for up to 50 tokens (symbols or mint addresses)
- **Protocol TVL**: Detailed Total Value Locked metrics for 358+ Solana protocols
- **Protocol Rankings**: Top protocols by TVL with category filtering

### 🌟 Advanced Analytics (The Differentiator)
- **DeFi Position Analysis**: Intelligent 3-bucket classification system
  - **Known DeFi**: Registry-based identification (jupSOL, mSOL, JLP, etc.)
  - **Likely DeFi**: Heuristic detection (LP tokens, vault tokens, protocol patterns)
  - **Unclassified**: Regular tokens and assets
- **Dust Filtering**: Automatically filters tokens < $1 USD or < 0.01 balance
- **Telegram Alerts**: Send formatted notifications with severity levels

---

## 🚀 Quick Start

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

### Using with Claude Desktop

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

### Archestra Platform Deployment

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

---

## 🛠️ Available Tools

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

## 🏗️ Architecture

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

## 🧪 Testing

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
- ✅ Input validation (11 tests)
- ✅ DeFi classifier (10 tests)
- ✅ Token registry (7 tests)
- ✅ Helius API client (24 tests)
- ✅ DeFiLlama API client (24 tests)
- ✅ Tool implementations (113 tests)
- ✅ MCP server integration (12 tests)
- ✅ Integration tests (9 tests)

All tests are mock-based (no external API dependencies) for fast, deterministic execution.

See [TEST-SUMMARY.md](./TEST-SUMMARY.md) for detailed breakdown.

---

## 📖 Example Usage

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

## 🔒 Security

- **API Key Management**: Environment variables, never hardcoded
- **Input Validation**: Solana SDK PublicKey validation for wallet addresses
- **Error Sanitization**: Generic error messages, no internal details leaked
- **Request Timeouts**: 5-second default with AbortController
- **Rate Limiting**: Built-in limits (50 tokens max for pricing, 50 transactions max)
- **Authorization Headers**: Proper API authentication

See [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) for detailed security measures.

---

## 📊 Data Sources

| Source | Purpose | API Key Required | Rate Limits |
|--------|---------|------------------|-------------|
| **Helius** | Blockchain data (balances, transactions) | Yes (free tier) | 100k credits/day |
| **DeFiLlama** | Protocol TVL, token prices | No | Public API |

---

## 🎯 The Differentiator: 3-Bucket Classification

Corvus uses a unique **dual-strategy approach** to identify DeFi positions:

### 1️⃣ Known DeFi (Registry-Based)
Hardcoded registry of verified receipt tokens:
- **Liquid Staking**: jupSOL, mSOL, bSOL, stSOL
- **Governance**: JUP, JTO, MNDE, RAY, ORCA
- **LP Tokens**: JLP, USDC-USDT-LP

### 2️⃣ Likely DeFi (Heuristic-Based)
Pattern detection for unknown tokens:
- **LP Tokens**: Contains "LP" or hyphen (SOL-USDC)
- **Vault Tokens**: k-prefix (kUSDC = Kamino vault)
- **Protocol Names**: Contains known protocol names
- **No Market Price**: Receipt tokens typically not traded

Requires **2+ signals** to classify as "Likely DeFi"

### 3️⃣ Unclassified
Everything else (regular tokens, base assets, stablecoins)

**Why This Matters:** Users can instantly see their staking positions, lending deposits, and LP tokens across all protocols without manual tracking.

---

## 🤝 Contributing

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

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

Built with:
- [Helius](https://helius.dev) - Solana blockchain infrastructure
- [DeFiLlama](https://defillama.com) - DeFi protocol metrics
- [Model Context Protocol](https://modelcontextprotocol.io) - AI-application integration standard
- [Archestra](https://archestra.ai) - MCP orchestration platform

---

## 📬 Contact

- **GitHub**: [@Allen-Saji](https://github.com/Allen-Saji)
- **Repository**: [corvus](https://github.com/Allen-Saji/corvus)
- **Issues**: [Report a bug](https://github.com/Allen-Saji/corvus/issues)

---

**Built for the [2 Fast 2 MCP](https://www.wemakedevs.org/hackathons/2fast2mcp) Hackathon**
