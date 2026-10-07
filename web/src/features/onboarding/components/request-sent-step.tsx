import { ClockIcon } from 'lucide-react'
import { FormHeading } from '@/components/form-field'
import { Button } from '@/components/ui/button'

// TODO: point at the real help centre once there is one.
const HELP_URL = 'mailto:support@silo.app'

/** End of the invited flow: the join request is waiting on the portfolio owner. */
export function RequestSentStep() {
  return (
    <div className="flex flex-col items-center gap-6">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent">
        <ClockIcon className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <FormHeading
        title="Request sent"
        subtitle="Your request to join this portfolio has been sent to the portfolio owner. Once approved, you will be given access to enter the portfolio"
      />
      <Button variant="secondary" size="lg" asChild className="shadow-elevated">
        <a href={HELP_URL}>Get Help</a>
      </Button>
    </div>
  )
}
