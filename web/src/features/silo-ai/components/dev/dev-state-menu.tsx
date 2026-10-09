import { FlaskConicalIcon, PlayIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CHAT_PRESETS, SCRIPTED_PROMPTS } from '../../presets'
import { useSiloAiChat } from '../../store'

/**
 * Dev-only: jump the panel to any designed state, or play a scripted prompt live through the mock engine.
 * Rendered only when import.meta.env.DEV, so it's dropped from production builds.
 */
export function DevStateMenu() {
  const { load, send } = useSiloAiChat()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Dev: Silo AI states"
        title="Dev: Silo AI states"
        className="flex size-7 items-center justify-center rounded-md text-subtle transition-colors outline-none hover:bg-accent hover:text-foreground"
      >
        <FlaskConicalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] w-60 overflow-y-auto">
        <span className="block px-2 pt-1 pb-1.5 text-xs leading-5 text-muted-foreground">Jump to state</span>
        {CHAT_PRESETS.map((preset) => (
          <DropdownMenuItem key={preset.id} onSelect={() => load(preset.snapshot)}>
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <span className="block px-2 pt-1 pb-1.5 text-xs leading-5 text-muted-foreground">Play live (mock engine)</span>
        {SCRIPTED_PROMPTS.map((prompt) => (
          <DropdownMenuItem key={prompt} onSelect={() => send(prompt)}>
            <PlayIcon className="size-3.5 shrink-0" />
            <span className="truncate">{prompt}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
