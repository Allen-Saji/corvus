import { validateSolanaAddress, validatePositiveInteger } from "../lib/validation";
import { getRecentTransactions } from "../lib/helius";

/**
 * Tool 3: Get recent transactions for a wallet
 */
export async function getRecentTransactionsTool(
  wallet: string,
  limit?: number
): Promise<string> {
  // Validate wallet address
  const walletValidation = validateSolanaAddress(wallet);
  if (!walletValidation.valid) {
    return JSON.stringify({
      error: walletValidation.error,
      _meta: {
        tool: "get_recent_transactions",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Validate limit parameter
  const actualLimit = limit || 10;
  const limitValidation = validatePositiveInteger(actualLimit, "limit", 50);
  if (!limitValidation.valid) {
    return JSON.stringify({
      error: limitValidation.error,
      _meta: {
        tool: "get_recent_transactions",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Fetch transactions
  const txResult = await getRecentTransactions(wallet, actualLimit);
  if (txResult.error) {
    return JSON.stringify({
      error: txResult.error,
      _meta: {
        tool: "get_recent_transactions",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const transactions = txResult.data!;

  return JSON.stringify(
    {
      wallet,
      transaction_count: transactions.length,
      transactions: transactions.map((tx) => ({
        signature: tx.signature,
        timestamp: new Date(tx.timestamp * 1000).toISOString(),
        description: tx.description,
        type: tx.type,
        fee_sol: tx.fee_sol,
        native_transfers: tx.native_transfers,
        token_transfers: tx.token_transfers,
      })),
      _meta: {
        data_source: "Helius Enhanced Transactions API",
        timestamp: new Date().toISOString(),
        note: "USD values shown are current prices, not prices at time of transaction",
      },
    },
    null,
    2
  );
}
