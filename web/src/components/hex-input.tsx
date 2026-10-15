import { useState } from 'react'
import { cn } from '@/lib/utils'

const strip = (hex: string) => hex.replace('#', '').toUpperCase()

/**
 * "# BBE03B" field. Accepts only hex digits (6 max), shows red until complete, and reports each complete colour
 * as "#RRGGBB". A new `value` from outside (a swatch was picked) replaces whatever is half-typed.
 */
export function HexInput({
  value,
  onChange,
  id,
  className,
  label = 'Hex colour',
}: {
  value: string
  onChange: (hex: string) => void
  id?: string
  className?: string
  label?: string
}) {
  const [text, setText] = useState(() => strip(value))
  const [shown, setShown] = useState(value)
  // Adjust state while rendering (React's pattern for props that reset local state)
  if (value !== shown) {
    setShown(value)
    setText(strip(value))
  }

  const invalid = text.length !== 6
  return (
    <div
      className={cn(
        'flex h-8 min-w-0 items-center gap-1 rounded-lg border bg-surface px-3 transition-colors focus-within:border-primary',
        invalid ? 'border-2 border-destructive focus-within:border-destructive' : 'border-border',
        className,
      )}
    >
      <span aria-hidden className="text-muted-foreground">
        #
      </span>
      <input
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={text}
        onChange={(e) => {
          const next = e.target.value
            .replace(/[^\da-f]/gi, '')
            .slice(0, 6)
            .toUpperCase()
          setText(next)
          if (next.length === 6) onChange(`#${next}`)
        }}
        spellCheck={false}
        autoComplete="off"
        className="w-full min-w-0 bg-transparent text-foreground outline-none"
      />
    </div>
  )
}
