import { Svg } from '@/components/icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useRuleMutations } from '../queries'
import type { AutopilotRule } from '../types'

/** ⋯ menu on a rule card: pause/resume, edit, delete. */
export function RuleMenu({
  rule,
  portfolioId,
  onEdit,
  onPause,
}: {
  rule: AutopilotRule
  portfolioId: string
  onEdit: () => void
  onPause: () => void
}) {
  const { remove, resume } = useRuleMutations(portfolioId)
  const item = 'gap-2 rounded-md px-3 py-2  font-normal [&_svg]:size-3 [&_svg]:text-current'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Rule options"
        className="flex items-center rounded-sm px-1 py-0.5 text-subtle outline-none hover:text-muted-foreground"
      >
        <Svg viewBox="0 0 14 14" className="size-3.5">
          <circle cx="3" cy="7" r="1.1" fill="currentColor" />
          <circle cx="7" cy="7" r="1.1" fill="currentColor" />
          <circle cx="11" cy="7" r="1.1" fill="currentColor" />
        </Svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-37 p-1">
        {rule.is_active ? (
          <DropdownMenuItem className={item} onSelect={onPause}>
            <Svg viewBox="0 0 12 12">
              <rect x="2.5" y="2" width="3" height="8" rx="0.8" fill="currentColor" />
              <rect x="6.5" y="2" width="3" height="8" rx="0.8" fill="currentColor" />
            </Svg>
            Pause Rule
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className={cn(item, 'text-positive')} onSelect={() => resume.mutate(rule.id)}>
            <Svg viewBox="0 0 12 12">
              <path d="M3 2l7 4-7 4V2z" fill="currentColor" />
            </Svg>
            Resume Rule
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className={item} onSelect={onEdit}>
          <Svg viewBox="0 0 12 12">
            <path d="M8.5 1.5l2 2-7 7-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </Svg>
          Edit Rule
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" className={item} onSelect={() => remove.mutate(rule.id)}>
          <Svg viewBox="0 0 12 12">
            <path
              d="M2 3h8M4 3V2h4v1M5 5.5v3M7 5.5v3M3 3l.5 7h5l.5-7H3z"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          Delete Rule
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
