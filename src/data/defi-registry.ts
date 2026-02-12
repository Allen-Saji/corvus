import { DeFiRegistryEntry } from "../types";

/**
 * Known DeFi receipt tokens - Hardcoded registry of verified positions
 * These are tokens that represent deposits/stakes in DeFi protocols
 */
export const DEFI_REGISTRY: DeFiRegistryEntry[] = [
  // Liquid Staking
  {
    mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    symbol: "JitoSOL",
    name: "Jito Staked SOL",
    protocol: "Jito",
    category: "Liquid Staking",
    underlying_asset: "SOL",
    description: "Represents staked SOL in Jito's MEV-optimized staking pool",
  },
  {
    mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    symbol: "mSOL",
    name: "Marinade Staked SOL",
    protocol: "Marinade",
    category: "Liquid Staking",
    underlying_asset: "SOL",
    description: "Represents staked SOL in Marinade Finance",
  },
  {
    mint: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
    symbol: "bSOL",
    name: "BlazeStake Staked SOL",
    protocol: "BlazeStake",
    category: "Liquid Staking",
    underlying_asset: "SOL",
    description: "Represents staked SOL in BlazeStake protocol",
  },
  {
    mint: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
    symbol: "JupSOL",
    name: "Jupiter Staked SOL",
    protocol: "Jupiter",
    category: "Liquid Staking",
    underlying_asset: "SOL",
    description: "Represents staked SOL in Jupiter's liquid staking pool",
  },
  {
    mint: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
    symbol: "stSOL",
    name: "Lido Staked SOL",
    protocol: "Lido",
    category: "Liquid Staking",
    underlying_asset: "SOL",
    description: "Represents staked SOL in Lido protocol",
  },

  // Base Assets (for completeness)
  {
    mint: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    protocol: "Native",
    category: "Base Asset",
    description: "Native Solana token",
  },
  {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    protocol: "Circle",
    category: "Stablecoin",
    description: "Circle's USD stablecoin",
  },
  {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    protocol: "Tether",
    category: "Stablecoin",
    description: "Tether's USD stablecoin",
  },

  // Governance Tokens
  {
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    protocol: "Jupiter",
    category: "Governance",
    description: "Jupiter Exchange governance token",
  },
  {
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    protocol: "BONK",
    category: "Memecoin",
    description: "Solana's community memecoin",
  },
  {
    mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    symbol: "RAY",
    name: "Raydium",
    protocol: "Raydium",
    category: "Governance",
    description: "Raydium DEX governance token",
  },
  {
    mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    symbol: "ORCA",
    name: "Orca",
    protocol: "Orca",
    category: "Governance",
    description: "Orca DEX governance token",
  },
  {
    mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
    symbol: "JTO",
    name: "Jito",
    protocol: "Jito",
    category: "Governance",
    description: "Jito governance token",
  },
  {
    mint: "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey",
    symbol: "MNDE",
    name: "Marinade",
    protocol: "Marinade",
    category: "Governance",
    description: "Marinade Finance governance token",
  },
];

/**
 * Fast lookup map: mint -> registry entry
 */
const DEFI_REGISTRY_MAP = new Map<string, DeFiRegistryEntry>(
  DEFI_REGISTRY.map((entry) => [entry.mint, entry])
);

/**
 * Check if a mint is in the known DeFi registry
 */
export function getKnownDeFiEntry(mint: string): DeFiRegistryEntry | undefined {
  return DEFI_REGISTRY_MAP.get(mint);
}

/**
 * Check if a token is likely a DeFi receipt token based on heuristics
 */
export function classifyUnknownToken(
  symbol: string | undefined,
  name: string | undefined,
  hasMarketPrice: boolean
): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  const sym = (symbol || "").toLowerCase();
  const tokenName = (name || "").toLowerCase();

  // Signal 1: No market price (receipt tokens aren't traded)
  if (!hasMarketPrice) {
    signals.push("no_market_price");
    score++;
  }

  // Signal 2: "LP" in symbol
  if (sym.includes("lp")) {
    signals.push("lp_in_symbol");
    score++;
  }

  // Signal 3: Pair format (contains hyphen)
  if (sym.includes("-")) {
    signals.push("pair_format");
    score++;
  }

  // Signal 4: Kamino naming pattern (starts with k)
  if (sym.startsWith("k") && sym.length > 1) {
    signals.push("k_prefix");
    score++;
  }

  // Signal 5: Solend naming pattern (starts with c)
  if (sym.startsWith("c") && sym.length > 1 && tokenName.includes("solend")) {
    signals.push("c_prefix");
    score++;
  }

  // Signal 6: Known protocol in name
  const knownProtocols = [
    "kamino",
    "orca",
    "raydium",
    "meteora",
    "marinade",
    "solend",
    "drift",
    "marginfi",
  ];
  if (knownProtocols.some((p) => tokenName.includes(p))) {
    signals.push("known_protocol_in_name");
    score++;
  }

  // Signal 7: DeFi keywords in name
  const defiKeywords = ["pool", "vault", "reserve", "deposit", "lp"];
  if (defiKeywords.some((kw) => tokenName.includes(kw))) {
    signals.push("pool_or_vault_in_name");
    score++;
  }

  return { score, signals };
}
