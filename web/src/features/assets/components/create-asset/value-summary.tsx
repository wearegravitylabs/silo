import { SubmitError, SummaryList, type SummaryRow } from '@/components/summary-list'
import { Button } from '@/components/ui/button'

/** Right pane of a valued asset's details step (real estate, domain, physical): its Asset Summary and Create Asset. */
export function ValueSummary({
  rows,
  canSubmit,
  creating,
  error,
  onCreate,
}: {
  rows: SummaryRow[]
  canSubmit: boolean
  creating?: boolean
  error?: string
  onCreate: () => void
}) {
  return (
    <>
      <SummaryList title="Asset Summary" rows={rows} />
      <div className="flex flex-col gap-3">
        <Button onClick={onCreate} disabled={!canSubmit} loading={creating} loadingText="Creating…" className="w-full">
          Create Asset
        </Button>
        {error && <SubmitError message={error} />}
      </div>
    </>
  )
}
