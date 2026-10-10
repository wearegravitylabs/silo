import { Dialog as DialogPrimitive } from 'radix-ui'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useSiloAiPanel } from '@/stores/silo-ai-store'
import { useSiloAiChat } from '../../store'
import { Conversation } from './conversation'
import { PanelHeader } from './panel-header'
import { Welcome } from './welcome'

/**
 * Silo AI chat. Desktop (lg+): a 376px column beside the page, under the topbar. Smaller screens: a
 * full-screen sheet over the page. Open/close state is shared (useSiloAiPanel) so anything can open it.
 */
export function SiloAiPanel({ firstName }: { firstName?: string }) {
  const { open, setOpen } = useSiloAiPanel()
  // Chosen in JS, not CSS: a hidden-but-open modal sheet would still trap focus on desktop.
  const desktop = useMediaQuery('(min-width: 1024px)')
  if (!open) return null

  if (desktop) {
    return (
      <aside
        aria-label="Silo AI"
        // Esc closes the panel — but not when it comes from a menu (the mention menu stops it; the chat menu
        // lives in a portal, outside this element in the DOM, though React still bubbles its keys here).
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !e.defaultPrevented && e.currentTarget.contains(e.target as Node)) setOpen(false)
        }}
        className="flex w-94 shrink-0 animate-slide-in-right flex-col border-l border-border bg-background"
      >
        <PanelContent firstName={firstName} onClose={() => setOpen(false)} />
      </aside>
    )
  }

  return (
    <DialogPrimitive.Root open onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex animate-sheet-up flex-col bg-background outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Silo AI</DialogPrimitive.Title>
          <PanelContent firstName={firstName} onClose={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Header + welcome or conversation. Also rendered on its own by the dev gallery. */
export function PanelContent({ firstName, onClose }: { firstName?: string; onClose: () => void }) {
  const started = useSiloAiChat((s) => s.messages.length > 0)
  // Remount the body per chat, so switching chats (or loading a dev preset) resets the composer too.
  const chatId = useSiloAiChat((s) => s.chatId)
  return (
    <>
      <PanelHeader onClose={onClose} />
      {started ? (
        <div key={chatId} className="flex min-h-0 flex-1 flex-col">
          <Conversation />
        </div>
      ) : (
        <div key={chatId} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Welcome firstName={firstName} />
        </div>
      )}
    </>
  )
}
