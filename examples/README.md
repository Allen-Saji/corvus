# Corvus Examples

This directory contains example code showing how to use Corvus in different ways.

## Files

### `basic-usage.sh`
Shell script demonstrating basic CLI commands.

**Run it:**
```bash
bash examples/basic-usage.sh
```

### `programmatic-usage.ts`
TypeScript example showing how to use Corvus tools programmatically in your own code.

**Run it:**
```bash
# Build first
npm run build

# Run the example
npx tsx examples/programmatic-usage.ts
```

## Prerequisites

All examples require:
- **HELIUS_API_KEY** in your `.env` file
- Dependencies installed (`npm install`)

For AI chat examples, you also need:
- At least one LLM provider API key (GROQ_API_KEY, ANTHROPIC_API_KEY, etc.)

## More Examples

### CLI Examples

```bash
# Check SOL price
corvus price SOL

# Analyze a specific wallet
corvus analyze 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

# Get top 10 DeFi protocols
corvus top 10

# Start AI chat
corvus chat --stream

# Get JSON output for scripting
corvus balance <wallet> --json | jq '.balance_sol'
```

### Programmatic Usage

```typescript
import { getSOLBalanceTool } from 'corvus-solana-cli/dist/tools/balance';

const result = await getSOLBalanceTool('wallet_address');
const data = JSON.parse(result);
console.log(`Balance: ${data.balance_sol} SOL`);
```

### MCP Server Usage

Use with Archestra or Claude Desktop:

```bash
# Start MCP server
npm start

# Or via Archestra
archestra start corvus
```

## Need Help?

- Check the main [README.md](../README.md)
- Read [docs/INSTALLATION.md](../docs/INSTALLATION.md)
- Open an issue on GitHub
