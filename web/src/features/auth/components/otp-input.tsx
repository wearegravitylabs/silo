import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  hasError?: boolean
  className?: string
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  hasError = false,
  className,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.padEnd(length, ' ').split('').slice(0, length)

  const focus = (i: number) => refs.current[i]?.focus()

  const handleChange = (i: number, raw: string) => {
    const ch = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = ch || ' '
    onChange(next.join('').trimEnd())
    if (ch && i < length - 1) focus(i + 1)
  }

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i].trim()) {
        const next = [...digits]
        next[i] = ' '
        onChange(next.join('').trimEnd())
      } else if (i > 0) {
        focus(i - 1)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1)
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      focus(i + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    focus(Math.min(pasted.length, length - 1))
  }

  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          placeholder="·"
          className={cn(
            'w-12 h-12 text-center rounded-xl outline-none transition-colors',
            'bg-surface placeholder:text-subtle',
            hasError
              ? 'border-2 border-danger text-danger'
              : 'border border-transparent focus:border-primary text-foreground',
          )}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '20px',
            lineHeight: '28px',
          }}
        />
      ))}
    </div>
  )
}
