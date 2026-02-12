/**
 * Mock data for testing
 */

export const MOCK_WALLETS = {
  valid: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  empty: '11111111111111111111111111111111',
  invalid: 'invalid-address',
};

export const MOCK_TOKENS = {
  sol: {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    balance: 100,
    decimals: 9,
  },
  usdc: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    balance: 1000,
    decimals: 6,
  },
  jitoSOL: {
    mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    symbol: 'JitoSOL',
    balance: 50,
    decimals: 9,
  },
  lpToken: {
    mint: 'LPTokenMintAddress123456789',
    symbol: 'SOL-USDC-LP',
    name: 'Orca LP Token',
    balance: 10,
    decimals: 6,
  },
  unknownToken: {
    mint: 'UnknownTokenMint123456789',
    symbol: 'UNKNOWN',
    name: 'Unknown Token',
    balance: 100,
    decimals: 9,
  },
};

export const MOCK_PRICES = {
  'So11111111111111111111111111111111111111112': {
    price: 80.5,
    symbol: 'SOL',
    decimals: 9,
    confidence: 0.99,
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    price: 1.0,
    symbol: 'USDC',
    decimals: 6,
    confidence: 0.99,
  },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': {
    price: 101.5,
    symbol: 'JITOSOL',
    decimals: 9,
    confidence: 0.99,
  },
};

export const MOCK_PROTOCOLS = [
  {
    id: '1',
    name: 'Kamino Lend',
    slug: 'kamino-lend',
    tvl: 1648895170.19,
    chainTvls: { Solana: 1648895170.19 },
    category: 'Lending',
  },
  {
    id: '2',
    name: 'Jito Liquid Staking',
    slug: 'jito-liquid-staking',
    tvl: 1073373255.49,
    chainTvls: { Solana: 1073373255.49 },
    category: 'Liquid Staking',
  },
];
