import { cn } from '@/lib/utils'

const SIZES = {
  sm: { mark: 'h-[19px] w-3.5', text: 'text-base leading-6' },
  md: { mark: 'h-6 w-4.5', text: 'text-xl leading-7' },
  lg: { mark: 'h-8 w-6', text: 'text-2xl leading-8' },
}

export function Logo({ size = 'md', className }: { size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size]
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg viewBox="0 0 18 24" fill="none" aria-hidden="true" className={cn('shrink-0', s.mark)}>
        {/* Slanted cap */}
        <path d="M2 5L9 0.5L16 5V7H2V5Z" className="fill-brand" fillOpacity="0.85" />
        {/* Stacked bars */}
        <rect x="1" y="7.5" width="16" height="2.4" className="fill-brand" />
        <rect x="1" y="11" width="16" height="2.4" className="fill-brand" />
        <rect x="1" y="14.5" width="16" height="2.4" className="fill-brand" />
        <rect x="1" y="18" width="16" height="2.4" className="fill-brand" />
        {/* Base */}
        <rect x="0" y="21" width="18" height="3" className="fill-ink" />
      </svg>
      <span className={cn('font-heading font-normal text-foreground', s.text)}>SILO</span>
    </div>
  )
}

/** The bare silo mark, used as a decorative illustration (welcome, empty states). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 22" fill="none" aria-hidden="true" className={cn('shrink-0', className)}>
      <path d="M2 4.5L9 0.5L16 4.5V6.5H2V4.5Z" className="fill-primary-dark" />
      {[7, 10, 13, 16].map((y) => (
        <rect key={y} x="1.5" y={y} width="15" height="2" rx="0.5" className="fill-primary-dark" />
      ))}
      <rect x="0.5" y="19" width="17" height="2.5" rx="0.5" className="fill-ink" />
    </svg>
  )
}
