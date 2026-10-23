import { useState } from 'react'
import { todayIso } from '@/components/date-field'
import { parseNumber } from '@/components/number-input'
import { MAX_LOT_QUANTITY } from '../../constants'
import type { AssetLotInput } from '../../types'

export const QUANTITY_ERROR = 'Please enter a valid quantity'

export interface LotDraft {
  key: string
  quantityText: string
  /** Local ISO datetime from the date field; '' until picked or typed */
  acquiredAt: string
}

const newLot = (): LotDraft => ({ key: crypto.randomUUID(), quantityText: '', acquiredAt: '' })
const isValidQuantity = (n: number | null): n is number => n !== null && n > 0 && n <= MAX_LOT_QUANTITY

/**
 * The purchases being added for one stock ("Add More Quantity" adds another). Each needs a quantity above 0 and up to
 * 1,000,000; a filled-in bad one shows its error. An unset date means today at midnight.
 */
export function useStockLots() {
  const [lots, setLots] = useState<LotDraft[]>(() => [newLot()])
  const update = (key: string, patch: Partial<LotDraft>) => setLots((list) => list.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const rows = lots.map((lot) => {
    const quantity = parseNumber(lot.quantityText)
    const error = lot.quantityText.trim() !== '' && !isValidQuantity(quantity) ? QUANTITY_ERROR : undefined
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
    firstAcquiredAt: acquiredAt(lots[0]),
    canSubmit: rows.every((r) => isValidQuantity(r.quantity)),
    toLots: (): AssetLotInput[] => rows.map((r) => ({ quantity: r.quantity!, acquired_at: acquiredAt(r) })),
  }
}

export type StockLots = ReturnType<typeof useStockLots>
