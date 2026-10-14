import { useId } from 'react'
import { BannerStep } from '@/components/step-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/** First visit: what projections are, with the default scenario ready. Either button closes it (Create is TODO). */
export function ProjectionsIntro({
  open,
  onOpenChange,
  onCreateScenario,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateScenario?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-sans">Projections</DialogTitle>
        </DialogHeader>
        <BannerStep banner={<Illustration />}>
          Welcome! Let’s project your future net worth. We’ve created a default scenario for you
        </BannerStep>
        <DialogFooter className="justify-between">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => {
              onOpenChange(false)
              onCreateScenario?.()
            }}
          >
            Create New Scenario
          </Button>
          <Button size="xs" onClick={() => onOpenChange(false)}>
            View Default Scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Lime band: a lighter rising wedge behind a projected value, its growth, and a year slider. */
function Illustration() {
  const wedge = useId()
  return (
    <div aria-hidden className="relative size-full bg-highlight">
      <svg viewBox="0 0 426 184" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id={wedge} x1="1" y1="0" x2="0.35" y2="1">
            <stop stopColor="white" stopOpacity="0.6" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="0,108 426,14 426,184 0,184" fill={`url(#${wedge})`} />
      </svg>
      <div className="relative flex flex-col items-center pt-13.5">
        <span className="font-heading text-h5 leading-8 font-bold tracking-[-0.0125rem] text-foreground">$200,000</span>
        <span className="text-xs leading-4 font-medium text-success">+500%</span>
        <span className="relative mx-7.5 mt-6.5 h-1 self-stretch rounded-full bg-highlight-bright">
          <span className="absolute top-1/2 left-1/2 size-4 -translate-1/2 rounded-full bg-highlight-dark" />
        </span>
        <span className="mt-3.5 leading-5 text-highlight-dark">2029</span>
      </div>
    </div>
  )
}
