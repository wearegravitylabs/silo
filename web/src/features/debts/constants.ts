import { BanknoteIcon, CarIcon, HandCoinsIcon, HouseIcon, LibraryBigIcon, UserRoundIcon } from 'lucide-react'
import type { DebtType, PaymentFrequency } from './types'

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  car_loan: 'Car Loan',
  personal: 'Personal Loan',
  credit_card: 'Credit Cards',
  manual: 'Other',
}

/** Row icon per debt type; credit cards share the sidebar's Debts icon. */
export const DEBT_TYPE_ICONS: Record<DebtType, typeof HouseIcon> = {
  mortgage: HouseIcon,
  student_loan: LibraryBigIcon,
  car_loan: CarIcon,
  personal: UserRoundIcon,
  credit_card: BanknoteIcon,
  manual: HandCoinsIcon,
}

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  biannual: 'Every 6 Months',
  annually: 'Annually',
}
