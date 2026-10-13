import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SLIDES: { title: string; banner: ReactNode; text: string }[] = [
  {
    title: 'Welcome to Silo',
    // TODO: the founders' intro video goes here; the auth backdrop stands in until it exists.
    banner: <div className="size-full bg-night bg-[url(/auth/backdrop.png)] bg-cover bg-center" />,
    text: 'Welcome to Silo, your personal silo of wealth — isolated, safe, controlled by you. Watch this short video from our founders to get a quick intro into what you can do with Silo',
  },
  {
    title: 'AI Command Bar',
    banner: (
      <div className="flex size-full items-center justify-center gap-3 bg-highlight">
        <Key>⌘</Key>
        <Key>K</Key>
      </div>
    ),
    text: 'Press command anywhere in Silo to use the AI command bar',
  },
]

/**
 * First-visit intro after onboarding: a two-slide carousel (welcome video, ⌘K command bar).
 * Get Started → next slide; Back ← previous; Done or ✕ closes.
 */
export function WelcomeModal({
  open,
  onOpenChange,
  defaultStep = 0,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Slide to open on (dev gallery). */
  defaultStep?: number
}) {
  // `dir` picks the side the incoming slide enters from
  const [{ step, dir }, setNav] = useState({ step: defaultStep, dir: 1 })
  const go = (to: number) => setNav({ step: to, dir: to > step ? 1 : -1 })
  const textId = useId()
  const slide = SLIDES[step]
  const last = step === SLIDES.length - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={textId} onCloseAutoFocus={() => setNav({ step: 0, dir: 1 })}>
        <DialogHeader>
          <DialogTitle key={step} className="animate-in font-sans duration-300 fade-in-0">
            {slide.title}
          </DialogTitle>
        </DialogHeader>

        {/* One slide at a time (each keeps its own height), sliding in from the side it comes from */}
        <section
          key={step}
          className={cn('animate-in duration-300 ease-out-expo fade-in-0', dir > 0 ? 'slide-in-from-right-8' : 'slide-in-from-left-8')}
        >
          <div className="h-46 overflow-hidden">{slide.banner}</div>
          <p id={textId} className="px-5 py-4 text-xs leading-5">
            {slide.text}
          </p>
        </section>

        <DialogFooter className="relative justify-between">
          {step > 0 ? (
            <Button variant="secondary" size="xs" onClick={() => go(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}

          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-1" aria-hidden>
            {SLIDES.map((s, i) => (
              <span
                key={s.title}
                className={cn('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-3 bg-highlight' : 'w-1.5 bg-line')}
              />
            ))}
          </div>

          <Button size="xs" onClick={() => (last ? onOpenChange(false) : go(step + 1))}>
            {last ? 'Done' : 'Get Started'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 64px white key cap with a faint lime underside. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="flex size-16 items-center justify-center rounded-2xl bg-background font-sans text-2xl font-semibold text-foreground shadow-[inset_0_-0.25rem_0_color-mix(in_srgb,var(--color-highlight)_10%,transparent)]">
      {children}
    </kbd>
  )
}
