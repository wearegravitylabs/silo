import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ExportDialog } from '@/components/export-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ASSET_TYPE_LABELS, ASSET_TYPES, AssetIconDisc, useAssets } from '@/features/assets'
import { DEBT_TYPE_LABELS, DebtIconDisc, useDebts } from '@/features/debts'
import { portfoliosQuery, usePortfolio } from '@/features/portfolios'
import {
  AddRuleSheet,
  DEFAULT_HORIZON,
  monthsUntil,
  newRule,
  project,
  ProjectionChart,
  projectionMoney,
  ProjectionsHeader,
  ProjectionsIntro,
  projectionsQuery,
  ruleOptions,
  RulesTable,
  ScenarioTabs,
  TimestampGrid,
  TIMESTAMPS,
  useProjectionMutations,
  useProjections,
  type ProjectionMetric,
} from '@/features/projections'

interface ProjectionsSearch {
  /** Time Stamp cards instead of the chart */
  view?: 'timestamp'
  /** Selected scenario tab; defaults to the first */
  scenario?: string
  /** Horizon year ("To Oct 2036") */
  to?: number
}

const THIS_YEAR = new Date().getFullYear()
const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpeg', label: 'JPEG' },
]
const LONGEST_TIMESTAMP = TIMESTAMPS.at(-1)!.months

export const Route = createFileRoute('/portfolio/$portfolioId/projections')({
  validateSearch: (search: Record<string, unknown>): ProjectionsSearch => ({
    ...(search.view === 'timestamp' && { view: 'timestamp' }),
    ...(typeof search.scenario === 'string' && { scenario: search.scenario }),
    ...(Number(search.to) > THIS_YEAR && { to: Number(search.to) }),
  }),
  loader: async ({ context: { queryClient }, params: { portfolioId } }) => {
    // Portfolios are already cached by the parent route; the mock needs the base currency.
    const portfolios = await queryClient.query({ ...portfoliosQuery, staleTime: 'static' })
    const currency = portfolios.find((p) => p.id === portfolioId)?.base_currency ?? 'USD'
    await queryClient.query({ ...projectionsQuery(portfolioId, currency), staleTime: 'static' })
  },
  pendingComponent: ProjectionsSkeleton,
  component: ProjectionsPage,
})

/**
 * Projections: the selected scenario's value at the horizon, every scenario as a curve (or six Time Stamp cards),
 * the scenario tabs, and the selected scenario's rules. The intro opens on the first visit.
 */
function ProjectionsPage() {
  const { portfolioId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { base_currency: currency } = usePortfolio(portfolioId)
  const state = useProjections(portfolioId, currency)
  const { toggle, addRule, updateRule, removeRule, updateScenario, removeScenario, seenIntro } = useProjectionMutations(portfolioId)
  // Blanks that name an asset or a debt pick from the portfolio's own.
  const { data: assets = [] } = useAssets(portfolioId, null)
  const { data: debts = [] } = useDebts(portfolioId, null)
  const options = useMemo(
    () =>
      ruleOptions({
        assetTypeIcons: Object.fromEntries(ASSET_TYPES.map((t) => [t.id, t.icon])),
        assets: assets.map((a) => ({
          value: a.id,
          label: a.name,
          description: ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type,
          icon: <AssetIconDisc asset={a} />,
        })),
        debts: debts.map((d) => ({
          value: d.id,
          label: d.name,
          description: DEBT_TYPE_LABELS[d.debt_type],
          icon: <DebtIconDisc debt={d} />,
        })),
        allDebtsIcon: <DebtIconDisc debt={{ debt_type: 'manual', icon: null }} />,
      }),
    [assets, debts],
  )
  const [metric, setMetric] = useState<ProjectionMetric>('net_worth')
  const [shown, setShown] = useState<string[] | null>(null) // null: every scenario
  const [exporting, setExporting] = useState(false)
  const [adding, setAdding] = useState(false)

  const setSearch = (patch: Partial<ProjectionsSearch>) => navigate({ search: (s) => ({ ...s, ...patch }), replace: true })
  const horizon = search.to ?? THIS_YEAR + DEFAULT_HORIZON
  const months = monthsUntil(horizon)
  const active = state.scenarios.find((s) => s.id === search.scenario) ?? state.scenarios[0]

  // Each scenario projected far enough for both the chart (to the horizon) and the 20-year Time Stamp.
  const projections = useMemo(
    () =>
      Object.fromEntries(
        state.scenarios.map((s) => [
          s.id,
          project(
            state.baseline,
            state.rules.filter((r) => r.scenario_id === s.id),
            Math.max(months, LONGEST_TIMESTAMP),
            metric,
          ),
        ]),
      ),
    [state, months, metric],
  )
  const at = (id: string) => projections[id][months].value
  const visible = state.scenarios.filter((s) => (shown ?? state.scenarios.map((x) => x.id)).includes(s.id))

  return (
    // The page scrolls as a whole; the inner column grows with its content so the rules table never squeezes.
    <div className="@container min-h-0 flex-1 overflow-y-auto">
      <div className="flex min-h-full flex-col">
        <ProjectionsHeader
          value={at(active.id)}
          start={projections[active.id][0].value}
          currency={currency}
          horizon={horizon}
          onHorizonChange={(to) => setSearch({ to })}
          view={search.view ?? 'chart'}
          onViewChange={(view) => setSearch({ view: view === 'timestamp' ? 'timestamp' : undefined })}
        />

        <div className="px-4 pt-4.5 md:px-10">
          {search.view === 'timestamp' ? (
            <TimestampGrid points={projections[active.id]} currency={currency} />
          ) : (
            <ProjectionChart
              series={(visible.length ? visible : [active]).map((s) => ({ scenario: s, points: projections[s.id].slice(0, months + 1) }))}
              scenarios={state.scenarios}
              visible={visible.map((s) => s.id)}
              onVisibleChange={setShown}
              metric={metric}
              onMetricChange={setMetric}
              currency={currency}
            />
          )}
        </div>

        <ScenarioTabs
          scenarios={state.scenarios}
          values={Object.fromEntries(state.scenarios.map((s) => [s.id, projectionMoney(at(s.id), currency, 0)]))}
          activeId={active.id}
          onSelect={(scenario) => setSearch({ scenario })}
          onEdit={(id, patch) => updateScenario.mutate({ id, ...patch })}
          onDelete={(id, done) => removeScenario.mutate(id, { onSuccess: done })}
          deleting={removeScenario.isPending}
        />

        <RulesTable
          key={active.id}
          rules={state.rules.filter((r) => r.scenario_id === active.id)}
          currency={currency}
          options={options}
          onToggle={(ids, enabled) => toggle.mutate({ ids, enabled })}
          onChange={(id, values) => updateRule.mutate({ id, values })}
          onDelete={(id) => removeRule.mutate(id)}
          onAdd={() => setAdding(true)}
          onExport={() => setExporting(true)}
        />
        <AddRuleSheet
          scenarioName={active.name}
          open={adding}
          onOpenChange={setAdding}
          onAdd={(template, values) => addRule.mutate(newRule(active.id, template, values))}
          currency={currency}
          options={options}
        />

        <ProjectionsIntro open={!state.intro_seen} onOpenChange={(open) => !open && seenIntro.mutate()} />
        {/* TODO: generate the file once there's an export endpoint; UI only for now. */}
        <ExportDialog title="Export Projection" formats={EXPORT_FORMATS} open={exporting} onOpenChange={setExporting} />
      </div>
    </div>
  )
}

/** Header, chart card, tabs and toolbar outline while the projections load. */
function ProjectionsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label="Loading projections">
      <div className="flex items-center justify-between gap-3 px-4 pt-5 md:px-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-8 w-60 rounded-lg" />
        </div>
      </div>
      <div className="px-4 pt-4.5 md:px-10">
        <Skeleton className="h-77.5 rounded-2xl" />
      </div>
      <div className="flex gap-6 border-b border-border px-4 pt-3 pb-3 md:px-10">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="mx-4 flex flex-1 flex-col gap-6 py-6 md:mx-10">
        <Skeleton className="h-8 w-full rounded-lg md:w-100" />
        <Skeleton className="flex-1 rounded-2xl" />
      </div>
    </div>
  )
}
