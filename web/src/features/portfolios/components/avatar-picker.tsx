import { useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Built-in portfolio avatars (Figma "Onboarding - 39" faces).
const AVATARS = {
  lime: { bg: 'bg-highlight-light', hair: 'fill-highlight', shape: 'rect' },
  red: { bg: 'bg-destructive-light', hair: 'fill-destructive', shape: 'diagonal' },
  orange: { bg: 'bg-warning-light', hair: 'fill-warning', shape: 'circle' },
  green: { bg: 'bg-success-light', hair: 'fill-success', shape: 'puffs' },
} as const

export type AvatarId = keyof typeof AVATARS
const AVATAR_IDS = Object.keys(AVATARS) as AvatarId[]

const PREFIX = 'avatar:'

/** Portfolios store their built-in avatar as image_url "avatar:<id>". */
export const avatarImageUrl = (id: AvatarId) => PREFIX + id

export function avatarIdFromImageUrl(imageUrl: string | null | undefined): AvatarId {
  const id = imageUrl?.startsWith(PREFIX) ? imageUrl.slice(PREFIX.length) : ''
  return id in AVATARS ? (id as AvatarId) : 'lime'
}

function Hair({ id }: { id: AvatarId }) {
  const { hair, shape } = AVATARS[id]
  switch (shape) {
    case 'rect':
      return <rect x="-1" y="26" width="106" height="78" className={hair} />
    case 'diagonal':
      return <rect x="-20" y="0" width="144" height="54" transform="rotate(-45 52 48)" className={hair} />
    case 'circle':
      return <circle cx="53" cy="24" r="34" className={hair} />
    case 'puffs':
      return (
        <>
          <circle cx="28" cy="23" r="22" className={hair} />
          <circle cx="76" cy="23" r="22" className={hair} />
        </>
      )
  }
}

/** Round avatar face. Size with className (default 104px). */
export function AvatarFace({ id, className }: { id: AvatarId; className?: string }) {
  return (
    <div className={cn('size-26 shrink-0 overflow-hidden rounded-full', AVATARS[id].bg, className)}>
      <svg viewBox="0 0 104 104" fill="none" aria-hidden="true" className="size-full">
        <Hair id={id} />
        {/* Eyes: sclera, pupil, catchlight */}
        <circle cx="30" cy="62" r="14" className="fill-white" />
        <circle cx="34" cy="58" r="8.5" className="fill-ink" />
        <circle cx="30.5" cy="55" r="3.5" className="fill-white" />
        <circle cx="74" cy="62" r="14" className="fill-white" />
        <circle cx="78" cy="58" r="8.5" className="fill-ink" />
        <circle cx="74.5" cy="55" r="3.5" className="fill-white" />
        {/* Mouth */}
        <ellipse cx="52" cy="83" rx="13.5" ry="9" className="fill-ink" />
      </svg>
    </div>
  )
}

/**
 * Portfolio avatar card (Figma 343×136), two states in the same box:
 * the current avatar with a pencil, or — while editing — a preview, four choices and Apply.
 * The choice only reaches onChange on Apply.
 */
export function AvatarPicker({ selected, onChange }: { selected: AvatarId; onChange: (id: AvatarId) => void }) {
  const [draft, setDraft] = useState<AvatarId | null>(null) // null = not editing

  if (draft === null) {
    return (
      <div className="flex h-34 w-full items-center justify-center rounded-xl border border-border bg-background">
        <div key="view" className="relative animate-rise">
          <AvatarFace id={selected} />
          <button
            type="button"
            aria-label="Change avatar"
            onClick={() => setDraft(selected)}
            className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full bg-background text-muted-foreground shadow-button transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <PencilIcon className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-34 w-full items-center justify-between rounded-xl border border-border bg-background p-4">
      <AvatarFace key="edit" id={draft} className="animate-rise" />

      <div className="flex h-26 animate-rise flex-col items-end justify-between">
        <div className="flex" role="radiogroup" aria-label="Portfolio avatar">
          {AVATAR_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={id === draft}
              aria-label={`${id} avatar`}
              onClick={() => setDraft(id)}
              className={cn(
                'size-11 rounded-full border p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
                id === draft ? 'border-primary-dark' : 'border-transparent',
              )}
            >
              <AvatarFace id={id} className="size-10" />
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="xs"
          className="shadow-elevated"
          onClick={() => {
            onChange(draft)
            setDraft(null)
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
