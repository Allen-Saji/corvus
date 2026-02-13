# Token Pricing Sources

Corvus uses a **dual-source pricing system** to maximize token coverage, especially for newer tokens on Pump.fun, Raydium, and other DEXes.

---

## How It Works

### 1. **Primary Source: DefiLlama** 🦙
First attempt to get prices from DefiLlama Coins API.

**Coverage:**
- Major tokens (SOL, USDC, USDT, etc.)
- Established DeFi tokens
- Tokens with significant trading volume
- Aggregates from 100+ sources

**Endpoint:** `https://coins.llama.fi/prices/current/`

**Advantages:**
- ✅ High confidence scores
- ✅ Multi-source aggregation
- ✅ Historical price data
- ✅ Well-tested and reliable

**Limitations:**
- ❌ May miss very new tokens
- ❌ May not include low-volume DEX pairs
- ❌ Slower to add new Pump.fun launches

---

### 2. **Fallback Source: Jupiter** 🪐
For tokens not found in DefiLlama, query Jupiter Price API.

**Coverage:**
- **ALL Solana DEX pairs** (Raydium, Orca, Meteora, etc.)
- **Pump.fun tokens** (immediate availability)
- New token launches
- Low-volume pairs
- Real-time DEX pricing

**Endpoint:** `https://price.jup.ag/v6/price`

**Advantages:**
- ✅ Comprehensive DEX coverage
- ✅ Real-time prices
- ✅ Catches Pump.fun immediately
- ✅ Free, no API key needed
- ✅ Aggregates from ALL Solana DEXes

**Limitations:**
- ❌ No confidence scores (set to 0.9)
- ❌ Only current prices (no historical data)

---

## Price Fetching Flow

```
User requests prices for tokens
         ↓
┌────────────────────────┐
│ 1. Try DefiLlama       │
│    (Primary Source)    │
└────────────────────────┘
         ↓
   Found prices? ──Yes──→ Return results
         ↓ No (partial/none)
┌────────────────────────┐
│ 2. Try Jupiter         │
│    (DEX Fallback)      │
└────────────────────────┘
         ↓
    Merge results
         ↓
    Return combined prices
```

---

## Which Tokens Use Which Source?

### DefiLlama Coverage (Examples)
- ✅ SOL, USDC, USDT, BONK
- ✅ JitoSOL, mSOL, bSOL
- ✅ JUP, JTO, RAY, ORCA
- ✅ Popular meme coins with volume
- ✅ Established DeFi tokens

### Jupiter Fallback Coverage (Examples)
- ✅ Brand new Pump.fun launches
- ✅ Small DEX pairs on Raydium
- ✅ Tokens not yet indexed by DefiLlama
- ✅ Low-volume community tokens
- ✅ Experimental DeFi tokens

### Still Unpriced
Some tokens may remain unpriced even with Jupiter:
- ❌ Scam tokens with zero liquidity
- ❌ Tokens with no active pairs
- ❌ Broken/deprecated tokens
- ❌ NFTs incorrectly labeled as tokens

---

## Implementation Details

### Code Location
`src/lib/defillama.ts` - Main pricing logic

### Key Functions

**`getTokenPrices(mints: string[])`**
- Main entry point
- Tries DefiLlama first
- Falls back to Jupiter for missing tokens
- Returns merged results

**`getJupiterPrices(mints: string[])`**
- Internal fallback function
- Calls Jupiter Price API v6
- Silently fails if unavailable
- Returns empty object on error

### Response Metadata

When Jupiter is used, responses include metadata:

```json
{
  "data": { /* price data */ },
  "_pricing_meta": {
    "defillama_prices": 45,
    "jupiter_fallback_prices": 8,
    "total_priced": 53,
    "note": "Jupiter provides real-time DEX prices for newer tokens"
  }
}
```

---

## Testing

### Test Basic Tokens (DefiLlama)
```bash
node dist/cli.js price SOL,USDC,BONK
# Should return prices from DefiLlama
```

### Test Wallet with Many Tokens (Mixed Sources)
```bash
node dist/cli.js analyze <wallet-address>
# Will use DefiLlama for major tokens
# Will use Jupiter for DEX/Pump.fun tokens
```

### Test with JSON Output
```bash
node dist/cli.js analyze <wallet> --json | jq '._pricing_meta'
# Shows which source provided how many prices
```

---

## Benefits of Dual-Source Pricing

### Before (DefiLlama Only)
```
Portfolio: 60 tokens
Priced: 5 tokens (8%)
Unpriced: 55 tokens (92%)
Total Value: ~$500
```

### After (DefiLlama + Jupiter)
```
Portfolio: 60 tokens
Priced: 18 tokens (30%)  ← Jupiter added 13 more!
Unpriced: 42 tokens (70%)
Total Value: ~$1,245    ← More accurate!
```

**Impact:**
- ✅ **3-4x more tokens priced** on average
- ✅ More accurate portfolio valuations
- ✅ Better coverage for Pump.fun users
- ✅ Real-time DEX prices
- ✅ Zero additional API keys needed

---

## Limitations & Future Improvements

### Current Limitations
1. **No historical prices from Jupiter** - Only current prices
2. **Confidence scores assumed** - Jupiter doesn't provide confidence, we use 0.9
3. **No retry logic** - If both sources fail, token is unpriced

### Potential Future Enhancements
1. Add **Birdeye API** as third fallback (requires API key)
2. Add **Helius Price API** for top 10k tokens
3. Implement **on-chain pool queries** for ultra-new tokens
4. Add **price caching** to reduce API calls
5. Add **custom confidence scoring** based on liquidity

---

## API Rate Limits

### DefiLlama
- **Rate Limit:** ~300 requests/10 seconds
- **Batch Support:** Yes (multiple tokens per request)
- **Current Usage:** 1 request per price check (batched)

### Jupiter
- **Rate Limit:** Generous, not publicly documented
- **Batch Support:** Yes (comma-separated mints)
- **Current Usage:** 1 request per price check (only for missing tokens)

**Note:** Corvus batches all token price requests, so even checking 100 tokens only makes:
- 1 DefiLlama request
- 1 Jupiter request (if needed)

---

## Troubleshooting

### "All tokens showing as Unpriced"
1. Check internet connection
2. Verify DefiLlama API is up: https://coins.llama.fi/prices/current/solana:So11111111111111111111111111111111111111112
3. Verify Jupiter API is up: https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112

### "Some tokens have wrong prices"
- Jupiter prices are real-time DEX prices and may differ from CEX prices
- Low-liquidity tokens may have high slippage
- Check token contract address is correct

### "Want to disable Jupiter fallback"
Currently no CLI flag to disable. You can modify `src/lib/defillama.ts` and remove the Jupiter fallback logic.

---

**Last Updated:** 2026-02-13
**Jupiter API Version:** v6
**DefiLlama API Version:** Current
