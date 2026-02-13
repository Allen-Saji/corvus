# Repository Structure

This document explains the organization of the Corvus repository.

## Directory Tree

```
corvus/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
│
├── archive/                    # Development artifacts (gitignored)
│   └── (old docs, test files)
│
├── archestra/                  # Archestra MCP configuration
│   └── workspace.json
│
├── assets/                     # Project assets (logos, images)
│   └── corvus-logo.png
│
├── docs/                       # User documentation
│   ├── INSTALLATION.md         # Installation guide
│   ├── CUSTOM_MODELS.md        # Model configuration guide
│   ├── PRICING_SOURCES.md      # Price API documentation
│   ├── SECURITY_AUDIT_REPORT.md # Security audit results
│   ├── SETUP_WIZARD_PLAN.md    # Future feature planning
│   └── REPOSITORY_STRUCTURE.md # This file
│
├── examples/                   # Usage examples
│   ├── README.md              # Examples documentation
│   ├── basic-usage.sh         # CLI examples (shell)
│   └── programmatic-usage.ts  # Programmatic usage (TypeScript)
│
├── scripts/                    # Utility scripts
│   ├── test-all-commands.sh   # Comprehensive CLI testing
│   └── test-interactive.sh    # Interactive test script
│
├── src/                        # Source code
│   ├── cli.ts                 # CLI entry point
│   ├── index.ts               # MCP server entry point
│   ├── types.ts               # Shared TypeScript types
│   │
│   ├── config/                # Configuration management
│   │   └── manager.ts
│   │
│   ├── data/                  # Static data/registries
│   │   ├── defi-registry.ts   # DeFi protocol registry
│   │   └── token-registry.ts  # Token symbol mappings
│   │
│   ├── lib/                   # External API clients
│   │   ├── defillama.ts       # DefiLlama/Jupiter/Pump.fun APIs
│   │   ├── helius.ts          # Helius Solana API
│   │   └── validation.ts      # Input validation utilities
│   │
│   ├── llm/                   # LLM integration
│   │   ├── adapters/          # LLM provider adapters
│   │   │   ├── anthropic.ts
│   │   │   ├── google.ts
│   │   │   ├── ollama.ts
│   │   │   └── openai.ts
│   │   ├── factory.ts         # LLM client factory
│   │   ├── models.ts          # Model registry
│   │   ├── session.ts         # Chat session management
│   │   ├── session-storage.ts # Session persistence
│   │   ├── streaming.ts       # Streaming utilities
│   │   ├── tool-converter.ts  # MCP tool conversion
│   │   └── types.ts           # LLM type definitions
│   │
│   └── tools/                 # MCP tools (commands)
│       ├── balance.ts         # SOL balance tool
│       ├── defi-positions.ts  # DeFi analysis tool
│       ├── price.ts           # Token price tool
│       ├── protocol.ts        # Protocol TVL tools
│       ├── telegram.ts        # Telegram alerts
│       ├── tokens.ts          # Token holdings tool
│       └── transactions.ts    # Transaction history tool
│
├── tests/                      # Test suite
│   ├── fixtures/
│   │   └── mock-data.ts       # Test fixtures
│   ├── integration/
│   │   └── tools.test.ts      # Integration tests
│   └── unit/
│       ├── cli.test.ts
│       ├── defi-classifier.test.ts
│       ├── defillama.test.ts
│       ├── helius.test.ts
│       ├── mcp-server.test.ts
│       ├── token-registry.test.ts
│       ├── validation.test.ts
│       └── tools/
│
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── .npmignore                  # npm publish ignore rules
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guidelines
├── Dockerfile                  # Docker container
├── LICENSE                     # MIT license
├── package.json                # Node.js package config
├── package-lock.json           # Locked dependencies
├── README.md                   # Main documentation
├── tsconfig.json               # TypeScript configuration
└── vitest.config.ts            # Vitest test configuration
```

## Key Directories

### `/src` - Source Code

**Purpose:** All TypeScript source code

**Organization:**
- **Entry points:** `index.ts` (MCP), `cli.ts` (CLI)
- **Domain separation:** `tools/`, `lib/`, `llm/`, `config/`, `data/`
- **Type safety:** `types.ts` for shared types

**Best Practices:**
- One file per tool/module
- Clear naming conventions
- Proper exports

### `/tests` - Test Suite

**Purpose:** Unit and integration tests

**Organization:**
- `unit/` - Unit tests (isolated functions)
- `integration/` - Integration tests (API calls, real data)
- `fixtures/` - Mock data and test utilities

**Coverage:** 224 tests (100% critical path coverage)

### `/docs` - Documentation

**Purpose:** User-facing documentation

**Files:**
- `INSTALLATION.md` - Setup guide
- `CUSTOM_MODELS.md` - LLM configuration
- `PRICING_SOURCES.md` - Price API details
- `SECURITY_AUDIT_REPORT.md` - Security audit
- `REPOSITORY_STRUCTURE.md` - This file

### `/examples` - Usage Examples

**Purpose:** Code examples for users

**Files:**
- `basic-usage.sh` - CLI examples
- `programmatic-usage.ts` - TypeScript API usage
- `README.md` - Examples documentation

### `/scripts` - Utility Scripts

**Purpose:** Development and testing scripts

**Files:**
- `test-all-commands.sh` - E2E CLI testing
- `test-interactive.sh` - Interactive testing

### `/.github` - GitHub Configuration

**Purpose:** CI/CD and GitHub-specific config

**Files:**
- `workflows/ci.yml` - Continuous Integration pipeline

## Configuration Files

### `package.json`
**Purpose:** Node.js package configuration

**Key fields:**
- `name`: Package name on npm
- `version`: Semantic version
- `main`: MCP server entry point
- `bin`: CLI executable
- `files`: Files included in npm package
- `engines`: Node.js version requirement
- `repository`: GitHub repo URL

### `tsconfig.json`
**Purpose:** TypeScript compiler configuration

**Key settings:**
- `strict: true` - Maximum type safety
- `declaration: true` - Generate .d.ts files
- `sourceMap: true` - Debug support
- `noUnusedLocals: true` - Catch unused variables

### `.gitignore`
**Purpose:** Files excluded from Git

**Excludes:**
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.env` - Secrets
- `archive/` - Dev artifacts

### `.npmignore`
**Purpose:** Files excluded from npm package

**Excludes:**
- `tests/` - Test files
- `src/` - Source (ship dist/ only)
- Development files

## File Naming Conventions

### Source Files
- **PascalCase:** Class files (e.g., `SessionStorage`)
- **kebab-case:** Tool files (e.g., `defi-positions.ts`)
- **camelCase:** Utility files (e.g., `validation.ts`)

### Test Files
- **Pattern:** `*.test.ts` or `*.spec.ts`
- **Location:** Mirror `src/` structure in `tests/`

### Documentation
- **UPPERCASE:** Top-level docs (e.g., `README.md`, `CONTRIBUTING.md`)
- **CAPS_SNAKE_CASE:** Important docs (e.g., `SECURITY_AUDIT_REPORT.md`)

## Build Artifacts

### `/dist` - Build Output
**Generated by:** `npm run build` (TypeScript compiler)

**Contents:**
- `index.js` - MCP server (compiled)
- `cli.js` - CLI executable (compiled)
- `*.d.ts` - TypeScript definitions
- `*.js.map` - Source maps

**Note:** This directory is gitignored and generated on build.

## npm Package Contents

When published to npm, the package includes:

```
corvus-solana-cli/
├── dist/                  # Compiled JavaScript
│   ├── index.js
│   ├── index.d.ts
│   ├── cli.js
│   └── (all compiled files)
├── docs/                  # Essential docs
│   ├── INSTALLATION.md
│   ├── CUSTOM_MODELS.md
│   ├── PRICING_SOURCES.md
│   └── SECURITY_AUDIT_REPORT.md
├── README.md
└── LICENSE
```

**Excluded from package:**
- Source files (`src/`)
- Tests (`tests/`)
- Development files
- Archive directory

## Development Workflow

### 1. Local Development
```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
npm test           # Run tests
node dist/cli.js   # Test CLI locally
```

### 2. Making Changes
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes in src/
vim src/tools/my-tool.ts

# 3. Add tests
vim tests/unit/my-tool.test.ts

# 4. Test
npm test
npm run build

# 5. Commit
git commit -m "feat: add my feature"
```

### 3. Publishing
```bash
# 1. Update version
npm version patch/minor/major

# 2. Update CHANGELOG.md

# 3. Build
npm run build

# 4. Publish
npm publish
```

## Best Practices

### Code Organization
✅ **DO:**
- Keep files focused and small (<500 lines)
- Use clear, descriptive names
- Group related functionality
- Export only what's needed

❌ **DON'T:**
- Mix concerns in one file
- Use default exports (prefer named exports)
- Create circular dependencies
- Put logic in type files

### Testing
✅ **DO:**
- Test one thing per test
- Use descriptive test names
- Mock external APIs
- Test error cases

❌ **DON'T:**
- Test implementation details
- Skip edge cases
- Make tests dependent on each other
- Commit failing tests

### Documentation
✅ **DO:**
- Update docs with code changes
- Add JSDoc for public APIs
- Include examples
- Keep README up-to-date

❌ **DON'T:**
- Document obvious code
- Let docs go stale
- Forget CHANGELOG entries
- Skip security considerations

## Questions?

- Check [CONTRIBUTING.md](../CONTRIBUTING.md)
- Open an issue on GitHub
- Email: allensaji04@gmail.com
