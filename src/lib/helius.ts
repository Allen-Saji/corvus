import fetch from "node-fetch";
import { ApiCallResult, TokenBalance, Transaction } from "../types";

function getHeliusApiKey(): string {
  const key = process.env.HELIUS_API_KEY || "";
  if (!key) {
    throw new Error("HELIUS_API_KEY environment variable is not set");
  }
  return key;
}

function getHeliusRpcUrl(): string {
  return `https://mainnet.helius-rpc.com/`;
}

function getHeliusApiUrl(): string {
  return `https://api.helius.xyz/v0`;
}

function getHeliusHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getHeliusApiKey()}`,
  };
}

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
    // Sanitize error messages - don't expose internal details
    const sanitizedMessage = err.code === "ECONNREFUSED"
      ? "Service temporarily unavailable"
      : "Request failed";
    return {
      error: `${context}: ${sanitizedMessage}`,
    };
  }
}

/**
 * Get SOL balance for a wallet
 */
export async function getSolBalance(
  wallet: string
): Promise<ApiCallResult<{ balance_sol: number; balance_lamports: number }>> {
  return safeApiCall(async (signal) => {
    const response = await fetch(getHeliusRpcUrl(), {
      method: "POST",
      headers: getHeliusHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [wallet],
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: any = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "RPC error");
    }

    const lamports = data.result.value;
    return {
      balance_sol: lamports / 1e9,
      balance_lamports: lamports,
    };
  }, "Helius RPC");
}

/**
 * Get all token balances for a wallet using DAS API
 */
export async function getTokenBalances(
  wallet: string
): Promise<ApiCallResult<TokenBalance[]>> {
  return safeApiCall(async (signal) => {
    const response = await fetch(getHeliusRpcUrl(), {
      method: "POST",
      headers: getHeliusHeaders(),
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAssetsByOwner",
        params: {
          ownerAddress: wallet,
          page: 1,
          limit: 100, // Reduced from 1000 for safety
          displayOptions: {
            showFungible: true,
            showNativeBalance: true,
          },
        },
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: any = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "DAS API error");
    }

    const items = data.result?.items || [];
    const tokens: TokenBalance[] = [];

    for (const item of items) {
      if (item.interface === "FungibleToken" || item.interface === "FungibleAsset") {
        const tokenInfo = item.token_info;
        tokens.push({
          mint: item.id,
          symbol: item.content?.metadata?.symbol,
          name: item.content?.metadata?.name,
          balance: tokenInfo.balance / Math.pow(10, tokenInfo.decimals),
          decimals: tokenInfo.decimals,
          price_usd: tokenInfo.price_info?.price_per_token,
        });
      }
    }

    // Add native SOL balance if present
    if (data.result?.nativeBalance) {
      tokens.unshift({
        mint: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        balance: data.result.nativeBalance.lamports / 1e9,
        decimals: 9,
      });
    }

    return tokens;
  }, "Helius DAS API");
}

/**
 * Get recent transactions for a wallet
 */
export async function getRecentTransactions(
  wallet: string,
  limit: number = 10
): Promise<ApiCallResult<Transaction[]>> {
  return safeApiCall(async (signal) => {
    // Use URL API for proper parameter encoding
    const url = new URL(`${getHeliusApiUrl()}/addresses/${encodeURIComponent(wallet)}/transactions`);
    url.searchParams.append("limit", Math.min(limit, 50).toString());

    const response = await fetch(url.toString(), {
      headers: getHeliusHeaders(),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: any = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format");
    }

    return data.map((tx: any) => ({
      signature: tx.signature,
      timestamp: tx.timestamp,
      description: tx.description || "Unknown transaction",
      type: tx.type || "UNKNOWN",
      fee_sol: (tx.fee || 0) / 1e9,
      native_transfers: tx.nativeTransfers,
      token_transfers: tx.tokenTransfers,
    }));
  }, "Helius Enhanced Transactions API");
}
