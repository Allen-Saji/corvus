import { validateSolanaAddress } from "../lib/validation";
import { getTokenBalances } from "../lib/helius";
import { getTokenPrices } from "../lib/defillama";
import { getKnownDeFiEntry, classifyUnknownToken } from "../data/defi-registry";
import { DeFiPosition } from "../types";

/**
 * Tool 7: Analyze wallet DeFi positions
 *
 * This is the differentiator - comprehensive DeFi position analysis with
 * 3-bucket classification: Known → Likely DeFi → Unclassified
 */
export async function analyzeWalletDeFiPositionsTool(
  wallet: string
): Promise<string> {
  // Validate wallet address
  const validation = validateSolanaAddress(wallet);
  if (!validation.valid) {
    return JSON.stringify({
      error: validation.error,
      _meta: {
        tool: "analyze_wallet_defi_positions",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Step 1: Fetch all tokens from wallet
  const tokensResult = await getTokenBalances(wallet);
  if (tokensResult.error) {
    return JSON.stringify({
      error: tokensResult.error,
      _meta: {
        tool: "analyze_wallet_defi_positions",
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (!tokensResult.data) {
    return JSON.stringify({
      error: "No token data returned from API",
      _meta: {
        tool: "analyze_wallet_defi_positions",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const allTokens = tokensResult.data;

  // Step 2: Batch price all tokens
  const mints = allTokens.map((t) => t.mint);
  const pricesResult = await getTokenPrices(mints);
  const prices = pricesResult.data || {};

  // Track metadata
  const tokensWithPrice = Object.keys(prices).length;
  const tokensWithoutPrice = mints.length - tokensWithPrice;

  // Step 3: Merge price data into tokens and validate numeric values
  const tokensWithPrices = allTokens.map((token) => {
    // Validate balance is a valid number
    const balance =
      typeof token.balance === "number" &&
      isFinite(token.balance) &&
      token.balance >= 0
        ? token.balance
        : 0;

    const price = prices[token.mint]?.price;
    const value = price && isFinite(price) ? balance * price : undefined;

    return {
      ...token,
      balance, // Use validated balance
      price_usd: price,
      value_usd: value,
    };
  });

  // Step 4: Filter dust
  const DUST_USD_THRESHOLD = 1.0;
  const DUST_BALANCE_THRESHOLD = 0.01;

  const filteredTokens = tokensWithPrices.filter((token) => {
    // Keep if has USD value above threshold
    if (token.value_usd && token.value_usd >= DUST_USD_THRESHOLD) {
      return true;
    }
    // Keep if no price but balance is significant
    if (!token.price_usd && token.balance >= DUST_BALANCE_THRESHOLD) {
      return true;
    }
    // Filter out dust
    return false;
  });

  const dustFiltered = allTokens.length - filteredTokens.length;

  // Step 5: Classify into 3 buckets
  const knownPositions: DeFiPosition[] = [];
  const likelyDeFi: DeFiPosition[] = [];
  const unclassified: DeFiPosition[] = [];

  for (const token of filteredTokens) {
    // Bucket 1: Check known DeFi registry
    const knownEntry = getKnownDeFiEntry(token.mint);

    // Exclude base assets and stablecoins from DeFi classification
    if (knownEntry && knownEntry.category !== "Base Asset" && knownEntry.category !== "Stablecoin") {
      knownPositions.push({
        mint: token.mint,
        symbol: token.symbol || knownEntry.symbol,
        name: token.name || knownEntry.name,
        balance: token.balance,
        price_usd: token.price_usd,
        value_usd: token.value_usd,
        protocol: knownEntry.protocol,
        category: knownEntry.category,
        confidence: "high",
        note: knownEntry.description,
      });
      continue;
    }

    // Bucket 2: Heuristic classification
    const { score, signals } = classifyUnknownToken(
      token.symbol,
      token.name,
      !!token.price_usd
    );

    if (score >= 2) {
      // Likely DeFi
      let note = `Likely a DeFi position based on: ${signals.join(", ")}.`;
      if (!token.price_usd) {
        note += " No market price available - receipt tokens are typically not traded directly.";
      }

      likelyDeFi.push({
        mint: token.mint,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        price_usd: token.price_usd,
        value_usd: token.value_usd,
        confidence: "medium",
        signals,
        note,
      });
      continue;
    }

    // Bucket 3: Unclassified
    unclassified.push({
      mint: token.mint,
      symbol: token.symbol,
      name: token.name,
      balance: token.balance,
      price_usd: token.price_usd,
      value_usd: token.value_usd,
      confidence: "none",
      note: "Could not classify this token. Showing raw data.",
    });
  }

  // Step 6: Calculate summary
  const totalKnownValue = knownPositions.reduce(
    (sum, p) => sum + (p.value_usd || 0),
    0
  );
  const totalLikelyValue = likelyDeFi.reduce(
    (sum, p) => sum + (p.value_usd || 0),
    0
  );
  const totalUnclassifiedValue = unclassified.reduce(
    (sum, p) => sum + (p.value_usd || 0),
    0
  );

  // Step 7: Build response
  return JSON.stringify(
    {
      wallet,
      summary: {
        total_known_value_usd: totalKnownValue,
        total_likely_defi_value_usd: totalLikelyValue,
        total_unclassified_value_usd: totalUnclassifiedValue,
        total_estimated_usd:
          totalKnownValue + totalLikelyValue + totalUnclassifiedValue,
        known_positions_count: knownPositions.length,
        likely_defi_count: likelyDeFi.length,
        unclassified_count: unclassified.length,
        dust_filtered: dustFiltered,
      },
      known_positions: knownPositions,
      likely_defi: likelyDeFi,
      unclassified: unclassified,
      limitations: [
        "Orca Whirlpool and Raydium CLMM concentrated liquidity positions are NFT-based and not included in this scan",
        "Drift, Zeta, and other margin trading positions are stored in program accounts, not as wallet tokens",
        "Some Kamino vault tokens may appear in 'likely_defi' instead of 'known' - Kamino mints new tokens per vault",
        "Prices shown are current spot prices from DefiLlama, not entry prices or underlying vault values",
        "Receipt tokens (LP tokens, vault tokens) typically have no market price - their value depends on the underlying protocol",
        "Token scan limited to 100 tokens - wallets with more tokens may have incomplete results",
      ],
      _meta: {
        data_source: "Helius DAS API + DefiLlama Coins API",
        timestamp: new Date().toISOString(),
        tokens_scanned: allTokens.length,
        tokens_after_dust_filter: filteredTokens.length,
        dust_filtered: dustFiltered,
        tokens_priced: tokensWithPrice,
        tokens_unpriced: tokensWithoutPrice,
        classification: {
          known: knownPositions.length,
          likely_defi: likelyDeFi.length,
          unclassified: unclassified.length,
        },
      },
    },
    null,
    2
  );
}
