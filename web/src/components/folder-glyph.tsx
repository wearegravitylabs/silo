import { useId } from 'react'
import { cn } from '@/lib/utils'

// Back panel with its tab, then the front flap; both drawn in currentColor.
const BACK =
  'M2.5 1h6.3a1.5 1.5 0 0 1 1.06.44L11.5 3h10A1.5 1.5 0 0 1 23 4.5v13a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 1 17.5v-15A1.5 1.5 0 0 1 2.5 1Z'
const FRONT = 'M1 7.5A1.5 1.5 0 0 1 2.5 6h19A1.5 1.5 0 0 1 23 7.5v10a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 1 17.5Z'

/**
 * Glossy folder in `currentColor` (folder tabs, folder cards, the Create Folder disc): a shaded back panel and tab
 * behind a front flap with a light sheen. Set the colour with `style={{ color }}` or a text class; size with className.
 */
export function FolderGlyph({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId()
  return (
    <svg viewBox="0 0 24 20" aria-hidden className={cn('size-4.5 shrink-0', className)} style={style}>
      <defs>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="white" stopOpacity="0.08" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={BACK} fill="currentColor" />
      <path d={BACK} fill="black" fillOpacity="0.28" />
      <path d={FRONT} fill="currentColor" />
      <path d={FRONT} fill={`url(#${id}-sheen)`} />
      <path d="M2.5 6.5h19" stroke="white" strokeOpacity="0.5" strokeWidth="0.5" strokeLinecap="round" />
    </svg>
  )
}
