import { validateSolanaAddress } from "../lib/validation";
import { getSolBalance } from "../lib/helius";
import { getTokenPrices } from "../lib/defillama";

/**
 * Tool 1: Get SOL balance for a wallet
 */
export async function getSOLBalanceTool(wallet: string): Promise<string> {
  // Validate input
  const validation = validateSolanaAddress(wallet);
  if (!validation.valid) {
    return JSON.stringify({
      error: validation.error,
      _meta: {
        tool: "get_sol_balance",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Fetch SOL balance
  const balanceResult = await getSolBalance(wallet);
  if (balanceResult.error) {
    return JSON.stringify({
      error: balanceResult.error,
      _meta: {
        tool: "get_sol_balance",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Get SOL price
  const SOL_MINT = "So11111111111111111111111111111111111111112";
  const priceResult = await getTokenPrices([SOL_MINT]);

  const solPrice = priceResult.data?.[SOL_MINT]?.price;

  return JSON.stringify(
    {
      wallet,
      balance_sol: balanceResult.data!.balance_sol,
      balance_lamports: balanceResult.data!.balance_lamports,
      price_usd: solPrice,
      value_usd: solPrice
        ? balanceResult.data!.balance_sol * solPrice
        : undefined,
      _meta: {
        data_source: "Helius RPC + DefiLlama Coins API",
        timestamp: new Date().toISOString(),
        note: solPrice
          ? "USD value calculated using current SOL price"
          : "SOL price unavailable from DefiLlama",
      },
    },
    null,
    2
  );
}
