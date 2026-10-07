import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRuleMutations } from '../queries'
import type { AutopilotRule } from '../types'

/** Confirm pausing a rule. Rendered only while a rule is selected. */
export function PauseRuleDialog({ rule, portfolioId, onClose }: { rule: AutopilotRule; portfolioId: string; onClose: () => void }) {
  const { pause } = useRuleMutations(portfolioId)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent role="alertdialog">
        <DialogHeader>
          <DialogTitle>Pause Rule</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>This will pause this rule. The rule will not execute until you resume it.</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="xs">
              Close
            </Button>
          </DialogClose>
          <Button size="xs" loading={pause.isPending} loadingText="Pausing…" onClick={() => pause.mutate(rule.id, { onSuccess: onClose })}>
            Pause Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
