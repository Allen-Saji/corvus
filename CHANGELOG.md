# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-13

### Added

#### Core Features
- **CLI Interface** - Complete command-line interface for Solana DeFi analysis
- **MCP Server** - Model Context Protocol server for AI agents (Archestra integration)
- **Dual-Mode Operation** - Works as both standalone CLI and MCP server

#### CLI Commands
- `corvus balance <wallet>` - Get SOL balance and USD value
- `corvus tokens <wallet>` - List all SPL token holdings
- `corvus price <tokens>` - Get real-time token prices (comma-separated)
- `corvus analyze <wallet>` - Comprehensive DeFi position analysis
- `corvus protocol <name>` - Protocol TVL and metrics
- `corvus top [limit]` - Top Solana protocols by TVL
- `corvus tx <wallet>` - Recent transaction history
- `corvus chat` - Interactive AI chat mode with streaming
- `corvus models` - List available LLM models
- `corvus config` - Configuration management
- `corvus sessions` - Manage saved chat sessions

#### Data Sources
- **DefiLlama Integration** - Protocol TVL, token prices
- **Helius Integration** - Wallet balances, token data, transactions
- **Jupiter API** - DEX token prices (fallback)
- **Pump.fun API** - Bonding curve token prices (fallback)

#### LLM Support
- **Multi-Provider Support** - Anthropic (Claude), OpenAI (GPT), Google (Gemini), Groq, Ollama
- **Model Registry** - 20+ models across 5 providers
- **Flexible Model Selection** - Use ANY model ID (not restricted to registry)
- **Chat Session Management** - Save, load, export conversations
- **Streaming Support** - Real-time response streaming
- **Cost Tracking** - Automatic cost calculation per session

#### DeFi Analysis
- **3-Tier Classification** - Known DeFi → Likely DeFi → Unclassified
- **Protocol Registry** - 50+ Solana DeFi protocols
- **Token Registry** - Common token symbol-to-mint mapping
- **Dust Filtering** - Automatic filtering of low-value tokens ($1 threshold)
- **Heuristic Detection** - Smart detection of unknown DeFi tokens

#### Security
- **Input Validation** - Wallet addresses validated via Solana SDK
- **Path Traversal Protection** - Filename sanitization
- **API Key Security** - Environment variable only, never logged
- **Secure File Permissions** - Session files (0o600), directories (0o700)
- **Error Sanitization** - No internal details exposed
- **Timeout Protection** - 5s timeouts on all external API calls

#### Developer Experience
- **TypeScript** - Full type safety
- **Comprehensive Testing** - 224 tests (unit + integration)
- **Documentation** - Installation guide, security audit, API docs
- **Clean UX** - Minimal, professional CLI output
- **JSON Mode** - `--json` flag for all commands (scripting)

### Changed
- **CLI Output** - Redesigned for minimal, clean presentation
- **Pricing System** - Triple-layer fallback (DefiLlama → Jupiter → Pump.fun)
- **dotenv** - Downgraded to v16 to remove noisy tips

### Fixed
- **Balance Display Bug** - Fixed undefined price_per_sol field
- **Token Valuation** - Proper null handling for unpriced tokens
- **Test Suite** - All 224 tests passing

### Security
- **npm audit** - 0 vulnerabilities (297 dependencies)
- **Security Audit** - Comprehensive audit completed (A+ rating)
- **OWASP Compliance** - All OWASP Top 10 checks passed

## [Unreleased]

### Planned Features
- Interactive setup wizard (`corvus setup`)
- Real-time Pump.fun feed monitoring
- Raydium new pool alerts
- Telegram alert integration improvements
- Web UI for portfolio tracking
- Historical price charts

---

## Version History

- **1.0.0** (2026-02-13) - Initial release
  - CLI + MCP server
  - Multi-provider LLM support
  - Triple-layer pricing system
  - Comprehensive testing & security

---

[1.0.0]: https://github.com/allensaji/corvus/releases/tag/v1.0.0
