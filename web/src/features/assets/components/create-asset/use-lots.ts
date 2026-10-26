import { useState } from 'react'
import { todayIso } from '@/components/date-field'
import { parseNumber } from '@/components/number-input'
import type { AssetLotInput } from '../../types'

export const QUANTITY_ERROR = 'Please enter a valid quantity'

export interface LotDraft {
  key: string
  quantityText: string
  /** Local ISO datetime from the date field; '' until picked or typed */
  acquiredAt: string
}

export interface QuantityRule {
  min: number
  max: number
}

const newLot = (): LotDraft => ({ key: crypto.randomUUID(), quantityText: '', acquiredAt: '' })

/**
 * The purchases being added for one stock or coin ("Add More Quantity" adds another). Each quantity must fall within
 * `rule` (whole shares from 1, coins from 0.001; up to 1,000,000); a filled-in bad one shows its error. An unset date
 * means today at midnight.
 */
export function useLots(rule: QuantityRule) {
  const [lots, setLots] = useState<LotDraft[]>(() => [newLot()])
  const update = (key: string, patch: Partial<LotDraft>) => setLots((list) => list.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const isValid = (n: number | null): n is number => n !== null && n >= rule.min && n <= rule.max

  const rows = lots.map((lot) => {
    const quantity = parseNumber(lot.quantityText)
    const error = lot.quantityText.trim() !== '' && !isValid(quantity) ? QUANTITY_ERROR : undefined
    return { ...lot, quantity, error }
  })
  const acquiredAt = (lot: LotDraft) => lot.acquiredAt || `${todayIso()}T00:00`

  return {
    rows,
    add: () => setLots((list) => [...list, newLot()]),
    remove: (key: string) => setLots((list) => list.filter((l) => l.key !== key)),
    setQuantity: (key: string, quantityText: string) => update(key, { quantityText }),
    setAcquiredAt: (key: string, value: string) => update(key, { acquiredAt: value }),
    /** As typed, even while invalid (the summary follows the field) */
    totalQuantity: rows.reduce((sum, r) => sum + (r.quantity ?? 0), 0),
    /** Every purchase's moment, in order (the summary's dates) */
    acquiredAts: lots.map(acquiredAt),
    /**
     * What the purchases cost, given a unit price per purchase moment: the quantity-weighted average price, the total,
     * and whether it's a true average (purchases at different prices — the DCA case).
     */
    costBasis: (priceAt: (acquiredAt: string) => number) => {
      const filled = rows.filter((r) => (r.quantity ?? 0) > 0)
      const quantity = filled.reduce((sum, r) => sum + r.quantity!, 0)
      const prices = filled.map((r) => priceAt(acquiredAt(r)))
      const total = filled.reduce((sum, r, i) => sum + r.quantity! * prices[i], 0)
      return {
        unitPrice: quantity > 0 ? total / quantity : priceAt(acquiredAt(lots[0])),
        total,
        averaged: new Set(prices).size > 1,
      }
    },
    canSubmit: rows.every((r) => isValid(r.quantity)),
    toLots: (): AssetLotInput[] => rows.map((r) => ({ quantity: r.quantity!, acquired_at: acquiredAt(r) })),
  }
}

export type Lots = ReturnType<typeof useLots>
