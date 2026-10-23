import type { ReactNode } from 'react'
import {
  AppleIcon,
  BriefcaseBusinessIcon,
  CirclePlusIcon,
  Columns3Icon,
  DatabaseIcon,
  GemIcon,
  GlobeIcon,
  KeyRoundIcon,
  LandmarkIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'
import {
  BankConnectionsIcon,
  BusinessIcon,
  CryptoTickerIcon,
  CryptoWalletIcon,
  DomainsIcon,
  ManualAssetIcon,
  PhysicalIcon,
  RealEstateIcon,
  StockTickerIcon,
  VentureCapitalIcon,
} from './components/icons'
import type { Investability } from './types'

export const ASSET_TYPE_LABELS: Record<string, string> = {
  stock_ticker: 'Stock',
  stock_manual: 'Stock',
  crypto_ticker: 'Crypto',
  crypto_manual: 'Crypto',
  real_estate: 'Real Estate',
  domain: 'Domain',
  physical: 'Physical Valuable',
  venture_capital: 'Venture Capital',
  business: 'Business',
  bank: 'Bank Connection',
  crypto_wallet: 'Crypto Wallet',
  manual: 'Manual',
}

export interface AssetTypeConfig {
  id: string
  label: string
  icon: ReactNode
}

/** Every asset kind with its icon (asset discs without a logo, Projections' asset lists). */
export const ASSET_TYPES: AssetTypeConfig[] = [
  { id: 'stock_ticker', label: 'Stocks', icon: <StockTickerIcon /> },
  { id: 'crypto_ticker', label: 'Crypto', icon: <CryptoTickerIcon /> },
  { id: 'real_estate', label: 'Real Estate', icon: <RealEstateIcon /> },
  { id: 'domain', label: 'Domains', icon: <DomainsIcon /> },
  { id: 'physical', label: 'Physical Valuables', icon: <PhysicalIcon /> },
  { id: 'venture_capital', label: 'Venture Capital', icon: <VentureCapitalIcon /> },
  { id: 'business', label: 'Business', icon: <BusinessIcon /> },
  { id: 'bank', label: 'Bank Connections', icon: <BankConnectionsIcon /> },
  { id: 'crypto_wallet', label: 'Crypto Wallets', icon: <CryptoWalletIcon /> },
  { id: 'manual', label: 'Manual Assets', icon: <ManualAssetIcon /> },
]

/** Manual stock/crypto share their ticker cousin's icon. */
export const assetTypeIcon = (type: string) =>
  (ASSET_TYPES.find((t) => t.id === type.replace('_manual', '_ticker')) ?? ASSET_TYPES.at(-1)!).icon

/** Asset Type filter: one entry per label (manual and ticker stocks are both "Stock"), A–Z. */
export const ASSET_TYPE_FILTER_OPTIONS = Object.entries(ASSET_TYPE_LABELS)
  .filter(([id]) => !id.endsWith('_manual'))
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const INVESTABILITY_LABELS: Record<Investability, string> = {
  investable: 'Investable',
  non_investable: 'Non-Investable',
}

export const INVESTABILITY_FILTER_OPTIONS = (Object.keys(INVESTABILITY_LABELS) as Investability[]).map((value) => ({
  value,
  label: INVESTABILITY_LABELS[value],
}))

export interface CreatableAssetType {
  id: string
  label: string
  Icon: LucideIcon
  /** Only stocks can be added today; the rest show "Coming soon". */
  enabled: boolean
}

/** Create Asset → Choose an Asset Type, in the design's order (two columns, read across). */
export const CREATABLE_ASSET_TYPES: CreatableAssetType[] = [
  { id: 'stock_ticker', label: 'Stocks', Icon: AppleIcon, enabled: true },
  { id: 'crypto_ticker', label: 'Crypto', Icon: DatabaseIcon, enabled: false },
  { id: 'real_estate', label: 'Real Estate', Icon: KeyRoundIcon, enabled: false },
  { id: 'domain', label: 'Domains', Icon: GlobeIcon, enabled: false },
  { id: 'physical', label: 'Physical Valuables', Icon: GemIcon, enabled: false },
  { id: 'venture_capital', label: 'Venture Capital', Icon: BriefcaseBusinessIcon, enabled: false },
  { id: 'business', label: 'Business', Icon: Columns3Icon, enabled: false },
  { id: 'bank', label: 'Bank Connections', Icon: LandmarkIcon, enabled: false },
  { id: 'crypto_wallet', label: 'Crypto Exchanges/Wallet', Icon: WalletIcon, enabled: false },
  { id: 'manual', label: 'Manual Assets', Icon: CirclePlusIcon, enabled: false },
]

/** Largest quantity one purchase can record. */
export const MAX_LOT_QUANTITY = 1_000_000
