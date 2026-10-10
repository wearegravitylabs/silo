// Dashboard-only icons. Size with size-*, colour with text-*.
import { Svg, type IconProps } from '@/components/icons'
import { cn } from '@/lib/utils'

export function PieIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-primary', className)} {...props}>
      <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8H8V1.5Z" fill="currentColor" />
      <path d="M9.5 1.75V8H14.5A6.51 6.51 0 0 0 9.5 1.75Z" fill="currentColor" />
    </Svg>
  )
}

export function ExpandIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-muted-foreground', className)} {...props}>
      <path
        d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/** Total Net Worth mark: solid brand disc with a white ring. */
export function NetWorthIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <circle cx="8" cy="8" r="7" className="fill-primary-dark" />
      <circle cx="8" cy="8" r="3" className="stroke-white" strokeWidth="1.6" />
    </Svg>
  )
}
