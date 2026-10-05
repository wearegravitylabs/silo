import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/** First-visit welcome. Controlled: render with open, close via onOpenChange. */
export function WelcomeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-25" overlayClassName="bg-ink/60">
        <DialogHeader>
          <DialogTitle>Welcome to Silo!</DialogTitle>
        </DialogHeader>
        <div className="flex h-46 shrink-0 items-center justify-center bg-accent">
          <LogoMark className="h-18 w-16 opacity-35" />
        </div>
        <DialogBody className="border-b">
          <DialogDescription>
            Your portfolio is ready. Start adding assets — stocks, crypto, real estate, or anything you own or owe. Everything is stored
            privately on your own infrastructure, always.
          </DialogDescription>
        </DialogBody>
        <div className="flex h-14 items-center justify-between px-5 py-3">
          <span className="w-22" />
          <div className="flex items-center gap-1 rounded-2xl p-1" aria-hidden>
            <span className="h-1.5 w-3 rounded-full bg-highlight" />
            <span className="size-1.5 rounded-full bg-line" />
          </div>
          <Button size="xs" className="w-22" onClick={() => onOpenChange(false)}>
            Explore Silo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
