export interface Lot {
  quantity: string
  date: string
}

export interface ManualStockForm {
  name: string
  ticker: string
  price: string
  currency: string
  lots: Lot[]
  imageUrl: string | null
}

export type AddAssetStep = 'type-select' | 'stock-search' | 'stock-details' | 'stock-manual'
