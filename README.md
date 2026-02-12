# Corvus

Solana DeFi intelligence via Model Context Protocol. Natural language interface for querying wallets, DeFi positions, protocol metrics, and token prices on Solana.

## Quick Start

### Prerequisites
- Node.js 18+
- Helius API key (free at https://dashboard.helius.dev)

### Installation

```bash
git clone <your-repo-url>
cd corvus
npm install

# Configure environment
cp .env.example .env
# Add your HELIUS_API_KEY to .env

# Build and run
npm run build
npm start
```

## Architecture

Three-layer architecture with deterministic tool execution:

```
Tools (MCP interface)
  ↓
Libraries (API clients & validation)
  ↓
Data (Static registries)
```

**Design Principle:** All data fetching, validation, formatting, and error handling happens inside the tools. The LLM only selects which tool to use.

## Available Tools

### Wallet Intelligence

**get_sol_balance** - Get SOL balance and current USD value for any wallet

**get_token_balances** - Get all SPL token holdings with balances, prices, and USD values

**get_recent_transactions** - Get transaction history with human-readable descriptions (up to 50 transactions)

### DeFi Market Data

**get_token_price** - Get current prices for Solana tokens by symbol or mint address (batch support up to 50 tokens)

**get_protocol_tvl** - Get detailed TVL and metrics for specific DeFi protocols with fuzzy name matching

**get_top_solana_protocols** - Get top protocols ranked by TVL with optional category filtering

### In Development

**analyze_wallet_defi_positions** - Comprehensive DeFi position analysis with 3-bucket classification (Known / Likely DeFi / Unclassified)

**send_telegram_alert** - Send formatted alerts to Telegram with markdown support

## Project Structure

```
src/
├── index.ts              # MCP server entry point
├── types.ts              # TypeScript interfaces
├── lib/                  # API clients & utilities
│   ├── validation.ts
│   ├── helius.ts
│   └── defillama.ts
├── data/                 # Static registries
│   ├── token-registry.ts
│   └── defi-registry.ts
└── tools/                # MCP tool implementations
    ├── balance.ts
    ├── tokens.ts
    ├── transactions.ts
    ├── price.ts
    └── protocol.ts
```

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Development mode with tsx
npm start        # Production mode
```

### Adding a New Tool

1. Create tool file in `src/tools/`
2. Implement with input validation, API calls via `lib/` clients, and structured response
3. Register in `src/index.ts` (ListToolsRequestSchema and CallToolRequestSchema handlers)
4. Build and test

### Code Standards

- TypeScript strict mode
- All responses include `_meta` field with data source and timestamp
- Input validation before API calls
- 5-second default timeout on external calls
- Graceful error handling

## Security

- API keys via environment variables
- Input validation using Solana SDK PublicKey
- Authorization headers for API authentication
- Error message sanitization
- Request timeouts with AbortController
- Input length limits (50 token max for pricing, 100 token max for wallet scans)

## Data Sources

**DefiLlama** (Free, no API key)
- Protocols API: 7,059 protocols, 358 on Solana
- Coins API: Token pricing with confidence scores

**Helius** (Free tier, API key required)
- RPC: Solana getBalance
- DAS API: Token balance scanning
- Enhanced Transactions: Human-readable transaction history
- Free tier: 100,000 credits/day

## Known Limitations

- NFT-based positions (Orca Whirlpool) not detected
- Program account positions (Drift, Zeta margin) not visible
- Current prices only, not historical values
- Receipt tokens (Kamino kTokens, LP tokens) have no market price
- New or low-liquidity tokens may not be tracked by DefiLlama

These limitations are communicated in tool responses.

## License

MIT

## Built With

- [Helius](https://helius.dev) - Solana infrastructure
- [DefiLlama](https://defillama.com) - DeFi metrics
- [Model Context Protocol](https://modelcontextprotocol.io) - AI-application integration standard
