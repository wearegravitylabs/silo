import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const badge = (label: string, className: string) => (
  <span
    className={cn('flex size-3 items-center justify-center rounded-[0.1875rem] text-[0.5rem] leading-none font-bold text-white', className)}
  >
    {label}
  </span>
)

const PDF = (
  <svg viewBox="0 0 12 12" className="size-3">
    <rect width="12" height="12" rx="2" className="fill-file-pdf" />
    {/* Acrobat swoosh */}
    <path
      d="M3 9.2c1.4-.8 2.6-2.7 3-4.7.2-1-.1-1.7-.6-1.7-.6 0-.8.8-.5 1.8.5 1.6 1.9 3.3 3.8 3.6.6.1.9-.2.8-.5-.2-.5-1.3-.6-2.7-.3-1.5.3-3 1-3.8 1.8-.4.4-.3.8 0 .7Z"
      fill="none"
      stroke="white"
      strokeWidth=".8"
      strokeLinejoin="round"
    />
  </svg>
)

const IMAGE = (
  <svg viewBox="0 0 12 12" className="size-3">
    <rect width="12" height="10" y="1" rx="1.5" className="fill-primary-dark" />
    <path d="m2 9 2.6-3 1.8 2 1.3-1.4L10 9Z" fill="white" />
    <circle cx="8.3" cy="3.8" r="1" fill="white" />
  </svg>
)

/** Glyph per extension; anything else shows its first letter. */
const GLYPHS: Record<string, ReactNode> = {
  pdf: PDF,
  doc: badge('W', 'bg-file-word'),
  docx: badge('W', 'bg-file-word'),
  xls: badge('X', 'bg-file-excel'),
  xlsx: badge('X', 'bg-file-excel'),
  csv: badge('X', 'bg-file-excel'),
  ...Object.fromEntries(['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'svg'].map((ext) => [ext, IMAGE])),
}

/** Page outline with the file type's glyph near the bottom (Acrobat red, Word blue, Excel green, image blue, else a letter). */
export function FileTypeIcon({ fileName, className }: { fileName: string; className?: string }) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  return (
    <span aria-hidden className={cn('relative flex h-10 w-8 shrink-0', className)}>
      <svg viewBox="0 0 32 40" fill="none" className="size-full">
        <path
          d="M4 .5h17L31.5 11v24.5A4 4 0 0 1 27.5 39.5h-23.5A4 4 0 0 1 .5 35.5v-31A4 4 0 0 1 4 .5Z"
          className="fill-background stroke-line"
        />
        <path d="M21 .5V8a3 3 0 0 0 3 3h7.5" className="stroke-line" />
      </svg>
      <span className="absolute inset-x-0 bottom-2.5 flex justify-center">
        {GLYPHS[ext] ?? <span className="text-sm leading-3 font-medium text-muted-foreground">{ext.slice(0, 1).toUpperCase()}</span>}
      </span>
    </span>
  )
}
