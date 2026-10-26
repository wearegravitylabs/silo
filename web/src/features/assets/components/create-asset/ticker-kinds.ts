import type { TickerKind } from '../../types'

/** Everything that differs between adding a stock and adding a coin: wording, data source, quantity rules. */
export interface TickerKindConfig {
  kind: TickerKind
  /** Create Asset type card id that starts this flow */
  typeId: 'stock_ticker' | 'crypto_ticker'
  manualType: 'stock_manual' | 'crypto_manual'
  /** "stocks" / "crypto": "Add stocks manually", "Quantity of crypto acquired" */
  noun: string
  searchTitle: string
  searchDescription: string
  /** Heading after "Add $MSFT" (" stock"), and after the name ("Add Microsoft Corp. Asset") */
  headingSuffix: string
  nameSuffix: string
  namePlaceholder: string
  tickerPlaceholder: string
  /** Stock tickers are capitals; coin tickers stay as typed ("$Fartcoin") */
  uppercaseTicker: boolean
  /** Manual price currency is pickable (stocks) or fixed to USD (crypto) */
  manualCurrency: 'pick' | 'USD'
  quantity: { decimals: number; min: number; max: number }
  source: 'yahoo' | 'coingecko'
}

export const TICKER_KINDS: Record<TickerKind, TickerKindConfig> = {
  stock: {
    kind: 'stock',
    typeId: 'stock_ticker',
    manualType: 'stock_manual',
    noun: 'stocks',
    searchTitle: 'Search for a Stock',
    searchDescription: 'Add publicly traded stocks by ticker symbol. Prices update automatically so you always see current values.',
    headingSuffix: ' stock',
    nameSuffix: ' Asset',
    namePlaceholder: 'Enter stock name',
    tickerPlaceholder: 'Enter stock ticker',
    uppercaseTicker: true,
    manualCurrency: 'pick',
    // Whole shares
    quantity: { decimals: 0, min: 1, max: 1_000_000 },
    source: 'yahoo',
  },
  crypto: {
    kind: 'crypto',
    typeId: 'crypto_ticker',
    manualType: 'crypto_manual',
    noun: 'crypto',
    searchTitle: 'Search for a Crypto',
    searchDescription: 'Track Bitcoin, Ethereum, and other cryptocurrencies. Prices update automatically from live market data.',
    headingSuffix: '',
    nameSuffix: '',
    namePlaceholder: 'Enter crypto name',
    tickerPlaceholder: 'Enter crypto ticker',
    uppercaseTicker: false,
    manualCurrency: 'USD',
    // Fractions of a coin, down to 0.001
    quantity: { decimals: 8, min: 0.001, max: 1_000_000 },
    source: 'coingecko',
  },
}

/** The flow a Create Asset type card starts, if it has one. */
export const kindForType = (typeId: string | null) => Object.values(TICKER_KINDS).find((k) => k.typeId === typeId) ?? null
