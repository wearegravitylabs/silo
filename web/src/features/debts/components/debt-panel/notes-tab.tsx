import { NotesTabView } from '@/components/notes-tab-view'
import { useDebtNoteMutations, useDebtNotes } from '../../queries'
import type { Debt } from '../../types'

/** Note tab: the debt's notes (edit, delete) and Add Note. */
export function NotesTab({ debt, portfolioId }: { debt: Debt; portfolioId: string }) {
  const { data: notes, isPending } = useDebtNotes(portfolioId, debt.id)
  const { save, remove } = useDebtNoteMutations(portfolioId, debt.id)
  return (
    <NotesTabView
      notes={notes}
      loading={isPending}
      saving={save.isPending}
      onSave={(input, done) => save.mutate(input, { onSuccess: done })}
      deletePending={remove.isPending}
      onDelete={(id, done) => remove.mutate(id, { onSuccess: done })}
    />
  )
}
