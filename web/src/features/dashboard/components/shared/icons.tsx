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

/** Total Net Worth mark: solid brand disc with a diamond cut-out. */
export function NetWorthIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 13.3333 13.3333" className={cn('size-3.5 text-primary-dark', className)} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.66667 0C2.98477 0 0 2.98477 0 6.66667C0 10.3486 2.98477 13.3333 6.66667 13.3333C10.3486 13.3333 13.3333 10.3486 13.3333 6.66667C13.3333 2.98477 10.3486 0 6.66667 0ZM6.19524 4.30964L4.30962 6.19526C4.04927 6.45561 4.04927 6.87772 4.30962 7.13807L6.19524 9.02369C6.45559 9.28404 6.8777 9.28404 7.13805 9.02369L9.02367 7.13807C9.28402 6.87772 9.28402 6.45561 9.02367 6.19526L7.13805 4.30964C6.8777 4.04929 6.45559 4.04929 6.19524 4.30964Z"
        fill="currentColor"
      />
    </Svg>
  )
}
