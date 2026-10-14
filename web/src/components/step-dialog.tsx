import { useState, type ReactNode } from 'react'
import { ProgressDots } from '@/components/progress-dots'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface DialogStep {
  title: string
  content: ReactNode
  /** Primary button. Without `onClick` it goes to the next step (or closes on the last). */
  action: { label: string; onClick?: () => void; disabled?: boolean; loading?: boolean }
}

/**
 * Small modal carousel (Welcome, Secure Vault): one step at a time, sliding in from the side it comes from.
 * Footer: Back (after the first step), progress dots centred, the step's primary action. Reopens on the first step.
 */
export function StepDialog({
  open,
  onOpenChange,
  steps,
  defaultStep = 0,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  steps: DialogStep[]
  /** Step to open on (dev gallery). */
  defaultStep?: number
}) {
  const [{ step, dir }, setNav] = useState({ step: defaultStep, dir: 1 })
  const go = (to: number) => setNav({ step: to, dir: to > step ? 1 : -1 })
  const { title, content, action } = steps[step]
  const last = step === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined} onCloseAutoFocus={() => setNav({ step: 0, dir: 1 })}>
        <DialogHeader>
          <DialogTitle key={step} className="animate-in font-sans duration-300 fade-in-0">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div
          key={step}
          className={cn('animate-in duration-300 ease-out-expo fade-in-0', dir > 0 ? 'slide-in-from-right-8' : 'slide-in-from-left-8')}
        >
          {content}
        </div>

        <DialogFooter className="relative justify-between">
          {step > 0 ? (
            <Button variant="secondary" size="xs" onClick={() => go(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <ProgressDots steps={steps.length} current={step + 1} size="sm" className="absolute left-1/2 -translate-x-1/2" />
          <Button
            size="xs"
            disabled={action.disabled}
            loading={action.loading}
            onClick={action.onClick ?? (() => (last ? onOpenChange(false) : go(step + 1)))}
          >
            {action.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The usual step body: a 184px illustration band over a short paragraph. */
export function BannerStep({ banner, children }: { banner: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="h-46 overflow-hidden">{banner}</div>
      <p className="px-5 py-4 text-xs leading-5">{children}</p>
    </>
  )
}
