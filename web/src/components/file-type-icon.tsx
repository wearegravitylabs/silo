import { cn } from '@/lib/utils'

const BADGES: Record<string, { label: string; className: string }> = {
  doc: { label: 'W', className: 'bg-file-word' },
  docx: { label: 'W', className: 'bg-file-word' },
  xls: { label: 'X', className: 'bg-file-excel' },
  xlsx: { label: 'X', className: 'bg-file-excel' },
  csv: { label: 'X', className: 'bg-file-excel' },
  pdf: { label: 'P', className: 'bg-destructive' },
}

/** Page glyph with a coloured app badge for the file's extension (Word blue, Excel green, PDF red, else grey). */
export function FileTypeIcon({ fileName, className }: { fileName: string; className?: string }) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const badge = BADGES[ext]

  return (
    <span aria-hidden className={cn('relative flex h-10 w-8 shrink-0', className)}>
      <svg viewBox="0 0 32 40" fill="none" className="size-full">
        <path
          d="M4 .5h17L31.5 11v24.5A4 4 0 0 1 27.5 39.5h-23.5A4 4 0 0 1 .5 35.5v-31A4 4 0 0 1 4 .5Z"
          className="fill-background stroke-line"
        />
        <path d="M21 .5V8a3 3 0 0 0 3 3h7.5" className="stroke-line" />
      </svg>
      <span
        className={cn(
          'absolute bottom-2.5 left-1 flex size-3.5 items-center justify-center rounded-[3px] text-[0.5rem] leading-none font-bold text-white',
          badge?.className ?? 'bg-subtle',
        )}
      >
        {badge?.label ?? ext.slice(0, 1).toUpperCase()}
      </span>
    </span>
  )
}
