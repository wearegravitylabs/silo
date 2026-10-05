import { BankConnectionsIcon, BusinessIcon, CryptoTickerIcon, CryptoWalletIcon, DomainsIcon, ManualAssetIcon, PhysicalIcon, RealEstateIcon, StockTickerIcon, VentureCapitalIcon } from '../icons'

export interface AssetTypeConfig {
  id: string
  label: string
  icon: React.ReactNode
  enabled: boolean
}

export const ASSET_TYPES: AssetTypeConfig[] = [
  { id: 'stock_ticker', label: 'Stocks', icon: <StockTickerIcon />, enabled: true },
  { id: 'crypto_ticker', label: 'Crypto', icon: <CryptoTickerIcon />, enabled: false },
  { id: 'real_estate', label: 'Real Estate', icon: <RealEstateIcon />, enabled: false },
  { id: 'domain', label: 'Domains', icon: <DomainsIcon />, enabled: false },
  { id: 'physical', label: 'Physical Valuables', icon: <PhysicalIcon />, enabled: false },
  { id: 'venture_capital', label: 'Venture Capital', icon: <VentureCapitalIcon />, enabled: false },
  { id: 'business', label: 'Business', icon: <BusinessIcon />, enabled: false },
  { id: 'bank', label: 'Bank Connections', icon: <BankConnectionsIcon />, enabled: false },
  { id: 'crypto_wallet', label: 'Crypto Wallets', icon: <CryptoWalletIcon />, enabled: false },
  { id: 'manual', label: 'Manual Assets', icon: <ManualAssetIcon />, enabled: false },
]
