import type { AssetItem, TickerResult } from './types'

// The design's assets (Assets page frames) plus a few more, in USD. Folder ids match the folders mock.
export const CURRENCY = 'USD'
const CREATED = '2026-01-01T00:00:00Z'

type Seed = Pick<AssetItem, 'id' | 'name' | 'asset_type' | 'owned_value_converted' | 'investability'> & Partial<AssetItem>

const asset = (seed: Seed): AssetItem => ({
  portfolio_id: 'demo',
  folder_id: null,
  ticker: null,
  logo_url: null,
  converted_currency: CURRENCY,
  total_quantity: null,
  change_pct_1m: null,
  needs_attention: false,
  detail: seed.ticker ?? null,
  status: null,
  created_at: CREATED,
  updated_at: CREATED,
  ...seed,
})

export const MOCK_ASSETS: AssetItem[] = [
  asset({
    id: 'a1',
    name: 'Microsoft Corp.',
    asset_type: 'stock_ticker',
    ticker: 'MSFT',
    owned_value_converted: 13_000,
    total_quantity: 3_000,
    change_pct_1m: 5.5,
    needs_attention: true,
    investability: 'investable',
    folder_id: 'plaid-wells-fargo',
  }),
  asset({
    id: 'a2',
    name: 'Solana',
    asset_type: 'crypto_ticker',
    ticker: 'SOL',
    owned_value_converted: 845,
    total_quantity: 10,
    change_pct_1m: 0,
    investability: 'investable',
    folder_id: 'coinbase',
  }),
  asset({
    id: 'a3',
    name: '123, Abc road, London, United Kingdom',
    asset_type: 'real_estate',
    owned_value_converted: 50_000,
    investability: 'non_investable',
  }),
  asset({ id: 'a4', name: 'https://www.johndoe.com/', asset_type: 'domain', owned_value_converted: 150, investability: 'non_investable' }),
  asset({ id: 'a5', name: 'Toyota Camry 2016', asset_type: 'physical', owned_value_converted: 2_000, investability: 'non_investable' }),
  asset({
    id: 'a6',
    name: 'Silo AI',
    asset_type: 'venture_capital',
    owned_value_converted: 1_000,
    detail: 'Seed',
    status: 'Active',
    investability: 'investable',
  }),
  asset({
    id: 'a7',
    name: 'Apple Inc.',
    asset_type: 'stock_ticker',
    ticker: 'AAPL',
    owned_value_converted: 9_500,
    total_quantity: 50,
    change_pct_1m: 2.1,
    investability: 'investable',
    folder_id: 'plaid-wells-fargo',
  }),
  asset({
    id: 'a8',
    name: 'Ethereum',
    asset_type: 'crypto_ticker',
    ticker: 'ETH',
    owned_value_converted: 3_200,
    total_quantity: 1.2,
    change_pct_1m: -3.4,
    investability: 'investable',
    folder_id: 'coinbase',
  }),
  asset({
    id: 'a9',
    name: 'Tesla, Inc.',
    asset_type: 'stock_ticker',
    ticker: 'TSLA',
    owned_value_converted: 6_800,
    total_quantity: 30,
    change_pct_1m: -1.8,
    investability: 'investable',
    folder_id: 'plaid-wells-fargo',
  }),
  asset({ id: 'a10', name: 'Rolex Submariner', asset_type: 'physical', owned_value_converted: 9_000, investability: 'non_investable' }),
  asset({
    id: 'a11',
    name: 'Bitcoin',
    asset_type: 'crypto_ticker',
    ticker: 'BTC',
    owned_value_converted: 4_505,
    total_quantity: 0.07,
    change_pct_1m: 4.2,
    investability: 'investable',
    folder_id: 'coinbase',
  }),
]

const ticker = (symbol: string, name: string, price: number): TickerResult => ({
  ticker: symbol,
  name,
  logo_url: null,
  price,
  currency: CURRENCY,
})

/** What ticker search can find (the design's five first: they're shown before you type). */
export const MOCK_TICKERS: TickerResult[] = [
  ticker('GOOGL', 'Alphabet Inc.', 172.4),
  ticker('MSFT', 'Microsoft Corp.', 10),
  ticker('SPOT', 'Spotify', 310.25),
  ticker('TIKTOK', 'Tiktok', 42.1),
  ticker('NTFX', 'Netflix', 640.8),
  ticker('AAPL', 'Apple Inc.', 190),
  ticker('AMZN', 'Amazon.com, Inc.', 182.3),
  ticker('TSLA', 'Tesla, Inc.', 226.6),
  ticker('NVDA', 'NVIDIA Corp.', 121.4),
  ticker('META', 'Meta Platforms, Inc.', 498.2),
  ticker('JPM', 'JPMorgan Chase & Co.', 205.1),
  ticker('V', 'Visa Inc.', 278.9),
  ticker('KO', 'The Coca-Cola Company', 62.4),
  ticker('DIS', 'The Walt Disney Company', 98.7),
]

export const POPULAR_TICKERS = MOCK_TICKERS.slice(0, 5)
