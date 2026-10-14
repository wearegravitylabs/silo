import { CirclePlusIcon, SettingsIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'

/** "Vault" heading: document count, Settings and Upload Document. */
export function VaultHeader({ count, onUpload, onSettings }: { count: number; onUpload: () => void; onSettings?: () => void }) {
  return (
    <PageHeader
      eyebrow="Vault"
      className="items-center px-4 pt-5 md:px-10"
      title={
        <h1 className="flex items-baseline gap-1.5 font-sans text-[0.8125rem] font-normal text-muted-foreground">
          <span className="font-heading text-xl leading-6 font-bold text-foreground">{count}</span>
          {count === 1 ? 'document' : 'documents'}
        </h1>
      }
      actions={
        <>
          <Button variant="secondary" size="xs" onClick={onSettings}>
            <SettingsIcon className="size-3.5 text-muted-foreground" aria-hidden />
            Settings
          </Button>
          <Button size="xs" onClick={onUpload}>
            <CirclePlusIcon className="size-3.5" aria-hidden />
            Upload Document
          </Button>
        </>
      }
    />
  )
}
