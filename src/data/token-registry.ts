/**
 * Known Solana token registry - Symbol to Mint address mapping
 * Used for resolving common token names to their mint addresses
 */

export const TOKEN_REGISTRY: Record<string, string> = {
  // Native & Stablecoins
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",

  // Liquid Staking Tokens
  JITOSOL: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
  MSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  BSOL: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
  JUPSOL: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
  STSOL: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",

  // Governance Tokens
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  JTO: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  ORCA: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
  MNDE: "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey",

  // Popular Tokens
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
};

/**
 * Reverse lookup: Mint to Symbol
 */
export const MINT_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_REGISTRY).map(([symbol, mint]) => [mint, symbol])
);

/**
 * Resolve a token identifier (symbol or mint) to a mint address
 */
export function resolveMint(identifier: string): string {
  const trimmed = identifier.trim();

  // If it's a known symbol, return the mint
  if (TOKEN_REGISTRY[trimmed.toUpperCase()]) {
    return TOKEN_REGISTRY[trimmed.toUpperCase()];
  }

  // Otherwise assume it's already a mint address
  return trimmed;
}

/**
 * Get symbol for a mint address if known
 */
export function getSymbolForMint(mint: string): string | undefined {
  return MINT_TO_SYMBOL[mint];
}
