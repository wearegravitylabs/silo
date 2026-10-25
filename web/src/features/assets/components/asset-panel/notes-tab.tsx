import { NotesTabView } from '@/components/notes-tab-view'
import { useAssetNoteMutations, useAssetNotes } from '../../panel-queries'
import type { AssetItem } from '../../types'

/** Note tab: the asset's notes (edit, delete) and Add Note. */
export function NotesTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const { data: notes, isPending } = useAssetNotes(portfolioId, asset.id)
  const { save, remove } = useAssetNoteMutations(portfolioId, asset.id)
  return (
    <NotesTabView
      notes={notes}
      loading={isPending}
      saving={save.isPending}
      onSave={(input, done) => save.mutate(input, { onSuccess: done })}
      onDelete={(id) => remove.mutate(id)}
    />
  )
}
