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
    <Svg viewBox="0 0 24 24" className={cn('size-3 text-muted-foreground', className)} {...props}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </g>
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

/** Silo AI mark: a large and a small sparkle in one magenta → blue → red → orange gradient. Keeps its own colours. */
export function AiSparkleIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <Svg viewBox="0 0 14 13" className={cn('size-4', className)} {...props}>
      <defs>
        <linearGradient id={id} x1="6.59" y1="0" x2="6.59" y2="12.82" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-ai-spark-1)" />
          <stop offset="0.25" stopColor="var(--color-primary-dark)" />
          <stop offset="0.5" stopColor="var(--color-ai-spark-3)" />
          <stop offset="1" stopColor="var(--color-ai-spark-4)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M2.78247 6.98042L2.8958 7.22775C3.38078 8.23085 4.1446 9.0729 5.0958 9.65309L5.27247 9.75642C5.29121 9.76689 5.30681 9.78218 5.31768 9.80069C5.32854 9.81921 5.33427 9.84029 5.33427 9.86176C5.33427 9.88322 5.32854 9.9043 5.31768 9.92282C5.30681 9.94133 5.29121 9.95661 5.27247 9.96709C4.24056 10.5474 3.41114 11.4299 2.8958 12.4958L2.78247 12.7438C2.77241 12.7659 2.75618 12.7847 2.73573 12.7979C2.71528 12.811 2.69146 12.8181 2.66713 12.8181C2.6428 12.8181 2.61899 12.811 2.59854 12.7979C2.57808 12.7847 2.56186 12.7659 2.5518 12.7438L2.43847 12.4958C1.92313 11.4299 1.09371 10.5474 0.0617996 9.96709C0.0430601 9.95661 0.0274537 9.94133 0.0165904 9.92282C0.005727 9.9043 0 9.88322 0 9.86176C0 9.84029 0.005727 9.81921 0.0165904 9.80069C0.0274537 9.78218 0.0430601 9.76689 0.0617996 9.75642L0.238466 9.65309C1.18967 9.0729 1.95349 8.23085 2.43847 7.22775L2.5518 6.98042C2.56186 6.95827 2.57808 6.93948 2.59854 6.92631C2.61899 6.91313 2.6428 6.90613 2.66713 6.90613C2.69146 6.90613 2.71528 6.91313 2.73573 6.92631C2.75618 6.93948 2.77241 6.95827 2.78247 6.98042ZM8.71913 0.131088C9.59659 2.18649 11.1284 3.89452 13.0765 4.98975C13.1092 5.00812 13.1365 5.03488 13.1555 5.06727C13.1744 5.09967 13.1844 5.13654 13.1844 5.17409C13.1844 5.21164 13.1744 5.2485 13.1555 5.2809C13.1365 5.3133 13.1092 5.34006 13.0765 5.35842C11.1282 6.45379 9.59642 8.16208 8.71913 10.2178C8.7018 10.2568 8.67352 10.2899 8.63773 10.3132C8.60193 10.3365 8.56016 10.3488 8.51747 10.3488C8.47477 10.3488 8.433 10.3365 8.3972 10.3132C8.36141 10.2899 8.33313 10.2568 8.3158 10.2178C7.43851 8.16208 5.9067 6.45379 3.95847 5.35842C3.92572 5.34006 3.89845 5.3133 3.87947 5.2809C3.8605 5.2485 3.85049 5.21164 3.85049 5.17409C3.85049 5.13654 3.8605 5.09967 3.87947 5.06727C3.89845 5.03488 3.92572 5.00812 3.95847 4.98975C5.90656 3.89452 7.43835 2.18649 8.3158 0.131088C8.33313 0.0920714 8.36141 0.0589198 8.3972 0.0356522C8.433 0.0123845 8.47477 0 8.51747 0C8.56016 0 8.60193 0.0123845 8.63773 0.0356522C8.67352 0.0589198 8.7018 0.0920714 8.71913 0.131088Z"
      />
    </Svg>
  )
}

/** Premium plan gem: lime → mint → blue. Keeps its own colours. */
export function PremiumIcon({ className, ...props }: IconProps) {
  const id = useId()
  return (
    <Svg viewBox="0 0 11 14" className={cn('h-3.5 w-2.75', className)} {...props}>
      <defs>
        <linearGradient id={id} x1="5.47" y1="0" x2="5.47" y2="13.57" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-highlight)" />
          <stop offset="0.5" stopColor="var(--color-mint)" />
          <stop offset="1" stopColor="var(--color-primary-dark)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.68867 0.380504C4.78227 0.261898 4.90153 0.166043 5.03749 0.10014C5.17345 0.0342372 5.32258 0 5.47367 0C5.62476 0 5.77389 0.0342372 5.90985 0.10014C6.04581 0.166043 6.16507 0.261898 6.25867 0.380504L10.6607 5.95917C10.8464 6.19446 10.9473 6.48544 10.9473 6.78517C10.9473 7.0849 10.8464 7.37589 10.6607 7.61117L6.25867 13.1898C6.16508 13.3086 6.04578 13.4045 5.90976 13.4705C5.77373 13.5365 5.62452 13.5708 5.47334 13.5708C5.32216 13.5708 5.17294 13.5365 5.03692 13.4705C4.90089 13.4045 4.7816 13.3086 4.688 13.1898L0.286671 7.61184C0.100989 7.37655 0 7.08557 0 6.78584C0 6.48611 0.100989 6.19512 0.286671 5.95984L4.68867 0.381171V0.380504Z"
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

export function CalendarIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-3.5', className)} {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 1.5a.75.75 0 0 1 .75.75V3h4.5V2.25a.75.75 0 0 1 1.5 0V3H13A1.5 1.5 0 0 1 14.5 4.5v9A1.5 1.5 0 0 1 13 15H3A1.5 1.5 0 0 1 1.5 13.5v-9A1.5 1.5 0 0 1 3 3h1.25V2.25A.75.75 0 0 1 5 1.5ZM3 6v7.5h10V6H3Z"
      />
    </Svg>
  )
}

/** Filled info dot for field hints ("This is the currency you mostly operate with"). */
export function InfoDotIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" className={cn('size-3', className)} {...props}>
      <circle cx="12" cy="12" r="10" className="fill-subtle" />
      <path d="M12 16v-4M12 8h.01" className="stroke-white" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  )
}
