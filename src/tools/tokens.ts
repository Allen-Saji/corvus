import { validateSolanaAddress } from "../lib/validation";
import { getTokenBalances } from "../lib/helius";
import { getTokenPrices } from "../lib/defillama";

/**
 * Tool 2: Get all token balances for a wallet
 */
export async function getTokenBalancesTool(wallet: string): Promise<string> {
  // Validate input
  const validation = validateSolanaAddress(wallet);
  if (!validation.valid) {
    return JSON.stringify({
      error: validation.error,
      _meta: {
        tool: "get_token_balances",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Fetch token balances
  const tokensResult = await getTokenBalances(wallet);
  if (tokensResult.error) {
    return JSON.stringify({
      error: tokensResult.error,
      _meta: {
        tool: "get_token_balances",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const tokens = tokensResult.data!;

  // Get all mint addresses for price lookup
  const mints = tokens.map((t) => t.mint);

  // Fetch prices for all tokens
  const pricesResult = await getTokenPrices(mints);
  const prices = pricesResult.data || {};

  // Merge prices into token data
  const tokensWithPrices = tokens.map((token) => {
    const price = prices[token.mint]?.price;
    return {
      ...token,
      price_usd: price,
      value_usd: price ? token.balance * price : undefined,
    };
  });

  // Calculate total value
  const totalValue = tokensWithPrices.reduce(
    (sum, t) => sum + (t.value_usd || 0),
    0
  );

  const priced = tokensWithPrices.filter((t) => t.price_usd !== undefined).length;
  const unpriced = tokens.length - priced;

  return JSON.stringify(
    {
      wallet,
      token_count: tokens.length,
      tokens: tokensWithPrices,
      summary: {
        total_value_usd: totalValue,
        tokens_priced: priced,
        tokens_unpriced: unpriced,
      },
      _meta: {
        data_source: "Helius DAS API + DefiLlama Coins API",
        timestamp: new Date().toISOString(),
        note:
          unpriced > 0
            ? `${unpriced} token(s) have no market price available from DefiLlama`
            : "All tokens successfully priced",
      },
    },
    null,
    2
  );
}
