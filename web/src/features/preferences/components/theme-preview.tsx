import { cn } from '@/lib/utils'

/**
 * A miniature app window — traffic lights, title, two rows of cards — drawn in a fixed light or dark palette
 * (a nested data-theme), so each card shows that theme whatever the app is in. The accent tint carries through.
 * Scales with its container (171×120 in the design).
 */
export function ThemePreview({ theme, className }: { theme: 'light' | 'dark'; className?: string }) {
  return (
    <div data-theme={theme} className={cn('size-full', className)}>
      <svg viewBox="0 0 171 120" preserveAspectRatio="xMinYMin slice" aria-hidden className="block size-full">
        <rect width="171" height="120" className="fill-surface" />
        <rect x="12" y="15" width="147" height="112" rx="4" className="fill-background stroke-line" strokeWidth="0.5" />
        <circle cx="17.5" cy="21.5" r="1.4" className="fill-destructive" />
        <circle cx="21.5" cy="21.5" r="1.4" className="fill-warning" />
        <circle cx="25.5" cy="21.5" r="1.4" className="fill-success" />
        <rect x="12" y="27" width="147" height="0.5" className="fill-line" />
        <rect x="20" y="35" width="15" height="4" rx="2" className="fill-accent" />
        <rect x="20" y="45" width="93" height="43" rx="4" className="fill-accent" />
        <rect x="117" y="45" width="31" height="43" rx="4" className="fill-accent" />
        <rect x="20" y="95" width="40" height="30" rx="4" className="fill-accent" />
        <rect x="64" y="95" width="40" height="30" rx="4" className="fill-accent" />
        <rect x="108" y="95" width="40" height="30" rx="4" className="fill-accent" />
      </svg>
    </div>
  )
}
