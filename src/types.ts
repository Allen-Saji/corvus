// Core types for Corvus MCP server

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ApiCallResult<T> {
  data?: T;
  error?: string;
}

export interface TokenBalance {
  mint: string;
  symbol?: string;
  name?: string;
  balance: number;
  decimals: number;
  price_usd?: number;
  value_usd?: number;
}

export interface Transaction {
  signature: string;
  timestamp: number;
  description: string;
  type: string;
  fee_sol: number;
  native_transfers?: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
  token_transfers?: Array<{
    mint: string;
    from: string;
    to: string;
    amount: number;
    symbol?: string;
  }>;
}

export interface TokenPrice {
  mint: string;
  symbol: string;
  price: number;
  decimals: number;
  confidence: number;
  timestamp: number;
}

export interface Protocol {
  id: string;
  name: string;
  slug: string;
  tvl: number;
  chain_tvls?: Record<string, number>;
  category?: string;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
}

export interface DeFiPosition {
  mint: string;
  symbol?: string;
  name?: string;
  balance: number;
  price_usd?: number;
  value_usd?: number;
  protocol?: string;
  category?: string;
  confidence: "high" | "medium" | "none";
  signals?: string[];
  note?: string;
}

export interface WalletAnalysis {
  wallet: string;
  summary: {
    total_known_value_usd: number;
    total_likely_defi_value_usd: number;
    total_unclassified_value_usd: number;
    total_estimated_usd: number;
    known_positions_count: number;
    likely_defi_count: number;
    unclassified_count: number;
    dust_filtered: number;
  };
  known_positions: DeFiPosition[];
  likely_defi: DeFiPosition[];
  unclassified: DeFiPosition[];
  limitations: string[];
  _meta: {
    data_source: string;
    timestamp: string;
    helius_credits_used: number;
    defillama_tokens_priced: number;
    defillama_tokens_unpriced: number;
  };
}

export interface DeFiRegistryEntry {
  mint: string;
  symbol: string;
  name: string;
  protocol: string;
  category: string;
  underlying_asset?: string;
  description: string;
}
