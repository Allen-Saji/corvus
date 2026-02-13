# Contributing to Corvus

First off, thank you for considering contributing to Corvus! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to allensaji04@gmail.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (Node version, OS, etc.)
- **Error messages/logs**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Include:

- **Use case**: Why is this enhancement needed?
- **Proposed solution**: How should it work?
- **Alternatives**: What other solutions did you consider?

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code follows our style guidelines
5. Write clear commit messages
6. Submit your pull request!

## Development Setup

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Local Development

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/corvus.git
cd corvus

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 4. Build
npm run build

# 5. Run tests
npm test

# 6. Try CLI locally
node dist/cli.js --help
```

### Project Structure

```
corvus/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # MCP server entry point
│   ├── tools/              # MCP tools (balance, price, etc.)
│   ├── lib/                # External API clients (Helius, DefiLlama)
│   ├── llm/                # LLM adapters & session management
│   ├── data/               # Token/protocol registries
│   └── config/             # Configuration management
├── tests/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write code
   - Add/update tests
   - Update documentation

3. **Test your changes**
   ```bash
   npm test                    # Run all tests
   npm run build              # Ensure it builds
   node dist/cli.js balance <wallet>  # Manual test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/amazing-feature
   ```
   Then open a pull request on GitHub.

6. **PR Review**
   - Maintainers will review your code
   - Address any feedback
   - Once approved, it will be merged!

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide type annotations for function parameters and return types
- Avoid `any` - use proper types or `unknown`
- Use interfaces for object shapes

**Good:**
```typescript
export async function getTokenPrice(mint: string): Promise<TokenPrice> {
  // ...
}
```

**Bad:**
```typescript
export async function getTokenPrice(mint: any): Promise<any> {
  // ...
}
```

### Code Style

We use TypeScript + ESLint. Follow these guidelines:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: Max 100 characters (relaxed to 120 for readability)
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and types
  - `UPPER_CASE` for constants

### Error Handling

Always handle errors gracefully:

```typescript
// Good
try {
  const result = await apiCall();
  return { data: result };
} catch (error: any) {
  return {
    error: "User-friendly message",
    _meta: { timestamp: new Date().toISOString() }
  };
}

// Bad
const result = await apiCall(); // Might throw!
```

### Security

- **Never** hardcode API keys
- **Always** validate user inputs
- **Sanitize** error messages (don't expose internal details)
- **Use** timeouts for external API calls
- **Set** proper file permissions (0o600 for sensitive files)

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(price): add Jupiter API fallback for DEX tokens

Add Jupiter price API as fallback when DefiLlama doesn't have prices.
This improves coverage for Pump.fun and new DEX tokens.

Closes #42
```

```
fix(cli): handle undefined balance in analyze command

Wallet analysis crashed when token had no USD value.
Added null checks and default to 0.

Fixes #38
```

## Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # UI mode (vitest UI)
```

### Writing Tests

- **Unit tests** go in `tests/unit/`
- **Integration tests** go in `tests/integration/`
- Test file naming: `*.test.ts`

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { validateSolanaAddress } from '../src/lib/validation';

describe('validateSolanaAddress', () => {
  it('should accept valid Solana addresses', () => {
    const result = validateSolanaAddress('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid addresses', () => {
    const result = validateSolanaAddress('invalid123');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- All new features must have tests
- Bug fixes should include regression tests

## Documentation

When adding features, update:

- **README.md** - If it's a user-facing feature
- **docs/** - Detailed documentation
- **Code comments** - For complex logic
- **JSDoc** - For public APIs

## Questions?

- Open an issue for discussion
- Email: allensaji04@gmail.com
- Check existing issues/PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Corvus! 🚀**
