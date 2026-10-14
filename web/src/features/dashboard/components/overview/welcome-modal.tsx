import type { ReactNode } from 'react'
import { BannerStep, StepDialog, type DialogStep } from '@/components/step-dialog'

const STEPS: DialogStep[] = [
  {
    title: 'Welcome to Silo',
    content: (
      // TODO: the founders' intro video goes here; the auth backdrop stands in until it exists.
      <BannerStep banner={<div className="size-full bg-night bg-[url(/auth/backdrop.png)] bg-cover bg-center" />}>
        Welcome to Silo, your personal silo of wealth — isolated, safe, controlled by you. Watch this short video from our founders to get a
        quick intro into what you can do with Silo
      </BannerStep>
    ),
    action: { label: 'Get Started' },
  },
  {
    title: 'AI Command Bar',
    content: (
      <BannerStep
        banner={
          <div className="flex size-full items-center justify-center gap-3 bg-highlight">
            <Key>⌘</Key>
            <Key>K</Key>
          </div>
        }
      >
        Press command anywhere in Silo to use the AI command bar
      </BannerStep>
    ),
    action: { label: 'Done' },
  },
]

/** First-visit intro after onboarding: the welcome video, then the ⌘K command bar. */
export function WelcomeModal(props: { open: boolean; onOpenChange: (open: boolean) => void; defaultStep?: number }) {
  return <StepDialog steps={STEPS} {...props} />
}

/** 64px white key cap with a faint lime underside. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="flex size-16 items-center justify-center rounded-2xl bg-background font-sans text-2xl font-semibold text-foreground shadow-[inset_0_-0.25rem_0_color-mix(in_srgb,var(--color-highlight)_10%,transparent)]">
      {children}
    </kbd>
  )
}
