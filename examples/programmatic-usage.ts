/**
 * Corvus - Programmatic Usage Example
 *
 * This example shows how to use Corvus tools programmatically in your TypeScript/JavaScript code.
 */

import { getSOLBalanceTool } from '../src/tools/balance.js';
import { getTokenPriceTool } from '../src/tools/price.js';
import { analyzeWalletDeFiPositionsTool } from '../src/tools/defi-positions.js';
import { getTopProtocolsTool } from '../src/tools/protocol.js';

/**
 * Example 1: Get wallet balance
 */
async function checkWalletBalance() {
  console.log('=== Wallet Balance ===');

  const wallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  const result = await getSOLBalanceTool(wallet);
  const data = JSON.parse(result);

  if (data.error) {
    console.error('Error:', data.error);
    return;
  }

  console.log(`Balance: ${data.balance_sol} SOL`);
  console.log(`Value: $${data.value_usd?.toFixed(2) || '0.00'}`);
  console.log('');
}

/**
 * Example 2: Get token prices
 */
async function checkTokenPrices() {
  console.log('=== Token Prices ===');

  const result = await getTokenPriceTool('SOL,USDC,JitoSOL');
  const data = JSON.parse(result);

  if (data.error) {
    console.error('Error:', data.error);
    return;
  }

  for (const price of data.prices) {
    if (price.error) {
      console.log(`${price.token}: ${price.error}`);
    } else {
      console.log(`${price.symbol}: $${price.price_usd?.toFixed(6) || 'N/A'}`);
    }
  }
  console.log('');
}

/**
 * Example 3: Analyze DeFi positions
 */
async function analyzeDeFiPositions() {
  console.log('=== DeFi Position Analysis ===');

  const wallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  const result = await analyzeWalletDeFiPositionsTool(wallet);
  const data = JSON.parse(result);

  if (data.error) {
    console.error('Error:', data.error);
    return;
  }

  console.log(`Known DeFi Positions: ${data.known_positions?.length || 0}`);
  console.log(`Likely DeFi Tokens: ${data.likely_defi?.length || 0}`);
  console.log(`Unclassified Tokens: ${data.unclassified?.length || 0}`);
  console.log(`Total Portfolio Value: $${data.summary?.total_estimated_usd?.toFixed(2) || '0.00'}`);
  console.log('');
}

/**
 * Example 4: Get top protocols
 */
async function getTopProtocols() {
  console.log('=== Top Solana Protocols ===');

  const result = await getTopProtocolsTool(5);
  const data = JSON.parse(result);

  if (data.error) {
    console.error('Error:', data.error);
    return;
  }

  for (const protocol of data.protocols) {
    const tvl = (protocol.tvl_solana / 1e6).toFixed(2);
    const change = protocol.changes?.['1d'] || 0;
    console.log(`${protocol.name}: $${tvl}M (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`);
  }
  console.log('');
}

/**
 * Example 5: Custom analysis - Find all wallets with >$1000 in DeFi
 */
async function findWhales() {
  console.log('=== Find DeFi Whales ===');

  const wallets = [
    '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    'GK3Mi7bZY5ccgeeZCzNDvc4WZFQoqKSSWHJ6e44JfjZW',
    // Add more wallets to check
  ];

  for (const wallet of wallets) {
    const result = await analyzeWalletDeFiPositionsTool(wallet);
    const data = JSON.parse(result);

    if (!data.error && data.summary) {
      const defiValue = data.summary.total_known_defi_value || 0;

      if (defiValue > 1000) {
        console.log(`${wallet.slice(0, 8)}... has $${defiValue.toFixed(2)} in DeFi`);
      }
    }
  }
  console.log('');
}

/**
 * Run all examples
 */
async function main() {
  // Make sure you have HELIUS_API_KEY in your .env file

  try {
    await checkWalletBalance();
    await checkTokenPrices();
    await analyzeDeFiPositions();
    await getTopProtocols();
    await findWhales();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  checkWalletBalance,
  checkTokenPrices,
  analyzeDeFiPositions,
  getTopProtocols,
  findWhales
};
