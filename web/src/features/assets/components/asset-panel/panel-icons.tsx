// Side-panel icons. Size with size-*, colour with text-*.
import { Svg, type IconProps } from '@/components/icons'
import { cn } from '@/lib/utils'

export function PencilIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <path d="M11.3 2.7a1.5 1.5 0 012.1 2.1L5 13.3l-3 .7.7-3 8.6-8.3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </Svg>
  )
}

export function TrashIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <path
        d="M3 4h10M5 4V3h6v1M6 7v4M10 7v4M4 4l.7 9h6.6L12 4H4z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function FileIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 14 14" className={cn('size-3.5 text-muted-foreground', className)} {...props}>
      <path
        d="M8 2H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5L8 2zM8 2v3h3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function DownloadIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 12 12" className={cn('size-3 text-muted-foreground', className)} {...props}>
      <path d="M6 2v6M4 6l2 2 2-2M2 10h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function UploadIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 14 14" className={cn('size-3.5', className)} {...props}>
      <path d="M7 9V4M5 6l2-2 2 2M2.5 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function EyeOutlineIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <ellipse cx="8" cy="8" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </Svg>
  )
}

export function MoveIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <path
        d="M2 5a1 1 0 011-1h3l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function ReportIcon({ className, ...props }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className={cn('size-4', className)} {...props}>
      <path
        d="M3 13V4M3 4l2.5 2.5M3 4L0.5 6.5M7 3h6M7 7h5M7 11h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
