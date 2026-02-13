import fetch from "node-fetch";
import { ApiCallResult, Protocol, TokenPrice } from "../types";

const DEFILLAMA_API = "https://api.llama.fi";
const DEFILLAMA_COINS_API = "https://coins.llama.fi";
const JUPITER_PRICE_API = "https://price.jup.ag/v6";
const PUMPFUN_API = "https://frontend-api.pump.fun";

// Cache for protocol list (refreshed every 5 minutes)
let protocolsCache: Protocol[] = [];
let protocolsCacheTime: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Safe API call wrapper with timeout and error handling
 */
async function safeApiCall<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  context: string,
  timeoutMs: number = 5000
): Promise<ApiCallResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fn(controller.signal);
    clearTimeout(timeout);
    return { data: result };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return {
        error: `${context} did not respond within ${timeoutMs / 1000} seconds. Try again.`,
      };
    }
    // Sanitize error messages
    const sanitizedMessage = err.code === "ECONNREFUSED"
      ? "Service temporarily unavailable"
      : "Request failed";
    return {
      error: `${context}: ${sanitizedMessage}`,
    };
  }
}

/**
 * Get all protocols and cache them
 */
async function getAllProtocols(): Promise<ApiCallResult<Protocol[]>> {
  const now = Date.now();

  // Return cached data if still valid
  if (protocolsCache.length > 0 && now - protocolsCacheTime < CACHE_DURATION_MS) {
    return { data: protocolsCache };
  }

  const result = await safeApiCall(async (signal) => {
    const response = await fetch(`${DEFILLAMA_API}/protocols`, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: any = await response.json();
    return data as Protocol[];
  }, "DefiLlama Protocols API", 10000); // Longer timeout for large response

  if (result.data) {
    protocolsCache = result.data;
    protocolsCacheTime = now;
  }

  return result;
}

/**
 * Get Solana protocols only
 */
export async function getSolanaProtocols(): Promise<ApiCallResult<Protocol[]>> {
  const result = await getAllProtocols();

  if (result.error) {
    return result;
  }

  const solanaProtocols = result.data!.filter((p: any) => {
    // Check multiple possible fields
    return (
      (p.chainTvls && p.chainTvls["Solana"] !== undefined) ||
      (p.chain_tvls && p.chain_tvls["Solana"] !== undefined) ||
      (p.chains && Array.isArray(p.chains) && p.chains.includes("Solana"))
    );
  });

  return { data: solanaProtocols };
}

/**
 * Get top Solana protocols by TVL
 */
export async function getTopSolanaProtocols(
  limit: number = 10,
  category?: string
): Promise<ApiCallResult<Protocol[]>> {
  const result = await getSolanaProtocols();

  if (result.error) {
    return result;
  }

  let protocols = result.data!;

  // Filter by category if specified
  if (category) {
    protocols = protocols.filter(
      (p) => p.category?.toLowerCase() === category.toLowerCase()
    );
  }

  // Sort by Solana TVL and take top N
  protocols.sort((a: any, b: any) => {
    const tvlA = a.chainTvls?.["Solana"] || a.chain_tvls?.["Solana"] || 0;
    const tvlB = b.chainTvls?.["Solana"] || b.chain_tvls?.["Solana"] || 0;
    return tvlB - tvlA;
  });

  return { data: protocols.slice(0, limit) };
}

/**
 * Get specific protocol by name/slug (fuzzy match)
 */
export async function getProtocol(
  nameOrSlug: string
): Promise<ApiCallResult<Protocol>> {
  const result = await getSolanaProtocols();

  if (result.error) {
    return { error: result.error };
  }

  const searchTerm = nameOrSlug.toLowerCase().trim();

  // Try exact slug match first
  let protocol = result.data!.find((p) => p.slug === searchTerm);

  // Try exact name match
  if (!protocol) {
    protocol = result.data!.find((p) => p.name.toLowerCase() === searchTerm);
  }

  // Try partial match
  if (!protocol) {
    protocol = result.data!.find(
      (p) =>
        p.slug.includes(searchTerm) || p.name.toLowerCase().includes(searchTerm)
    );
  }

  if (!protocol) {
    return {
      error: `Could not find Solana protocol matching "${nameOrSlug}". Try searching for: ${result.data!.slice(0, 5).map((p) => p.name).join(", ")}, etc.`,
    };
  }

  // Fetch detailed data for this protocol
  return safeApiCall(async (signal) => {
    const response = await fetch(`${DEFILLAMA_API}/protocol/${protocol!.slug}`, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: any = await response.json();
    return data as Protocol;
  }, "DefiLlama Protocol API");
}

/**
 * Get token prices from Pump.fun (for bonding curve tokens)
 * Only works for tokens still on Pump.fun bonding curve (not graduated)
 */
async function getPumpFunPrices(
  mints: string[]
): Promise<Record<string, TokenPrice>> {
  if (mints.length === 0) {
    return {};
  }

  const prices: Record<string, TokenPrice> = {};

  // Pump.fun API doesn't support batch requests, so we query individually
  // Only query first 10 to avoid rate limits
  const mintsToCheck = mints.slice(0, 10);

  for (const mint of mintsToCheck) {
    try {
      const url = `${PUMPFUN_API}/coins/${mint}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        continue; // Skip this token
      }

      const data: any = await response.json();

      // Pump.fun returns market_cap and sometimes price in USD
      if (data && (data.usd_market_cap || data.price_usd)) {
        prices[mint] = {
          mint,
          symbol: data.symbol || "UNKNOWN",
          price: data.price_usd || (data.usd_market_cap / (data.total_supply || 1)),
          decimals: 6, // Pump.fun tokens are typically 6 decimals
          confidence: 0.85, // Bonding curve prices are reliable but slightly lower confidence
          timestamp: Date.now() / 1000,
        };
      }
    } catch (error) {
      // Silently skip failed tokens
      continue;
    }
  }

  return prices;
}

/**
 * Get token prices from Jupiter (fallback for DEX tokens)
 * Jupiter aggregates from ALL Solana DEXes (Raydium, Orca, Pump.fun graduated, etc.)
 */
async function getJupiterPrices(
  mints: string[]
): Promise<Record<string, TokenPrice>> {
  if (mints.length === 0) {
    return {};
  }

  try {
    const ids = mints.join(",");
    const url = `${JUPITER_PRICE_API}/price?ids=${ids}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return {};
    }

    const data: any = await response.json();

    if (!data.data) {
      return {};
    }

    const prices: Record<string, TokenPrice> = {};

    for (const [mint, priceData] of Object.entries(data.data)) {
      const jupData: any = priceData;

      prices[mint] = {
        mint,
        symbol: jupData.mintSymbol || "UNKNOWN",
        price: jupData.price,
        decimals: 0,
        confidence: 0.9, // Jupiter is reliable for DEX prices
        timestamp: Date.now() / 1000,
      };
    }

    return prices;
  } catch (error) {
    // Silently fail - this is a fallback source
    return {};
  }
}

/**
 * Get token prices by mint addresses
 * Uses DefiLlama first, then Jupiter as fallback for DEX tokens
 */
export async function getTokenPrices(
  mints: string[]
): Promise<ApiCallResult<Record<string, TokenPrice>>> {
  if (mints.length === 0) {
    return { data: {} };
  }

  // Step 1: Try DefiLlama first
  const defiLlamaResult = await safeApiCall(async (signal) => {
    const coins = mints.map((mint) => `solana:${mint}`).join(",");
    const url = `${DEFILLAMA_COINS_API}/prices/current/${coins}`;

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: any = await response.json();

    if (!data.coins) {
      return {};
    }

    const prices: Record<string, TokenPrice> = {};

    for (const [key, value] of Object.entries(data.coins)) {
      const mint = key.replace("solana:", "");
      const priceData: any = value;

      prices[mint] = {
        mint,
        symbol: priceData.symbol,
        price: priceData.price,
        decimals: priceData.decimals || 0,
        confidence: priceData.confidence || 0,
        timestamp: priceData.timestamp || Date.now() / 1000,
      };
    }

    return prices;
  }, "DefiLlama Coins API");

  // Step 2: If DefiLlama failed entirely, return error
  if (defiLlamaResult.error) {
    return defiLlamaResult;
  }

  const prices = defiLlamaResult.data!;

  // Step 3: Find mints without prices
  const missingMints = mints.filter(mint => !prices[mint]);

  // Step 4: Try Jupiter for missing tokens (graduated Pump.fun, DEX tokens, etc.)
  let jupiterCount = 0;
  if (missingMints.length > 0) {
    const jupiterPrices = await getJupiterPrices(missingMints);

    // Merge Jupiter prices into results
    for (const [mint, price] of Object.entries(jupiterPrices)) {
      prices[mint] = price;
      jupiterCount++;
    }
  }

  // Step 5: Find still-missing mints after Jupiter
  const stillMissing = mints.filter(mint => !prices[mint]);

  // Step 6: Try Pump.fun API for bonding curve tokens
  let pumpfunCount = 0;
  if (stillMissing.length > 0) {
    const pumpfunPrices = await getPumpFunPrices(stillMissing);

    // Merge Pump.fun prices into results
    for (const [mint, price] of Object.entries(pumpfunPrices)) {
      prices[mint] = price;
      pumpfunCount++;
    }
  }

  // Add metadata about sources (for debugging/transparency)
  const result: any = { data: prices };
  if (jupiterCount > 0 || pumpfunCount > 0) {
    result._pricing_meta = {
      defillama_prices: mints.length - missingMints.length,
      jupiter_fallback_prices: jupiterCount,
      pumpfun_bonding_curve_prices: pumpfunCount,
      total_priced: Object.keys(prices).length,
      note: "Using DefiLlama (major tokens) → Jupiter (DEX tokens) → Pump.fun (bonding curve) fallback"
    };
  }

  return result;
}
