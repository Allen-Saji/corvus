import { getProtocol, getTopSolanaProtocols } from "../lib/defillama";
import { validatePositiveInteger } from "../lib/validation";

/**
 * Tool 5: Get protocol TVL and metrics
 */
export async function getProtocolTVLTool(protocol: string): Promise<string> {
  if (!protocol || protocol.trim() === "") {
    return JSON.stringify({
      error: "No protocol name provided. Specify a protocol name like 'kamino', 'jito', 'marinade', etc.",
      _meta: {
        tool: "get_protocol_tvl",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const result = await getProtocol(protocol);

  if (result.error) {
    return JSON.stringify({
      error: result.error,
      _meta: {
        tool: "get_protocol_tvl",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const proto: any = result.data!;
  const chainTvls = proto.chainTvls || proto.chain_tvls || {};
  const solanaTVL = chainTvls["Solana"] || 0;

  return JSON.stringify(
    {
      protocol: proto.name,
      slug: proto.slug,
      category: proto.category,
      tvl_total: proto.tvl,
      tvl_solana: solanaTVL,
      chain_breakdown: chainTvls,
      changes: {
        "1h": proto.change_1h,
        "1d": proto.change_1d,
        "7d": proto.change_7d,
      },
      _meta: {
        data_source: "DefiLlama Protocol API",
        timestamp: new Date().toISOString(),
        note: "TVL values are in USD",
      },
    },
    null,
    2
  );
}

/**
 * Tool 6: Get top Solana protocols by TVL
 */
export async function getTopProtocolsTool(
  limit?: number,
  category?: string
): Promise<string> {
  const actualLimit = limit || 10;

  // Validate limit
  const limitValidation = validatePositiveInteger(actualLimit, "limit", 50);
  if (!limitValidation.valid) {
    return JSON.stringify({
      error: limitValidation.error,
      _meta: {
        tool: "get_top_solana_protocols",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const result = await getTopSolanaProtocols(actualLimit, category);

  if (result.error) {
    return JSON.stringify({
      error: result.error,
      _meta: {
        tool: "get_top_solana_protocols",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const protocols = result.data!;

  return JSON.stringify(
    {
      category: category || "all",
      protocol_count: protocols.length,
      protocols: protocols.map((p: any) => ({
        name: p.name,
        slug: p.slug,
        category: p.category,
        tvl_solana: p.chainTvls?.["Solana"] || p.chain_tvls?.["Solana"] || 0,
        tvl_total: p.tvl,
        changes: {
          "1h": p.change_1h,
          "1d": p.change_1d,
          "7d": p.change_7d,
        },
      })),
      _meta: {
        data_source: "DefiLlama Protocols API",
        timestamp: new Date().toISOString(),
        note: "Sorted by Solana TVL (highest to lowest)",
      },
    },
    null,
    2
  );
}
