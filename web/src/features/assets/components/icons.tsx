// Asset-only icons. Size with size-*, colour with text-*.
import { Svg, type IconProps } from '@/components/icons'
import { cn } from '@/lib/utils'

export function CalendarIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-muted-foreground', className)} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 1.5a.75.75 0 0 1 .75.75V3h4.5V2.25a.75.75 0 0 1 1.5 0V3H13A1.5 1.5 0 0 1 14.5 4.5v9A1.5 1.5 0 0 1 13 15H3A1.5 1.5 0 0 1 1.5 13.5v-9A1.5 1.5 0 0 1 3 3h1.25V2.25A.75.75 0 0 1 5 1.5ZM3 6v7.5h10V6H3Z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function SortIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 12 12" className={cn('size-3 text-subtle', className)} {...props}>
      <path
        d="M6 2v8M3.5 4.5L6 2l2.5 2.5M3.5 7.5L6 10l2.5-2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function ExportIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 14 14" className={cn('size-3.5 text-muted-foreground', className)} {...props}>
      <path
        d="M7 1v8M3.5 5.5L7 9l3.5-3.5M2 10v1.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function StockTickerIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <path d="M2 11l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

export function CryptoTickerIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M6.5 5.5h3a1.5 1.5 0 0 1 0 3h-3v-3ZM6.5 8.5h3.5a1.5 1.5 0 0 1 0 3H6.5v-3Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M7.5 5v-1M8.5 5v-1M7.5 12v-1M8.5 12v-1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </Svg>
  )
}

export function RealEstateIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <path d="M2 14V7.5L8 2l6 5.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 14v-4h4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function DomainsIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12M2 8h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </Svg>
  )
}

export function PhysicalIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <path d="M8 2L5 6h6L8 2ZM5 6l-2 4h10L11 6H5ZM3 10l2 4h6l2-4H3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </Svg>
  )
}

export function VentureCapitalIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <path d="M3 13V9M6 13V7M9 13V5M12 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 5l3-2M12 3l-1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function BusinessIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <rect x="2" y="7" width="12" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 10v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

export function BankConnectionsIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <path d="M2 13h12M3 13V8M6 13V8M10 13V8M13 13V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 6l6-4 6 4H2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </Svg>
  )
}

export function CryptoWalletIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 8.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" fill="currentColor" />
      <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.1" />
    </Svg>
  )
}

export function ManualAssetIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary-dark', className)} {...props}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  )
}
