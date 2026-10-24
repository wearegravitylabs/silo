import { useState } from 'react'
import { parseNumber } from '@/components/number-input'
import type { CreateAssetInput } from '../../types'
import type { TickerKindConfig } from './ticker-kinds'
import { useLots } from './use-lots'

/**
 * Add Ticker (a stock or coin that isn't listed): image, name, ticker, price per quantity and the purchases. Required
 * fields show no errors — Create Asset stays disabled until they're filled; only a bad quantity is called out.
 */
export function useManualTicker(config: TickerKindConfig, defaultCurrency: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [ticker, setTickerState] = useState('')
  const [priceText, setPriceText] = useState('')
  const [currency, setCurrency] = useState(config.manualCurrency === 'pick' ? defaultCurrency : config.manualCurrency)
  const lots = useLots(config.quantity)

  const price = parseNumber(priceText) ?? 0
  const canSubmit = name.trim() !== '' && ticker.trim() !== '' && price > 0 && lots.canSubmit

  const toInput = (folderId: string | null): CreateAssetInput => ({
    folder_id: folderId,
    asset_type: config.manualType,
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
      // No spaces; stock tickers are capitals
      ticker: (t: string) => setTickerState((config.uppercaseTicker ? t.toUpperCase() : t).replace(/\s/g, '')),
      priceText: setPriceText,
      currency: config.manualCurrency === 'pick' ? setCurrency : undefined,
    },
    lots,
    canSubmit,
    toInput,
  }
}

export type ManualTicker = ReturnType<typeof useManualTicker>
