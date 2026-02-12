import { getTokenPrices } from "../lib/defillama";
import { resolveMint } from "../data/token-registry";

/**
 * Tool 4: Get token prices
 */
export async function getTokenPriceTool(tokens: string): Promise<string> {
  if (!tokens || tokens.trim() === "") {
    return JSON.stringify({
      error: "No tokens provided. Specify token symbols (SOL, USDC) or mint addresses.",
      _meta: {
        tool: "get_token_price",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Parse comma-separated list and resolve symbols to mints
  const tokenList = tokens
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // Enforce maximum token limit for security
  const MAX_TOKENS = 50;
  if (tokenList.length > MAX_TOKENS) {
    return JSON.stringify({
      error: `Maximum ${MAX_TOKENS} tokens allowed per request. You requested ${tokenList.length}.`,
      _meta: {
        tool: "get_token_price",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const mints = tokenList.map((token) => resolveMint(token));

  // Fetch prices
  const pricesResult = await getTokenPrices(mints);

  if (pricesResult.error) {
    return JSON.stringify({
      error: pricesResult.error,
      _meta: {
        tool: "get_token_price",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const prices = pricesResult.data!;

  // Build response array
  const results = tokenList.map((originalToken, index) => {
    const mint = mints[index];
    const priceData = prices[mint];

    if (!priceData) {
      return {
        token: originalToken,
        mint,
        error: "Price unavailable — this token is not tracked by DefiLlama's price oracle",
      };
    }

    return {
      token: originalToken,
      mint,
      symbol: priceData.symbol,
      price_usd: priceData.price,
      confidence: priceData.confidence,
      decimals: priceData.decimals,
    };
  });

  const found = results.filter((r) => !r.error).length;
  const notFound = results.length - found;

  return JSON.stringify(
    {
      requested: tokenList.length,
      found,
      not_found: notFound,
      prices: results,
      _meta: {
        data_source: "DefiLlama Coins API",
        timestamp: new Date().toISOString(),
        note:
          notFound > 0
            ? `${notFound} token(s) not found. Very new or low-liquidity tokens may not be tracked.`
            : "All tokens successfully priced",
      },
    },
    null,
    2
  );
}
