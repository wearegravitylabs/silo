import { useState } from 'react'
import { parseNumber } from '@/components/number-input'
import type { CreateAssetInput } from '../../types'
import { useStockLots } from './use-stock-lots'

/**
 * Add Ticker (manual stock) form: image, name, ticker, price per quantity and the purchases. Required fields show no
 * errors — Create Asset stays disabled until they're filled; only a bad quantity is called out.
 */
export function useManualStock(defaultCurrency: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [ticker, setTickerState] = useState('')
  const [priceText, setPriceText] = useState('')
  const [currency, setCurrency] = useState(defaultCurrency)
  const lots = useStockLots()

  const price = parseNumber(priceText) ?? 0
  const canSubmit = name.trim() !== '' && ticker.trim() !== '' && price > 0 && lots.canSubmit

  const toInput = (folderId: string | null): CreateAssetInput => ({
    folder_id: folderId,
    asset_type: 'stock_manual',
    ticker: ticker.trim(),
    name: name.trim(),
    logo_url: imageUrl,
    currency,
    price,
    lots: lots.toLots(),
  })

  return {
    values: { imageUrl, name, ticker, priceText, currency, price },
    set: {
      imageUrl: setImageUrl,
      name: setName,
      // Tickers are capitals, no spaces
      ticker: (t: string) => setTickerState(t.toUpperCase().replace(/\s/g, '')),
      priceText: setPriceText,
      currency: setCurrency,
    },
    lots,
    canSubmit,
    toInput,
  }
}

export type ManualStock = ReturnType<typeof useManualStock>
