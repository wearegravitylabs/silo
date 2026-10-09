import { ChevronDownIcon, MessageSquareIcon, SquarePenIcon, XIcon } from 'lucide-react'
import { AiSparkleIcon } from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSiloAiChat } from '../../store'
import { DevStateMenu } from '../dev/dev-state-menu'

/** "✦ Silo AI ⌄" (new chat + recent chats) and the close button. */
export function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <ChatMenu />
      <div className="flex items-center gap-1">
        {import.meta.env.DEV && <DevStateMenu />}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Silo AI"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </header>
  )
}

function ChatMenu() {
  // The open chat is never in history (it's filed there when you leave it), so no "current" marker is needed.
  const { history, newChat, openChat } = useSiloAiChat()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <AiSparkleIcon />
        Silo AI
        <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem onSelect={newChat}>
          <SquarePenIcon className="size-4" />
          New chat
        </DropdownMenuItem>
        {history.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <span className="block px-2 pt-1 pb-1.5 text-xs leading-5 text-muted-foreground">Recent chats</span>
            {history.map((chat) => (
              <DropdownMenuItem key={chat.id} onSelect={() => openChat(chat.id)}>
                <MessageSquareIcon className="size-4 shrink-0" />
                <span className="truncate">{chat.title}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
