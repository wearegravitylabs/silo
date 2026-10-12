import { useState } from 'react'
import { parseNumber } from '@/components/number-input'
import { DEBT_TYPE_DEFAULT_ICON } from '../../constants'
import { payoffDate } from '../../payoff'
import type { CreateDebtInput, DebtType, PaymentFrequency } from '../../types'

export const INTEREST_ERROR = 'Please enter a valid interest rate'

const isValidRate = (n: number | null) => n !== null && n >= 0 && n <= 100

/**
 * Add Debt form state and everything derived from it: validity, the payoff projection, the request body.
 * Required fields never show errors — the submit button stays disabled until they're filled. Only a bad
 * interest rate is called out, and the summary keeps using the last valid rate meanwhile.
 */
export function useAddDebtForm(defaultCurrency: string) {
  const [type, setType] = useState<DebtType | null>(null)
  const [name, setName] = useState('')
  /** null = follow the debt type's icon */
  const [iconId, setIconId] = useState<string | null>(null)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [balanceText, setBalanceText] = useState('')
  const [hasSchedule, setHasSchedule] = useState(false)
  const [paymentText, setPaymentText] = useState('')
  const [frequency, setFrequency] = useState<PaymentFrequency>('weekly')
  const [interestText, setInterestTextState] = useState('')
  const [lastValidRate, setLastValidRate] = useState(0)

  const setInterestText = (text: string) => {
    setInterestTextState(text)
    const n = parseNumber(text)
    if (text.trim() === '') setLastValidRate(0)
    else if (isValidRate(n)) setLastValidRate(n!)
  }

  const balance = parseNumber(balanceText)
  const payment = parseNumber(paymentText)
  const interestInput = parseNumber(interestText)
  const interestError = interestText.trim() !== '' && !isValidRate(interestInput) ? INTEREST_ERROR : undefined
  const rate = interestError ? lastValidRate : (interestInput ?? 0)
  const payoff = hasSchedule ? payoffDate({ balance, payment, ratePct: rate, frequency }) : null

  const baseValid = type !== null && name.trim() !== '' && balance !== null && balance > 0
  const scheduleValid = !hasSchedule || (payment !== null && payment > 0 && !interestError && payoff?.kind !== 'never')
  const canSubmit = baseValid && scheduleValid

  const icon = iconId ?? (type ? DEBT_TYPE_DEFAULT_ICON[type] : 'house')

  const toInput = (folderId: string | null): CreateDebtInput => ({
    folder_id: folderId,
    name: name.trim(),
    debt_type: type!,
    balance: balance!,
    currency,
    has_schedule: hasSchedule,
    payment_amount: hasSchedule ? payment! : 0,
    frequency: hasSchedule ? frequency : '',
    interest_rate: hasSchedule ? rate : 0,
    icon: iconId,
  })

  return {
    values: { type, name, icon, currency, balanceText, hasSchedule, paymentText, frequency, interestText },
    set: {
      type: setType,
      name: setName,
      icon: setIconId,
      currency: setCurrency,
      balanceText: setBalanceText,
      hasSchedule: setHasSchedule,
      paymentText: setPaymentText,
      frequency: setFrequency,
      interestText: setInterestText,
    },
    derived: { balance, payment, rate, interestError, payoff, canSubmit },
    toInput,
  }
}

export type AddDebtForm = ReturnType<typeof useAddDebtForm>
