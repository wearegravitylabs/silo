// Small UI icons shared across features. Feature-specific icons live in that feature.
// Size with size-*, colour with text-* (all strokes/fills use currentColor).
import { useId, type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export type IconProps = SVGProps<SVGSVGElement>

/** Base for every icon: decorative by default, sized and coloured through className. */
export function Svg({ className, viewBox, children, ...props }: IconProps) {
  return (
    <svg viewBox={viewBox} fill="none" aria-hidden="true" className={cn('shrink-0', className)} {...props}>
      {children}
    </svg>
  )
}

export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-muted-foreground', className)} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 2a5 5 0 1 0 3.17 8.87l2.47 2.47a.75.75 0 1 0 1.06-1.06L11.23 9.8A5 5 0 0 0 7 2Zm-3.5 5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function RefreshIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 12 12" className={cn('size-3 text-muted-foreground', className)} {...props}>
      <path d="M10 2.5A4.5 4.5 0 1 0 10.97 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 1.5l1 1-1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ChevronDownIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 12 12" className={cn('size-3 text-muted-foreground', className)} {...props}>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function CloseIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-muted-foreground', className)} {...props}>
      <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  )
}

export function PlusCircleIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 14 14" className={cn('size-3.5 text-primary-dark', className)} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM6.25 4.75a.75.75 0 0 1 1.5 0V6.25H9.25a.75.75 0 0 1 0 1.5H7.75V9.25a.75.75 0 0 1-1.5 0V7.75H4.75a.75.75 0 0 1 0-1.5H6.25V4.75Z"
        fill="currentColor"
      />
    </Svg>
  )
}

export function DotsIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-muted-foreground', className)} {...props}>
      <circle cx="4" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="8" r="1.2" fill="currentColor" />
    </Svg>
  )
}

export function DotsVerticalIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4 text-muted-foreground', className)} {...props}>
      <circle cx="8" cy="4" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="12" r="1.2" fill="currentColor" />
    </Svg>
  )
}

export function EyeIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 13 13" className={cn('size-3.5', className)} {...props}>
      <path
        d="M1 6.5C1 6.5 3 2.5 6.5 2.5S12 6.5 12 6.5 10 10.5 6.5 10.5 1 6.5 1 6.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
    </Svg>
  )
}

export function EyeOffIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 13 13" className={cn('size-3.5', className)} {...props}>
      <path
        d="M1.5 1.5l10 10M5.5 5.6A1.5 1.5 0 0 0 7.4 7.5M3.2 3.3C2 4.2 1 6.5 1 6.5s2 4 5.5 4c1.1 0 2-.3 2.8-.8M10 9.8C11.1 8.9 12 6.5 12 6.5S10 2.5 6.5 2.5c-.9 0-1.7.2-2.4.6"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export function AlertTriangleIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={cn('size-3.5', className)} {...props}>
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}

/** Silo AI mark: a blue→red sparkle with a small orange one. Keeps its own colours. */
export function AiSparkleIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <defs>
        <linearGradient id={id} x1="2" y1="14" x2="12" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-ai-blue)" />
          <stop offset="1" stopColor="var(--color-ai)" />
        </linearGradient>
      </defs>
      <path d="M6.5 3.5 7.9 7.6 12 9l-4.1 1.4-1.4 4.1-1.4-4.1L1 9l4.1-1.4 1.4-4.1Z" fill={`url(#${id})`} />
      <path d="M12.5 1 13.2 2.8 15 3.5l-1.8.7-.7 1.8-.7-1.8L10 3.5l1.8-.7.7-1.8Z" fill="var(--color-warning)" />
    </Svg>
  )
}
