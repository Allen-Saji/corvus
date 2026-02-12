import fetch from "node-fetch";
import { ApiCallResult, Protocol, TokenPrice } from "../types";

const DEFILLAMA_API = "https://api.llama.fi";
const DEFILLAMA_COINS_API = "https://coins.llama.fi";

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
 * Get token prices by mint addresses
 */
export async function getTokenPrices(
  mints: string[]
): Promise<ApiCallResult<Record<string, TokenPrice>>> {
  if (mints.length === 0) {
    return { data: {} };
  }

  return safeApiCall(async (signal) => {
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
}
