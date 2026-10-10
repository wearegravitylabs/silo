import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowDownIcon, ArrowUpIcon, AtSignIcon, CornerDownLeftIcon, FileUpIcon, PlusCircleIcon, SettingsIcon } from 'lucide-react'
import { AiSparkleIcon } from '@/components/icons'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { MENTION_RE, MENTIONS, QUICK_ACTIONS, SUGGESTIONS, type MentionToken, type QuickAction } from '../data'

/** What the palette selected: a quick action, or a prompt for Silo AI. */
export type PaletteSelection = { kind: 'action'; action: QuickAction } | { kind: 'ask'; prompt: string }

type Item = { id: string; label: string; selection: PaletteSelection; icon: ReactNode; badge?: string }
type Group = { title: string; items: Item[] }

/** The "@word" right before the caret. */
function findMention(text: string, caret: number) {
  const m = /(?:^|\s)@(\w*)$/.exec(text.slice(0, caret))
  return m ? { start: caret - m[1].length - 1, end: caret, query: m[1] } : null
}

/** The first known @mention in the text, and the rest of the text without it. */
function splitMention(text: string): { token: MentionToken | null; rest: string } {
  const match = new RegExp(MENTION_RE.source).exec(text)
  if (!match) return { token: null, rest: text.trim() }
  return { token: match[1].slice(1) as MentionToken, rest: (text.slice(0, match.index) + text.slice(match.index + match[1].length)).trim() }
}

const sparkle = <AiSparkleIcon className="size-4" />
/** A Silo AI prompt. `label` is what's shown (e.g. without the @mention that's still sent). */
const ask = (prompt: string, label = prompt): Item => ({ id: `ask:${label}`, label, selection: { kind: 'ask', prompt }, icon: sparkle })
const action = (a: QuickAction): Item => ({
  id: `action:${a.id}`,
  label: a.label,
  selection: { kind: 'action', action: a },
  icon:
    a.icon === 'upload' ? (
      <FileUpIcon className="size-4 text-muted-foreground" />
    ) : (
      <PlusCircleIcon className="size-4 text-muted-foreground" />
    ),
  badge: `@${a.mention}`,
})

/** Groups for the current text (none while the @ menu is open). */
function groupsFor(text: string): Group[] {
  const { token, rest } = splitMention(text)
  if (!text.trim()) {
    return [
      { title: 'Quick Actions', items: QUICK_ACTIONS.map(action) },
      { title: 'Suggestions', items: SUGGESTIONS.map((s) => ask(s)) },
    ]
  }
  if (token && !rest) {
    const mention = MENTIONS.find((m) => m.token === token)!
    return [
      {
        title: 'Suggestions',
        items: mention.suggestions.map((s) => ask(`@${token} ${s}`, s)),
      },
    ]
  }
  if (token) return [{ title: 'AI Suggestions', items: [ask(text.trim(), rest)] }]

  const q = rest.toLowerCase()
  return [
    { title: 'Quick Actions', items: QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q)).map(action) },
    { title: 'Suggestions', items: SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).map((s) => ask(s)) },
    { title: 'AI Suggestions', items: [ask(rest)] },
  ].filter((g) => g.items.length > 0)
}

/**
 * ⌘K palette: search quick actions and suggestions, "@" to scope to a section, or type anything to ask
 * Silo AI. UI only for now — selecting closes the palette and reports the choice through onSelect.
 */
export function CommandPalette({
  open,
  onOpenChange,
  onSelect,
  defaultText = '',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (selection: PaletteSelection) => void
  /** Pre-filled text (dev previews). */
  defaultText?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Remounted on each open, so it always starts fresh. */}
      {open && <PaletteBody onClose={() => onOpenChange(false)} onSelect={onSelect} defaultText={defaultText} />}
    </Dialog>
  )
}

function PaletteBody({
  onClose,
  onSelect,
  defaultText,
}: {
  onClose: () => void
  onSelect?: (s: PaletteSelection) => void
  defaultText: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState(defaultText)
  const [mention, setMention] = useState(() => findMention(defaultText, defaultText.length))
  const [active, setActive] = useState(0)

  const groups = useMemo(() => (mention ? [] : groupsFor(text)), [text, mention])
  const items = groups.flatMap((g) => g.items)
  const mentionOptions = mention ? MENTIONS.filter((m) => m.name.toLowerCase().startsWith(mention.query.toLowerCase())) : []

  // Whatever changes the list also resets the highlight to its first item.
  const update = (value: string, caret: number) => {
    setText(value)
    setMention(findMention(value, caret))
    setActive(0)
  }
  const syncMention = (value: string, caret: number) => {
    const next = findMention(value, caret)
    if (next?.query !== mention?.query || !next !== !mention) setActive(0)
    setMention(next)
  }

  const pickMention = (token: MentionToken) => {
    if (!mention) return
    const insert = `@${token} `
    const next = text.slice(0, mention.start) + insert + text.slice(mention.end)
    setText(next)
    setMention(null)
    setActive(0)
    requestAnimationFrame(() => {
      const pos = mention.start + insert.length
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(pos, pos)
    })
  }

  const choose = (item: Item) => {
    onSelect?.(item.selection)
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const count = mention ? mentionOptions.length : items.length
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (count) setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + count) % count)
    } else if (e.key === 'Enter' || (e.key === 'Tab' && mention)) {
      e.preventDefault()
      if (mention && mentionOptions[active]) pickMention(mentionOptions[active].token)
      else if (!mention && items[active]) choose(items[active])
    }
  }

  return (
    <DialogContent
      size="md"
      position="top"
      aria-describedby={undefined}
      // Esc closes the @ menu first, then the palette.
      onEscapeKeyDown={(e) => {
        if (mention) {
          e.preventDefault()
          setMention(null)
          setActive(0)
        }
      }}
    >
      <DialogTitle className="sr-only">Search or ask Silo AI</DialogTitle>

      <div className="relative shrink-0 border-b border-border">
        <div className="flex h-12 items-center gap-3 px-4">
          <div className="relative min-w-0 flex-1">
            {/* Same text drawn behind the (transparent) input, with mentions as blue chips */}
            <div
              ref={highlightRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre text-foreground"
            >
              <Highlighted text={text} />
            </div>
            <input
              ref={inputRef}
              autoFocus
              value={text}
              onChange={(e) => update(e.target.value, e.target.selectionStart ?? e.target.value.length)}
              onSelect={(e) => syncMention(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
              onScroll={(e) => {
                if (highlightRef.current) highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
              }}
              onKeyDown={onKeyDown}
              placeholder="Search, Type @ or Ask Silo AI"
              aria-label="Search or ask Silo AI"
              aria-expanded={!!mention}
              className="relative w-full bg-transparent text-transparent caret-foreground outline-none placeholder:text-subtle"
            />
          </div>
          <AiSparkleIcon className="size-4" />
        </div>

        {mention && <MentionDropdown options={mentionOptions} active={active} onActive={setActive} onPick={pickMention} />}
      </div>

      {/* While choosing a mention the list steps aside; the space keeps the dropdown inside the card */}
      <div role="listbox" aria-label="Results" className={cn('flex min-h-0 flex-col overflow-y-auto p-2', mention && 'h-40')}>
        {groups.map((group) => (
          <Fragment key={group.title}>
            <span className="px-2 pt-1.5 pb-1 text-xs leading-5 text-muted-foreground">{group.title}</span>
            {group.items.map((item) => {
              const index = items.indexOf(item)
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                  className={cn(
                    'flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2 text-left text-foreground',
                    index === active && 'bg-accent',
                  )}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="shrink-0 rounded-md bg-accent px-1.5 text-xs leading-5 text-muted-foreground">{item.badge}</span>
                  )}
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="flex h-12 shrink-0 items-center justify-between border-t border-border px-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Hint label="Navigate">
            <Key>
              <ArrowUpIcon />
            </Key>
            <Key>
              <ArrowDownIcon />
            </Key>
          </Hint>
          <Hint label="Select">
            <Key>
              <CornerDownLeftIcon />
            </Key>
          </Hint>
          <Hint label="Mention">
            <Key>
              <AtSignIcon />
            </Key>
          </Hint>
        </div>
        {/* Placeholder until palette settings exist */}
        <button
          type="button"
          aria-label="Search settings"
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <SettingsIcon className="size-4" />
        </button>
      </div>
    </DialogContent>
  )
}

function MentionDropdown({
  options,
  active,
  onActive,
  onPick,
}: {
  options: (typeof MENTIONS)[number][]
  active: number
  onActive: (i: number) => void
  onPick: (token: MentionToken) => void
}) {
  return (
    <div
      role="listbox"
      aria-label="Mention"
      className="absolute top-full left-2 z-10 mt-1 w-69 animate-rise rounded-xl bg-background p-1 shadow-dropdown"
    >
      {options.length === 0 && <p className="px-2 py-3 text-center text-xs">No matches</p>}
      {options.map((m, i) => (
        <button
          key={m.token}
          type="button"
          role="option"
          aria-selected={i === active}
          onMouseEnter={() => onActive(i)}
          // mousedown keeps focus (and the caret) in the input
          onMouseDown={(e) => {
            e.preventDefault()
            onPick(m.token)
          }}
          className={cn('flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left', i === active && 'bg-accent')}
        >
          <AtSignIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-foreground">{m.name}</span>
            <span className="truncate text-xs leading-4 text-muted-foreground">{m.description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

/** Input text with known @mentions as blue chips (background only, so widths match the input exactly). */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(MENTION_RE).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="rounded-sm bg-primary-subtle text-primary">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <span className="flex items-center gap-0.5">{children}</span>
    </span>
  )
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="flex size-4 items-center justify-center rounded-sm border border-border bg-accent font-sans text-muted-foreground [&_svg]:size-2.5">
      {children}
    </kbd>
  )
}
