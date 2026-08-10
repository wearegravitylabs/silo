import { cn } from '@/lib/utils'

const SIZES = {
  sm: { icon: 14, h: 19, text: 'text-base' },
  md: { icon: 18, h: 24, text: 'text-xl' },
  lg: { icon: 24, h: 32, text: 'text-2xl' },
}

export function Logo({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZES
  className?: string
}) {
  const { icon, h, text } = SIZES[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={icon}
        height={h}
        viewBox="0 0 18 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Slanted cap */}
        <path d="M2 5L9 0.5L16 5V7H2V5Z" fill="#1620FF" fillOpacity="0.85" />
        {/* Stacked bars */}
        <rect x="1" y="7.5" width="16" height="2.4" fill="#1620FF" />
        <rect x="1" y="11" width="16" height="2.4" fill="#1620FF" />
        <rect x="1" y="14.5" width="16" height="2.4" fill="#1620FF" />
        <rect x="1" y="18" width="16" height="2.4" fill="#1620FF" />
        {/* Base */}
        <rect x="0" y="21" width="18" height="3" fill="#020202" />
      </svg>
      <span
        className={cn('font-normal text-foreground', text)}
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        SILO
      </span>
    </div>
  )
}
