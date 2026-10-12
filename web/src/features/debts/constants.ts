import {
  BanknoteIcon,
  BikeIcon,
  CarIcon,
  ChartPieIcon,
  Columns2Icon,
  DiamondIcon,
  HandCoinsIcon,
  HeartIcon,
  HouseIcon,
  IdCardIcon,
  LibraryBigIcon,
  LightbulbIcon,
  PencilIcon,
  PhoneIcon,
  UserRoundIcon,
} from 'lucide-react'
import type { DebtType, PaymentFrequency } from './types'

/** Singular, for a debt's own type (table rows). */
export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  car_loan: 'Car Loan',
  personal: 'Personal Loan',
  credit_card: 'Credit Cards',
  manual: 'Other',
}

/** The Add Debt type picker, in the design's order and wording. */
export const DEBT_TYPE_OPTIONS: { value: DebtType; label: string }[] = [
  { value: 'mortgage', label: 'Mortgages' },
  { value: 'personal', label: 'Personal Loans' },
  { value: 'student_loan', label: 'Student Loans' },
  { value: 'car_loan', label: 'Car Loans' },
  { value: 'credit_card', label: 'Credit Cards' },
]

/** Icons a debt can wear, in the picker's order (two rows of seven). */
export const DEBT_ICON_OPTIONS = [
  { id: 'house', label: 'House', Icon: HouseIcon },
  { id: 'education', label: 'Education', Icon: LibraryBigIcon },
  { id: 'car', label: 'Car', Icon: CarIcon },
  { id: 'cash', label: 'Cash', Icon: BanknoteIcon },
  { id: 'person', label: 'Person', Icon: UserRoundIcon },
  { id: 'pencil', label: 'Pencil', Icon: PencilIcon },
  { id: 'idea', label: 'Idea', Icon: LightbulbIcon },
  { id: 'bike', label: 'Bike', Icon: BikeIcon },
  { id: 'chart', label: 'Chart', Icon: ChartPieIcon },
  { id: 'diamond', label: 'Diamond', Icon: DiamondIcon },
  { id: 'health', label: 'Health', Icon: HeartIcon },
  { id: 'id-card', label: 'ID card', Icon: IdCardIcon },
  { id: 'phone', label: 'Phone', Icon: PhoneIcon },
  { id: 'book', label: 'Book', Icon: Columns2Icon },
]

export type DebtIconId = (typeof DEBT_ICON_OPTIONS)[number]['id']

/** A debt's icon until the user picks one; credit cards share the sidebar's Debts icon. */
export const DEBT_TYPE_DEFAULT_ICON: Record<DebtType, DebtIconId> = {
  mortgage: 'house',
  student_loan: 'education',
  car_loan: 'car',
  personal: 'person',
  credit_card: 'cash',
  manual: 'cash',
}

/** Icon component per icon id; `fallback` for unknown ids. */
export const DEBT_ICONS: Record<string, typeof HouseIcon> = {
  ...Object.fromEntries(DEBT_ICON_OPTIONS.map((o) => [o.id, o.Icon])),
  fallback: HandCoinsIcon,
}

/** Which icon a debt shows: its chosen icon, else its type's. Look the component up in DEBT_ICONS. */
export const debtIconId = (debt: { debt_type: DebtType; icon?: string | null }) => {
  const id = debt.icon ?? DEBT_TYPE_DEFAULT_ICON[debt.debt_type]
  return id && id in DEBT_ICONS ? id : 'fallback'
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

/** Payments per year, for interest per period. */
export const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  daily: 365,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  biannual: 2,
  annually: 1,
}
