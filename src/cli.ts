#!/usr/bin/env node

// CRITICAL: Load env BEFORE any tool imports
import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';

// Import tools (after dotenv)
import { getSOLBalanceTool } from './tools/balance.js';
import { getTokenBalancesTool } from './tools/tokens.js';
import { getTokenPriceTool } from './tools/price.js';
import { getRecentTransactionsTool } from './tools/transactions.js';
import { getProtocolTVLTool, getTopProtocolsTool } from './tools/protocol.js';
import { analyzeWalletDeFiPositionsTool } from './tools/defi-positions.js';
import { sendTelegramAlertTool } from './tools/telegram.js';

// Import LLM modules for chat mode
import { createLLMClient, getAvailableProviders, autoDetectProvider } from './llm/factory.js';
import { ChatSessionManager } from './llm/session.js';
import { LLMProvider } from './llm/types.js';
import * as readline from 'readline';

// Import config manager
import { getConfig } from './config/manager.js';

// Import session storage
import { getSessionStorage } from './llm/session-storage.js';

// Import model information
import { AVAILABLE_MODELS } from './llm/models.js';

/**
 * Corvus CLI - Solana DeFi Intelligence
 *
 * Provides command-line access to Corvus tools for direct wallet/DeFi analysis
 */

// Graceful Ctrl+C handling
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n✖ Operation cancelled'));
  process.exit(0);
});

const program = new Command();

program
  .name('corvus')
  .description('Solana DeFi Intelligence CLI')
  .version('1.0.0');

// Command 1: Balance
program
  .command('balance <wallet>')
  .description('Get SOL balance for a wallet')
  .option('--json', 'Output raw JSON')
  .action(async (wallet: string, options: { json?: boolean }) => {
    try {
      const result = await getSOLBalanceTool(wallet);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) {
          process.exit(1);
        }
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        if (data.error.includes('Invalid')) {
          console.error(chalk.gray('Tip: Solana wallet addresses are 32-44 characters (Base58)'));
        }
        process.exit(1);
      }

      // Clean, minimal output
      console.log();
      console.log(chalk.bold(`SOL Balance`));
      console.log(chalk.gray(`${data.wallet}`));
      console.log();
      console.log(`  ${chalk.green(data.balance_sol.toFixed(4))} SOL`);
      if (data.value_usd) {
        console.log(`  ${chalk.dim('≈')} ${chalk.yellow('$' + data.value_usd.toFixed(2))} ${chalk.dim(`@ $${data.price_usd.toFixed(2)}/SOL`)}`);
      }
      console.log();
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 2: Tokens
program
  .command('tokens <wallet>')
  .description('Get all SPL token holdings for a wallet')
  .option('--json', 'Output raw JSON')
  .action(async (wallet: string, options: { json?: boolean }) => {
    try {
      const result = await getTokenBalancesTool(wallet);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) process.exit(1);
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        process.exit(1);
      }

      // Clean, minimal output
      console.log();
      console.log(chalk.bold(`Token Holdings`));
      const totalValue = data.total_value_usd ? `$${data.total_value_usd.toFixed(2)}` : 'N/A';
      console.log(chalk.gray(`${data.token_count} tokens · ${totalValue} total`));
      console.log();

      if (data.token_count === 0) {
        console.log(chalk.dim('  No tokens found'));
        console.log();
        return;
      }

      for (const token of data.tokens) {
        const symbol = chalk.bold(token.symbol || 'Unknown');
        const name = chalk.dim(token.name || 'Unknown Token');
        const balance = token.balance.toFixed(4);
        const value = token.usd_value ? chalk.yellow(`$${token.usd_value.toFixed(2)}`) : chalk.dim('N/A');

        console.log(`  ${symbol} ${name}`);
        console.log(`    ${balance} · ${value}`);
      }
      console.log();
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 3: Price
program
  .command('price <tokens>')
  .description('Get current prices for tokens (comma-separated)')
  .option('--json', 'Output raw JSON')
  .action(async (tokens: string, options: { json?: boolean }) => {
    try {
      const result = await getTokenPriceTool(tokens);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) process.exit(1);
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        process.exit(1);
      }

      // Clean list output
      console.log();
      console.log(chalk.bold('Token Prices'));
      console.log();

      for (const priceData of data.prices) {
        const symbol = (priceData.symbol || priceData.token).toUpperCase();
        const price = priceData.price_usd;

        // Format price nicely
        let priceStr;
        if (price >= 1000) {
          priceStr = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (price >= 1) {
          priceStr = `$${price.toFixed(2)}`;
        } else {
          priceStr = `$${price.toFixed(6)}`;
        }

        const confidence = priceData.confidence >= 0.95 ? chalk.green('●') :
                          priceData.confidence >= 0.8 ? chalk.yellow('●') : chalk.red('●');

        console.log(`  ${chalk.bold(symbol.padEnd(10))} ${chalk.yellow(priceStr)} ${confidence}`);
      }

      console.log();
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 4: Transactions
program
  .command('tx <wallet>')
  .description('Get recent transaction history')
  .option('-l, --limit <number>', 'Number of transactions (default: 10, max: 50)', '10')
  .option('--json', 'Output raw JSON')
  .action(async (wallet: string, options: { limit?: string; json?: boolean }) => {
    try {
      const limit = options.limit ? parseInt(options.limit, 10) : undefined;
      const result = await getRecentTransactionsTool(wallet, limit);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) process.exit(1);
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        process.exit(1);
      }

      // Clean, minimal output
      console.log();
      console.log(chalk.bold('Recent Transactions'));
      console.log(chalk.gray(`${data.transactions.length} transactions`));
      console.log();

      for (const tx of data.transactions) {
        const status = tx.success ? chalk.green('✓') : chalk.red('✗');
        const timestamp = new Date(tx.timestamp).toLocaleString();
        const sig = `${tx.signature.slice(0, 8)}...${tx.signature.slice(-8)}`;

        console.log(`${status} ${chalk.bold(sig)}`);
        console.log(`  ${chalk.dim(timestamp)}`);
        console.log(`  ${tx.description}`);

        if (tx.transfers && tx.transfers.length > 0) {
          for (const transfer of tx.transfers) {
            const amountColor = transfer.amount > 0 ? chalk.green : chalk.red;
            console.log(`    ${transfer.symbol} ${amountColor(transfer.amount.toFixed(4))}`);
          }
        }
        console.log();
      }
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 5: Analyze DeFi Positions
program
  .command('analyze <wallet>')
  .description('Analyze wallet DeFi positions in depth')
  .option('--json', 'Output raw JSON')
  .action(async (wallet: string, options: { json?: boolean }) => {
    try {
      const result = await analyzeWalletDeFiPositionsTool(wallet);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) process.exit(1);
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        process.exit(1);
      }

      console.log();
      console.log(`The wallet ${chalk.dim(wallet.slice(0, 8) + '...' + wallet.slice(-8))} holds the following tokens:`);
      console.log();
      console.log(chalk.bold('💰 Token Balances'));
      console.log();

      // Combine all tokens for display
      const allTokens: any[] = [];

      if (data.known_positions && data.known_positions.length > 0) {
        allTokens.push(...data.known_positions.map((t: any) => ({ ...t, category: 'DeFi' })));
      }
      if (data.likely_defi && data.likely_defi.length > 0) {
        allTokens.push(...data.likely_defi.map((t: any) => ({ ...t, category: 'Likely DeFi' })));
      }
      if (data.unclassified && data.unclassified.length > 0) {
        allTokens.push(...data.unclassified.map((t: any) => ({ ...t, category: 'Other' })));
      }

      if (allTokens.length === 0) {
        console.log(chalk.dim('  No tokens found (or all filtered as dust)'));
        console.log();
        return;
      }

      // Create table
      const table = new Table({
        head: ['Token', 'Symbol', 'Balance', 'Value (USD)'],
        style: { head: ['cyan'] }
      });

      let pricedCount = 0;
      let unpricedTokens: string[] = [];

      for (const token of allTokens) {
        const name = token.name || 'Unknown';
        const symbol = token.symbol || '???';
        const balance = token.balance ? token.balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';

        let valueStr;
        if (token.value_usd && token.value_usd > 0) {
          valueStr = `~$${token.value_usd.toFixed(2)}`;
          pricedCount++;
        } else {
          valueStr = chalk.dim('Unpriced');
          unpricedTokens.push(symbol);
        }

        table.push([name, symbol, balance, valueStr]);
      }

      console.log(table.toString());
      console.log();

      // Portfolio Summary
      console.log(chalk.bold('Portfolio Summary:'));
      console.log();

      const totalValue = (data.summary?.total_estimated_usd || 0);
      console.log(`Total Priced Value: ${chalk.yellow(`~$${totalValue.toFixed(2)} USD`)}`);
      console.log(`Total Tokens: ${allTokens.length}`);

      if (unpricedTokens.length > 0) {
        console.log(`Unpriced Assets: ${unpricedTokens.length} (${unpricedTokens.join(', ')} currently ${unpricedTokens.length === 1 ? 'has' : 'have'} no market price data available)`);
      }

      if (data._meta?.dust_filtered > 0) {
        console.log(chalk.dim(`Note: ${data._meta.dust_filtered} dust tokens filtered out`));
      }

      console.log();
      console.log(chalk.dim('Note: Prices are retrieved from real-time data providers and may vary slightly between platforms.'));
      console.log();
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 6: Protocol TVL
program
  .command('protocol <name>')
  .description('Get TVL and metrics for a specific protocol')
  .option('--json', 'Output raw JSON')
  .action(async (name: string, options: { json?: boolean }) => {
    try {
      const result = await getProtocolTVLTool(name);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) process.exit(1);
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        if (data.error.includes('not found')) {
          console.error(chalk.gray('Tip: Check spelling or try a different protocol name'));
        }
        process.exit(1);
      }

      // Handle tvl_total - might be array (historical) or number
      let tvl = 0;
      if (Array.isArray(data.tvl_total) && data.tvl_total.length > 0) {
        tvl = data.tvl_total[data.tvl_total.length - 1].totalLiquidityUSD || 0;
      } else if (typeof data.tvl_total === 'number') {
        tvl = data.tvl_total;
      }

      // Handle tvl_solana - might be array or number
      let solanaTvl = 0;
      if (Array.isArray(data.tvl_solana) && data.tvl_solana.length > 0) {
        solanaTvl = data.tvl_solana[data.tvl_solana.length - 1].totalLiquidityUSD || 0;
      } else if (typeof data.tvl_solana === 'number') {
        solanaTvl = data.tvl_solana;
      } else if (data.chain_breakdown && data.chain_breakdown.Solana) {
        const solanaData = data.chain_breakdown.Solana;
        if (Array.isArray(solanaData.tvl) && solanaData.tvl.length > 0) {
          solanaTvl = solanaData.tvl[solanaData.tvl.length - 1].totalLiquidityUSD || 0;
        } else if (typeof solanaData === 'number') {
          solanaTvl = solanaData;
        }
      }

      const changes = data.changes || {};
      const change24h = changes['1d'] || changes['24h'] || 0;
      const change7d = changes['7d'] || 0;

      // Clean, minimal output
      console.log();
      console.log(chalk.bold(data.protocol || 'Unknown'));
      console.log(chalk.dim(data.category || 'Unknown'));
      console.log();

      const tvlStr = tvl >= 1e9 ? `$${(tvl / 1e9).toFixed(2)}B` : `$${(tvl / 1e6).toFixed(2)}M`;
      const solanaTvlStr = solanaTvl >= 1e9 ? `$${(solanaTvl / 1e9).toFixed(2)}B` : `$${(solanaTvl / 1e6).toFixed(2)}M`;

      console.log(`  Total TVL:   ${chalk.yellow(tvlStr)}`);
      console.log(`  Solana TVL:  ${chalk.yellow(solanaTvlStr)}`);

      // Only show changes if we have data
      if (change24h !== 0 || change7d !== 0) {
        console.log();
        if (change24h !== 0) {
          const change24hColor = change24h >= 0 ? chalk.green : chalk.red;
          const change24hStr = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
          console.log(`  24h Change:  ${change24hColor(change24hStr)}`);
        }
        if (change7d !== 0) {
          const change7dColor = change7d >= 0 ? chalk.green : chalk.red;
          const change7dStr = change7d >= 0 ? `+${change7d.toFixed(2)}%` : `${change7d.toFixed(2)}%`;
          console.log(`  7d Change:   ${change7dColor(change7dStr)}`);
        }
      }

      console.log();
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 7: Top Protocols
program
  .command('top')
  .description('Get top Solana DeFi protocols by TVL')
  .option('-l, --limit <number>', 'Number of protocols (default: 10, max: 50)', '10')
  .option('-c, --category <category>', 'Filter by category (Lending, DEX, Liquid Staking, etc.)')
  .option('--json', 'Output raw JSON')
  .action(async (options: { limit?: string; category?: string; json?: boolean }) => {
    try {
      const limit = options.limit ? parseInt(options.limit, 10) : undefined;
      const result = await getTopProtocolsTool(limit, options.category);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) process.exit(1);
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        process.exit(1);
      }

      // Clean, minimal output
      const filterText = options.category ? ` · ${options.category}` : '';
      const totalTvl = data.protocols.reduce((sum: number, p: any) => sum + (p.tvl_solana || 0), 0);

      console.log();
      console.log(chalk.bold(`Top ${data.protocols.length} Protocols`));
      console.log(chalk.gray(`Solana${filterText} · $${(totalTvl / 1e9).toFixed(2)}B total`));
      console.log();

      data.protocols.forEach((protocol: any, index: number) => {
        const change24h = protocol.changes?.['1d'] || 0;
        const changeColor = change24h >= 0 ? chalk.green : chalk.red;
        const changeText = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
        const tvlStr = `$${(protocol.tvl_solana / 1e6).toFixed(2)}M`;

        console.log(`  ${chalk.dim(`${index + 1}.`.padEnd(4))}${chalk.bold(protocol.name.padEnd(20))} ${chalk.yellow(tvlStr.padEnd(12))} ${changeColor(changeText.padEnd(8))} ${chalk.dim(protocol.category)}`);
      });

      console.log();
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 8: Send Telegram Alert
program
  .command('alert <chat_id> <message>')
  .description('Send a message to Telegram')
  .option('-s, --severity <level>', 'Severity level (info, warning, critical)', 'info')
  .option('--json', 'Output raw JSON')
  .action(async (chatId: string, message: string, options: { severity?: string; json?: boolean }) => {
    try {
      const severity = (options.severity || 'info') as 'info' | 'warning' | 'critical';
      const result = await sendTelegramAlertTool(chatId, message, severity);
      const data = JSON.parse(result);

      if (options.json) {
        console.log(result);
        if (data.error) process.exit(1);
        return;
      }

      if (data.error) {
        console.error(chalk.red('✖ Error:', data.error));
        if (data.error.includes('TELEGRAM_BOT_TOKEN')) {
          console.error(chalk.gray('Tip: Set TELEGRAM_BOT_TOKEN in your .env file'));
        }
        process.exit(1);
      }

      console.log(chalk.green('\n✓ Message sent successfully to Telegram!'));
      console.log(chalk.gray(`  Chat ID: ${data.chat_id}`));
      console.log(chalk.gray(`  Severity: ${data.severity}`));
      console.log();
    } catch (error: any) {
      console.error(chalk.red('✖ Error:', error.message));
      process.exit(1);
    }
  });

// Command 9: Chat (Agentic Mode) - ENHANCED
program
  .command('chat')
  .description('Start an interactive AI chat session')
  .option('-p, --provider <provider>', 'LLM provider (anthropic, openai, google, groq, ollama)')
  .option('-m, --model <model>', 'Model name (e.g., gpt-4, claude-3-5-sonnet)')
  .option('--local', 'Use local Ollama instead of cloud providers')
  .option('--no-privacy-warning', 'Skip privacy warning')
  .option('--save <name>', 'Save conversation with this name when done')
  .option('--load <name>', 'Load a saved conversation')
  .option('--stream', 'Enable streaming responses (real-time output)')
  .action(async (options: {
    provider?: string;
    model?: string;
    local?: boolean;
    privacyWarning?: boolean;
    save?: string;
    load?: string;
    stream?: boolean;
  }) => {
    try {
      // Load config once
      const config = getConfig();

      // Determine provider (priority: --local flag > CLI flag > config > auto-detect)
      let provider: LLMProvider;
      if (options.local) {
        provider = 'ollama';
      } else if (options.provider) {
        provider = options.provider as LLMProvider;
      } else {
        const configProvider = config.get('llm.provider');
        provider = configProvider || autoDetectProvider();
      }

      // Determine model (priority: CLI flag > config > provider default)
      const model = options.model || config.get('llm.model');

      // Privacy warning (unless disabled or using local)
      if (options.privacyWarning !== false && provider !== 'ollama') {
        console.log(chalk.yellow(`
⚠️  Privacy Notice:
Your queries (including wallet addresses) will be sent to ${provider.toUpperCase()}.
For sensitive data, use: ${chalk.bold('corvus chat --local')}
`));
      }

      // Create LLM client
      let client;
      try {
        client = createLLMClient({ provider, model });
      } catch (error: any) {
        console.error(chalk.red('✖ Error:', error.message));
        console.log(chalk.gray(`\nAvailable providers: ${getAvailableProviders().join(', ')}`));
        console.log(chalk.gray(`\nTo set up API keys, add to your .env file:`));
        console.log(chalk.gray('  ANTHROPIC_API_KEY=sk-ant-...'));
        console.log(chalk.gray('  OPENAI_API_KEY=sk-...'));
        console.log(chalk.gray('  GOOGLE_API_KEY=...'));
        console.log(chalk.gray('  GROQ_API_KEY=...'));
        console.log(chalk.gray(`\nTo see available models: ${chalk.bold('corvus models')}`));
        process.exit(1);
      }

      // Create chat session
      const session = new ChatSessionManager(client);
      let sessionName = options.save || options.load;

      // Load saved session if requested
      if (options.load) {
        const storage = getSessionStorage();
        const savedSession = storage.load(options.load);
        if (savedSession) {
          session.loadSession(savedSession);
          console.log(chalk.green(`\n✓ Loaded session: ${options.load}`));
        } else {
          console.log(chalk.yellow(`\n⚠️  Session '${options.load}' not found, starting new session`));
        }
      }

      // Display welcome message (clean & minimal)
      console.log();
      console.log(chalk.bold('Corvus'));
      console.log(chalk.dim(`${provider}:${client.model}${options.stream ? ' · streaming' : ''}`));
      console.log(chalk.dim('Type /help for commands\n'));

      // Create readline interface
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.cyan('You: '),
      });

      rl.prompt();

      rl.on('line', async (line) => {
        const input = line.trim();

        // Handle in-chat commands
        if (input.startsWith('/')) {
          const [cmd, ...args] = input.slice(1).split(' ');
          const storage = getSessionStorage();

          switch (cmd.toLowerCase()) {
            case 'help':
              console.log(chalk.cyan('\n📚 In-Chat Commands:\n'));
              console.log(chalk.gray('  /help          - Show this help'));
              console.log(chalk.gray('  /save <name>   - Save current conversation'));
              console.log(chalk.gray('  /load <name>   - Load a saved conversation'));
              console.log(chalk.gray('  /list          - List saved conversations'));
              console.log(chalk.gray('  /export <name> - Export session to markdown'));
              console.log(chalk.gray('  /cost          - Show cost summary'));
              console.log(chalk.gray('  /clear         - Clear terminal and conversation'));
              console.log(chalk.gray('  exit           - Exit chat (or Ctrl+C)'));

              console.log(chalk.cyan('\n⚙️  Settings & Configuration:\n'));
              console.log(chalk.yellow('  Exit chat first, then run these commands:\n'));
              console.log(chalk.gray('  • View available models:'));
              console.log(chalk.gray('    corvus models [provider]'));
              console.log(chalk.gray('    Example: corvus models ollama\n'));

              console.log(chalk.gray('  • Change default provider:'));
              console.log(chalk.gray('    corvus config set llm.provider <provider>'));
              console.log(chalk.gray('    Providers: ollama, groq, anthropic, openai, google\n'));

              console.log(chalk.gray('  • Change default model:'));
              console.log(chalk.gray('    corvus config set llm.model <model>'));
              console.log(chalk.gray('    Example: corvus config set llm.model llama3.2\n'));

              console.log(chalk.gray('  • Remove model setting (use provider defaults):'));
              console.log(chalk.gray('    corvus config delete llm.model\n'));

              console.log(chalk.gray('  • View all settings:'));
              console.log(chalk.gray('    corvus config list\n'));

              console.log(chalk.cyan('🚀 Start New Chat with Different Model/Provider:\n'));
              console.log(chalk.gray('  corvus chat --local                    (Free, Private)'));
              console.log(chalk.gray('  corvus chat --provider groq            (Fast, Cheap)'));
              console.log(chalk.gray('  corvus chat --provider anthropic       (High Quality)'));
              console.log(chalk.gray('  corvus chat --model gpt-4o-mini        (Specific Model)'));
              console.log(chalk.gray('  corvus chat --stream                   (Real-time Output)'));

              console.log(chalk.cyan('\n💡 Pro Tips:\n'));
              console.log(chalk.gray('  • Use --local for free, private AI (Ollama)'));
              console.log(chalk.gray('  • Check /cost regularly to monitor spending'));
              console.log(chalk.gray('  • Save important conversations with /save'));
              console.log(chalk.gray('  • Stream for real-time responses: --stream flag'));
              console.log(chalk.gray('  • Set defaults once: corvus config set ...\n'));
              break;

            case 'save':
              if (!args[0]) {
                console.log(chalk.red('✖ Usage: /save <name>'));
              } else {
                storage.save(args[0], session.getSession());
                sessionName = args[0];
                console.log(chalk.green(`✓ Saved session as: ${args[0]}\n`));
              }
              break;

            case 'load':
              if (!args[0]) {
                console.log(chalk.red('✖ Usage: /load <name>'));
              } else {
                const loaded = storage.load(args[0]);
                if (loaded) {
                  session.loadSession(loaded);
                  sessionName = args[0];
                  console.log(chalk.green(`✓ Loaded session: ${args[0]}\n`));
                } else {
                  console.log(chalk.red(`✖ Session not found: ${args[0]}\n`));
                }
              }
              break;

            case 'list':
              const sessions = storage.list();
              if (sessions.length === 0) {
                console.log(chalk.dim('\nNo saved sessions\n'));
              } else {
                console.log();
                console.log(chalk.bold('Saved Sessions'));
                sessions.forEach(s => {
                  const date = new Date(s.savedAt).toLocaleDateString();
                  console.log(`  ${s.name} ${chalk.dim(`· ${s.turns} turns · ${date}`)}`);
                });
                console.log();
              }
              break;

            case 'export':
              if (!args[0]) {
                console.log(chalk.red('✖ Usage: /export <name>'));
              } else {
                const markdown = storage.export(args[0], 'markdown');
                if (markdown) {
                  const filename = `${args[0]}.md`;
                  require('fs').writeFileSync(filename, markdown);
                  console.log(chalk.green(`✓ Exported to: ${filename}\n`));
                } else {
                  console.log(chalk.red(`✖ Session not found: ${args[0]}\n`));
                }
              }
              break;

            case 'cost':
              const summary = session.getSessionSummary();
              console.log(chalk.cyan('\n💰 Cost Summary:\n'));
              console.log(chalk.gray(`  Current session: $${summary.cost.toFixed(4)}`));
              console.log(chalk.gray(`  Turns: ${summary.turns}`));
              console.log(chalk.gray(`  Messages: ${summary.messages}\n`));
              break;

            case 'clear':
              // Clear terminal screen
              console.clear();

              // Clear chat history
              session.clearHistory();

              // Show fresh header (clean)
              console.log();
              console.log(chalk.bold('Corvus'));
              console.log(chalk.dim(`${provider}:${client.model}${options.stream ? ' · streaming' : ''}`));
              console.log(chalk.green('✓ Cleared\n'));
              break;

            default:
              console.log(chalk.red(`✖ Unknown command: /${cmd}`));
              console.log(chalk.gray('Type /help for available commands\n'));
          }

          rl.prompt();
          return;
        }

        // Handle exit
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
          // Auto-save if --save was specified
          if (sessionName) {
            const storage = getSessionStorage();
            storage.save(sessionName, session.getSession());
            console.log(chalk.green(`\n✓ Saved session as: ${sessionName}`));
          }

          const summary = session.getSessionSummary();
          console.log(chalk.gray(`\n📊 Session Summary:`));
          console.log(chalk.gray(`  Turns: ${summary.turns}`));
          console.log(chalk.gray(`  Messages: ${summary.messages}`));
          console.log(chalk.gray(`  Duration: ${summary.duration}s`));
          console.log(chalk.gray(`  Estimated cost: $${summary.cost.toFixed(4)}\n`));
          rl.close();
          process.exit(0);
        }

        if (!input) {
          rl.prompt();
          return;
        }

        try {
          // Send message and get response
          if (options.stream) {
            // Streaming mode - display response in real-time
            process.stdout.write(chalk.dim('⋯ '));
            process.stdout.write(chalk.green('Corvus: '));

            let fullResponse = '';
            for await (const chunk of session.sendMessageStream(input)) {
              fullResponse += chunk;
              process.stdout.write(chunk);
            }

            console.log('\n'); // Add newline after stream
          } else {
            // Non-streaming mode - display full response at once
            process.stdout.write(chalk.dim('⋯'));
            const response = await session.sendMessage(input);
            process.stdout.write('\r'); // Clear loading indicator
            console.log(chalk.green('Corvus: ') + response + '\n');
          }
        } catch (error: any) {
          console.error(chalk.red('✖ Error:', error.message));

          if (error.message.includes('Maximum turns')) {
            console.log(chalk.gray('💡 Tip: Type /clear to reset or save and start new\n'));
          }
          if (error.message.includes('cost')) {
            console.log(chalk.gray('💡 Tip: Increase limit with: corvus config set chat.maxCost 2.00\n'));
          }
        }

        rl.prompt();
      });

      rl.on('close', () => {
        console.log(chalk.gray('\nGoodbye! 👋\n'));
        process.exit(0);
      });

    } catch (error: any) {
      console.error(chalk.red('✖ Fatal error:', error.message));
      process.exit(1);
    }
  });

// Command 10: Sessions Management
program
  .command('sessions')
  .description('Manage saved chat sessions')
  .argument('[action]', 'Action: list, delete, export')
  .argument('[name]', 'Session name')
  .option('-f, --format <format>', 'Export format (json, markdown)', 'markdown')
  .action((action?: string, name?: string, options?: { format?: string }) => {
    const storage = getSessionStorage();

    if (!action || action === 'list') {
      const sessions = storage.list();
      if (sessions.length === 0) {
        console.log();
        console.log(chalk.dim('No saved sessions'));
        console.log();
        return;
      }

      // Clean, minimal output
      console.log();
      console.log(chalk.bold('Saved Sessions'));
      console.log(chalk.gray(`${sessions.length} total`));
      console.log();

      sessions.forEach(s => {
        const date = new Date(s.savedAt).toLocaleDateString();
        const time = new Date(s.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log(`  ${chalk.bold(s.name)}`);
        console.log(`    ${s.turns} turns · ${chalk.dim(`${date} ${time}`)}`);
      });

      console.log();
      console.log(chalk.dim(`Directory: ${storage.getSessionsDir()}`));
      console.log();
      return;
    }

    if (action === 'delete') {
      if (!name) {
        console.error(chalk.red('✖ Session name required'));
        console.log(chalk.gray('Usage: corvus sessions delete <name>\n'));
        process.exit(1);
      }

      if (storage.delete(name)) {
        console.log(chalk.green(`\n✓ Deleted session: ${name}\n`));
      } else {
        console.log(chalk.red(`\n✖ Session not found: ${name}\n`));
        process.exit(1);
      }
      return;
    }

    if (action === 'export') {
      if (!name) {
        console.error(chalk.red('✖ Session name required'));
        console.log(chalk.gray('Usage: corvus sessions export <name> [-f markdown|json]\n'));
        process.exit(1);
      }

      const format = (options?.format || 'markdown') as 'json' | 'markdown';
      const content = storage.export(name, format);

      if (!content) {
        console.log(chalk.red(`\n✖ Session not found: ${name}\n`));
        process.exit(1);
      }

      const ext = format === 'markdown' ? 'md' : 'json';
      const filename = `${name}.${ext}`;
      require('fs').writeFileSync(filename, content);
      console.log(chalk.green(`\n✓ Exported to: ${filename}\n`));
      return;
    }

    console.error(chalk.red(`✖ Unknown action: ${action}`));
    console.log(chalk.gray('\nAvailable actions: list, delete, export\n'));
    process.exit(1);
  });

// Command 11: Models List
program
  .command('models')
  .description('List available models for each LLM provider')
  .argument('[provider]', 'Filter by provider (anthropic, openai, google, groq, ollama)')
  .action((provider?: string) => {
    console.log(chalk.cyan('\n🤖 Available Models\n'));

    const providers = provider
      ? [provider as LLMProvider]
      : (['anthropic', 'openai', 'google', 'groq', 'ollama'] as LLMProvider[]);

    providers.forEach(p => {
      const models = AVAILABLE_MODELS[p];
      if (!models) {
        console.error(chalk.red(`✖ Unknown provider: ${p}\n`));
        return;
      }

      console.log(chalk.bold.yellow(`\n${p.toUpperCase()}`));
      console.log(chalk.gray('─'.repeat(60)));

      models.forEach((model, index) => {
        const isDefault = index === 0;
        const defaultTag = isDefault ? chalk.green(' (default)') : '';

        console.log(chalk.bold(`\n${model.name}${defaultTag}`));
        console.log(chalk.gray(`  ID: ${model.id}`));
        console.log(chalk.gray(`  ${model.description}`));
        console.log(chalk.gray(`  Context: ${(model.contextWindow / 1000).toFixed(0)}k tokens`));

        if (model.costPer1M) {
          const cost = model.costPer1M;
          if (cost.input === 0 && cost.output === 0) {
            console.log(chalk.gray(`  Cost: Free (local)`));
          } else {
            console.log(chalk.gray(`  Cost: $${cost.input}/$${cost.output} per 1M tokens (in/out)`));
          }
        }
      });

      console.log(); // Spacing between providers
    });

    console.log(chalk.gray('Usage examples:'));
    console.log(chalk.gray('  corvus chat --provider openai --model gpt-4o-mini'));
    console.log(chalk.gray('  corvus chat --provider anthropic --model claude-3-5-haiku-20241022'));
    console.log(chalk.gray('  corvus config set llm.model gpt-4o-mini'));
    console.log();
    console.log(chalk.yellow('💡 Note: You can use ANY model ID supported by the provider,'));
    console.log(chalk.yellow('   not just the models listed above. This list shows recommended'));
    console.log(chalk.yellow('   models with verified pricing and context limits.\n'));
  });

// Command 12: Config Management
program
  .command('config')
  .description('Manage Corvus configuration')
  .argument('[action]', 'Action: get, set, list, reset')
  .argument('[key]', 'Config key (e.g., llm.provider)')
  .argument('[value]', 'Value to set')
  .action((action?: string, key?: string, value?: string) => {
    const config = getConfig();

    if (!action || action === 'list') {
      // List all config
      const allConfig = config.getAll();
      console.log(chalk.cyan('\n⚙️  Corvus Configuration\n'));
      console.log(JSON.stringify(allConfig, null, 2));
      console.log(chalk.gray(`\nConfig file: ${config.getConfigPath()}\n`));
      return;
    }

    if (action === 'get') {
      if (!key) {
        console.error(chalk.red('✖ Error: Key required for get'));
        console.log(chalk.gray('Example: corvus config get llm.provider\n'));
        process.exit(1);
      }

      const val = config.get(key);
      if (val === undefined) {
        console.error(chalk.red(`✖ Key not found: ${key}\n`));
        process.exit(1);
      }

      console.log(chalk.green(`\n${key} = ${JSON.stringify(val)}\n`));
      return;
    }

    if (action === 'set') {
      if (!key || value === undefined) {
        console.error(chalk.red('✖ Error: Key and value required for set'));
        console.log(chalk.gray('Example: corvus config set llm.provider anthropic\n'));
        process.exit(1);
      }

      // Parse value (handle booleans, numbers, strings)
      let parsedValue: any = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (!isNaN(Number(value))) parsedValue = Number(value);

      config.set(key, parsedValue);
      console.log(chalk.green(`\n✓ Set ${key} = ${JSON.stringify(parsedValue)}\n`));
      return;
    }

    if (action === 'reset') {
      config.reset();
      console.log(chalk.green('\n✓ Configuration reset to defaults\n'));
      return;
    }

    if (action === 'delete') {
      if (!key) {
        console.error(chalk.red('✖ Error: Key required for delete'));
        process.exit(1);
      }

      config.delete(key);
      console.log(chalk.green(`\n✓ Deleted ${key}\n`));
      return;
    }

    if (action === 'path') {
      console.log(chalk.cyan(`\n${config.getConfigPath()}\n`));
      return;
    }

    console.error(chalk.red(`✖ Unknown action: ${action}`));
    console.log(chalk.gray('\nAvailable actions: get, set, list, reset, delete, path\n'));
    process.exit(1);
  });

// Parse and execute
program.parse();
