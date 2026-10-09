import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { AtSignIcon, PaperclipIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MENTION_OPTIONS, MENTION_RE, type MentionOption } from '../../mock-data'
import { MentionMenu } from './mention-menu'
import { SendButton } from './send-button'

const MAX_HEIGHT = 160 // px; taller drafts scroll inside the field

/** The "@word" being typed right before the caret: where it starts (at the @) and ends, and the text after the @. */
interface MentionTarget {
  start: number
  end: number
  query: string
}

function findTarget(text: string, caret: number): MentionTarget | null {
  const m = /(?:^|\s)@(\w*)$/.exec(text.slice(0, caret))
  return m ? { start: caret - m[1].length - 1, end: caret, query: m[1] } : null
}

function matches(option: MentionOption, query: string) {
  const q = query.toLowerCase()
  const extra = option.kind === 'partner' ? option.email : option.description
  return [option.name, option.token, extra].some((s) => s.toLowerCase().includes(q))
}

/**
 * Message box: gradient frame, auto-growing text, @ and attach buttons, send/stop.
 * Enter sends, Shift+Enter adds a line. Typing "@" (or the @ button) opens the mention menu;
 * picked mentions show in brand blue.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  busy = false,
  onStop = () => {},
  emptyIcon,
  autoFocus = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (text: string) => void
  /** The assistant is replying: Enter doesn't send, and the send button becomes Stop. */
  busy?: boolean
  onStop?: () => void
  emptyIcon?: 'arrow' | 'plane'
  autoFocus?: boolean
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  // A draft that already ends in "@word" (reopened panel, dev preset) opens with the menu showing.
  const [target, setTarget] = useState<MentionTarget | null>(() => findTarget(value, value.length))
  const [active, setActive] = useState(0)
  const [fromButton, setFromButton] = useState(false)
  const ready = value.trim().length > 0

  const options = target ? MENTION_OPTIONS.filter((o) => matches(o, target.query)) : []
  const menuOpen = target !== null

  // Grow with the text, up to MAX_HEIGHT.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const closeMenu = () => {
    setTarget(null)
    setFromButton(false)
  }

  /** Re-check for an "@word" at the caret (after typing or moving the caret). */
  const sync = (text: string, caret: number) => {
    const next = findTarget(text, caret)
    setTarget(next)
    if (next?.query !== target?.query) setActive(0)
    if (!next) setFromButton(false)
  }

  const setCaret = (pos: number) =>
    requestAnimationFrame(() => {
      ref.current?.focus()
      ref.current?.setSelectionRange(pos, pos)
    })

  const pick = (option: MentionOption) => {
    if (!target) return
    const insert = `@${option.token} `
    onChange(value.slice(0, target.start) + insert + value.slice(target.end))
    setCaret(target.start + insert.length)
    closeMenu()
  }

  /** The @ button: insert an "@" at the caret (spaced from the previous word) and open the menu. */
  const startMention = () => {
    const el = ref.current
    const caret = el?.selectionStart ?? value.length
    const pad = caret > 0 && !/\s/.test(value[caret - 1]) ? ' ' : ''
    onChange(value.slice(0, caret) + pad + '@' + value.slice(caret))
    const start = caret + pad.length
    setTarget({ start, end: start + 1, query: '' })
    setActive(0)
    setFromButton(true)
  }

  /** Typing in the menu's search field rewrites the "@word" in the message. */
  const setQuery = (query: string) => {
    if (!target) return
    const clean = query.replace(/\s/g, '')
    onChange(value.slice(0, target.start + 1) + clean + value.slice(target.end))
    setTarget({ ...target, end: target.start + 1 + clean.length, query: clean })
    setActive(0)
  }

  /** Arrow/Enter/Tab/Esc while the menu is open (from the message or the search field). */
  const menuKeys = (e: React.KeyboardEvent) => {
    if (!menuOpen) return false
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (options.length ? (i + step + options.length) % options.length : 0))
      return true
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && options[active]) {
      e.preventDefault()
      pick(options[active])
      return true
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation() // don't also close the panel
      closeMenu()
      ref.current?.focus()
      return true
    }
    return false
  }

  const submit = () => {
    if (ready && !busy) {
      closeMenu()
      onSubmit(value.trim())
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      // Close the mention menu only when focus leaves the whole composer (not when moving into its search field).
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) closeMenu()
      }}
      // 1px gradient frame around the tinted field
      className={cn('relative rounded-xl bg-gradient-ai p-px transition-shadow focus-within:shadow-small', className)}
    >
      {menuOpen && (
        <MentionMenu
          options={options}
          query={target.query}
          onQueryChange={setQuery}
          activeIndex={active}
          onActiveChange={setActive}
          onPick={pick}
          onKeyDown={menuKeys}
          focusSearch={fromButton}
        />
      )}

      <div className="flex flex-col gap-2 rounded-[calc(0.75rem-1px)] bg-ai-input px-4 pt-3.5 pb-2.5">
        <div className="relative">
          {/* Same text drawn behind the (transparent) textarea, with mentions in blue */}
          <div
            ref={highlightRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden leading-6 wrap-break-word whitespace-pre-wrap text-foreground"
          >
            <Highlighted text={value} />
          </div>
          <textarea
            ref={ref}
            rows={2}
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => {
              onChange(e.target.value)
              sync(e.target.value, e.target.selectionStart)
            }}
            onSelect={(e) => {
              if (!fromButton) sync(e.currentTarget.value, e.currentTarget.selectionStart)
            }}
            onScroll={(e) => {
              if (highlightRef.current) highlightRef.current.scrollTop = e.currentTarget.scrollTop
            }}
            onKeyDown={(e) => {
              if (menuKeys(e)) return
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ask Silo, Create, Search, @ to mention"
            aria-label="Message Silo AI"
            aria-expanded={menuOpen}
            className="relative block w-full resize-none bg-transparent leading-6 wrap-break-word text-transparent caret-foreground outline-none placeholder:text-subtle"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="-ml-1.5 flex items-center">
            <IconButton label="Mention" onClick={startMention}>
              <AtSignIcon className="size-4" />
            </IconButton>
            {/* Placeholder until attachments are supported */}
            <IconButton label="Attach a file (coming soon)" disabled>
              <PaperclipIcon className="size-4" />
            </IconButton>
          </div>
          <SendButton ready={ready} busy={busy} onStop={onStop} emptyIcon={emptyIcon} />
        </div>
      </div>
    </form>
  )
}

/** Message text with known @mentions in brand blue. A trailing space keeps a final empty line the same height. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {/* split() with a capture group puts the matched mentions at the odd indexes */}
      {text.split(MENTION_RE).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-primary">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}{' '}
    </>
  )
}

function IconButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      aria-disabled={disabled || undefined}
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground aria-disabled:cursor-default aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  )
}
