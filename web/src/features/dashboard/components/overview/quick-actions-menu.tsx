import type { ReactNode } from 'react'
import { CirclePlusIcon, FileUpIcon } from 'lucide-react'
import { AiSparkleIcon, ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export type QuickAssetType = 'stock' | 'crypto' | 'real_estate'

const add = <CirclePlusIcon className="size-4" aria-hidden />

/** Dashboard shortcuts: add an asset (stock, crypto, real estate) or a debt, upload a document, ask Silo AI. */
export function QuickActionsMenu({
  onAddAsset,
  onAddDebt,
  onUploadDocument,
  onAskAi,
}: {
  onAddAsset: (type: QuickAssetType) => void
  onAddDebt: () => void
  onUploadDocument: () => void
  onAskAi: () => void
}) {
  const actions: { label: string; icon: ReactNode; onSelect: () => void }[] = [
    { label: 'Add stock', icon: add, onSelect: () => onAddAsset('stock') },
    { label: 'Add Crypto', icon: add, onSelect: () => onAddAsset('crypto') },
    { label: 'Add Real Estate', icon: add, onSelect: () => onAddAsset('real_estate') },
    { label: 'Add Debt', icon: add, onSelect: onAddDebt },
    { label: 'Upload Document', icon: <FileUpIcon className="size-4" aria-hidden />, onSelect: onUploadDocument },
    { label: 'Ask Silo AI', icon: <AiSparkleIcon className="size-4" />, onSelect: onAskAi },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="xs" className="group gap-1 shadow-elevated aria-expanded:shadow-none">
          Quick Actions
          <ChevronDownIcon className="text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-65">
        {actions.map(({ label, icon, onSelect }) => (
          <DropdownMenuItem key={label} onSelect={onSelect} className="py-1.5">
            {icon}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
