import type { ReactNode } from 'react'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ChangeEmailDialog, DeleteAccountDialog } from '@/features/account'
import { UpgradeModal } from '@/features/billing'
import { CommandPalette } from '@/features/command-palette'
import { WelcomeModal } from '@/features/dashboard'
import { AddRuleSheet, EditScenarioDialog, ProjectionsIntro, ruleOptions, SlotDialog, slotsOf } from '@/features/projections'
import { VaultSetupDialog } from '@/features/vault'
import { ShareModal, type Member, type ShareOwner } from '@/features/sharing'
import { PreviewMode } from '@/components/ui/preview-mode'
import { cn } from '@/lib/utils'

const OWNER: ShareOwner = { name: 'Daniel Osonuga', email: 'osonuga.daniel@gmail.com' }
const TAIWO: Member = {
  id: 'taiwo',
  email: 'taiwo.odetola@gmail.com',
  role: 'viewer',
  status: 'invited',
  sections: ['dashboard', 'insights', 'assets', 'debts', 'vault', 'projections'],
}
const TYPED = 'taiwo.odetola@gmail.com'
const SOME = ['dashboard', 'assets', 'debts', 'projections'] as const
const noop = () => {}
const MY_EMAIL = 'john.doe@yahoo.com'
const NEW_EMAIL = 'john.doe@gmail.com'

/** One rule blank's modal, frozen open: the template and slot key pick which. */
const blank = (template: Parameters<typeof slotsOf>[0], key: string, value = '') => (
  <SlotDialog
    slot={slotsOf(template).find((s) => s.key === key)!}
    value={value}
    open
    onOpenChange={noop}
    onSave={noop}
    currency="USD"
    options={ruleOptions()}
  />
)

/** Every modal state, in design order. Each renders the real component, frozen. */
const STATES: { group: string; id: string; label: string; render: () => ReactNode }[] = [
  { group: 'Share', id: 'share-empty', label: 'Invite — empty', render: () => <ShareModal open onOpenChange={noop} owner={OWNER} /> },
  {
    group: 'Share',
    id: 'share-typing',
    label: 'Invite — typing',
    render: () => <ShareModal open onOpenChange={noop} owner={OWNER} preview={{ inviteText: TYPED }} />,
  },
  {
    group: 'Share',
    id: 'share-role-menu',
    label: 'Role menu open',
    render: () => <ShareModal open onOpenChange={noop} owner={OWNER} preview={{ inviteText: TYPED, openMenu: 'role' }} />,
  },
  {
    group: 'Share',
    id: 'share-access-all',
    label: 'Access picker — all',
    render: () => <ShareModal open onOpenChange={noop} owner={OWNER} preview={{ inviteText: TYPED, openMenu: 'access' }} />,
  },
  {
    group: 'Share',
    id: 'share-access-some',
    label: 'Access picker — some',
    render: () => (
      <ShareModal open onOpenChange={noop} owner={OWNER} preview={{ inviteText: TYPED, openMenu: 'access', sections: [...SOME] }} />
    ),
  },
  {
    group: 'Share',
    id: 'share-access-chosen',
    label: 'Access chosen',
    render: () => <ShareModal open onOpenChange={noop} owner={OWNER} preview={{ inviteText: TYPED, sections: [...SOME] }} />,
  },
  {
    group: 'Share',
    id: 'share-invite-sent',
    label: 'Invite sent',
    render: () => <ShareModal open onOpenChange={noop} owner={OWNER} defaultMembers={[TAIWO]} />,
  },
  {
    group: 'Share',
    id: 'share-link-copied',
    label: 'Link copied',
    render: () => <ShareModal open onOpenChange={noop} owner={OWNER} defaultMembers={[TAIWO]} preview={{ copied: true }} />,
  },
  {
    group: 'Share',
    id: 'share-manage',
    label: 'Manage access',
    render: () => (
      <ShareModal open onOpenChange={noop} owner={OWNER} defaultMembers={[TAIWO]} defaultView={{ kind: 'manage', memberId: 'taiwo' }} />
    ),
  },
  {
    group: 'Share',
    id: 'share-revoke',
    label: 'Revoke access',
    render: () => (
      <ShareModal open onOpenChange={noop} owner={OWNER} defaultMembers={[TAIWO]} defaultView={{ kind: 'revoke', memberId: 'taiwo' }} />
    ),
  },
  {
    group: 'Share',
    id: 'share-export',
    label: 'Export',
    render: () => <ShareModal open onOpenChange={noop} owner={OWNER} defaultTab="export" />,
  },

  { group: 'Command palette', id: 'palette-default', label: 'Default', render: () => <CommandPalette open onOpenChange={noop} /> },
  {
    group: 'Command palette',
    id: 'palette-mention',
    label: '@ menu open',
    render: () => <CommandPalette open onOpenChange={noop} defaultText="@" />,
  },
  {
    group: 'Command palette',
    id: 'palette-chip',
    label: '@Assets picked',
    render: () => <CommandPalette open onOpenChange={noop} defaultText="@Assets " />,
  },
  {
    group: 'Command palette',
    id: 'palette-ai',
    label: 'AI suggestions',
    render: () => <CommandPalette open onOpenChange={noop} defaultText="@Assets Create a SP500 stock asset" />,
  },
  {
    group: 'Command palette',
    id: 'palette-search',
    label: 'Plain search',
    render: () => <CommandPalette open onOpenChange={noop} defaultText="add" />,
  },

  { group: 'Welcome', id: 'welcome-video', label: 'Welcome to Silo', render: () => <WelcomeModal open onOpenChange={noop} /> },
  {
    group: 'Welcome',
    id: 'welcome-command-bar',
    label: 'AI Command Bar',
    render: () => <WelcomeModal open onOpenChange={noop} defaultStep={1} />,
  },

  {
    group: 'Vault',
    id: 'vault-intro',
    label: 'Secure Vault',
    render: () => <VaultSetupDialog portfolioId="dev" open onOpenChange={noop} />,
  },
  {
    group: 'Vault',
    id: 'vault-password',
    label: 'Create Vault Password',
    render: () => <VaultSetupDialog portfolioId="dev" open onOpenChange={noop} defaultStep={1} />,
  },

  { group: 'Projections', id: 'projections-intro', label: 'Intro', render: () => <ProjectionsIntro open onOpenChange={noop} /> },
  {
    group: 'Projections',
    id: 'projections-add-rule',
    label: 'Add New Rule',
    render: () => <AddRuleSheet scenarioName="Scenario A" open onOpenChange={noop} onAdd={noop} currency="USD" options={ruleOptions()} />,
  },
  { group: 'Projections', id: 'blank-percent', label: 'Value — percent', render: () => blank('portfolio_growth', 'rate') },
  { group: 'Projections', id: 'blank-money', label: 'Value — money', render: () => blank('target_value', 'target', '95') },
  { group: 'Projections', id: 'blank-number', label: 'Value — number', render: () => blank('debt_free_goal', 'count') },
  { group: 'Projections', id: 'blank-time-frame', label: 'Time Frame', render: () => blank('asset_type_growth', 'frequency') },
  { group: 'Projections', id: 'blank-duration', label: 'Duration', render: () => blank('debt_free_goal', 'unit') },
  { group: 'Projections', id: 'blank-category', label: 'Category', render: () => blank('regular_expense', 'category') },
  { group: 'Projections', id: 'blank-year', label: 'Year', render: () => blank('target_value', 'year') },
  { group: 'Projections', id: 'blank-date', label: 'Date', render: () => blank('one_time_income', 'date') },
  { group: 'Projections', id: 'blank-asset-type', label: 'Asset type', render: () => blank('asset_type_growth', 'asset_type') },
  {
    group: 'Projections',
    id: 'projections-edit-scenario',
    label: 'Edit Scenario',
    render: () => (
      <EditScenarioDialog
        scenario={{ id: 'b', portfolio_id: 'demo', name: 'Scenario B', color: 'var(--color-highlight)' }}
        open
        onOpenChange={noop}
        onSave={noop}
      />
    ),
  },

  {
    group: 'Profile',
    id: 'email-empty',
    label: 'Change Email — empty',
    render: () => <ChangeEmailDialog open onOpenChange={noop} currentEmail={MY_EMAIL} />,
  },
  {
    group: 'Profile',
    id: 'email-typed',
    label: 'Change Email — typed',
    render: () => <ChangeEmailDialog open onOpenChange={noop} currentEmail={MY_EMAIL} defaultEmail={NEW_EMAIL} />,
  },
  {
    group: 'Profile',
    id: 'email-available',
    label: 'Change Email — no account',
    render: () => <ChangeEmailDialog open onOpenChange={noop} currentEmail={MY_EMAIL} defaultEmail={NEW_EMAIL} defaultView="available" />,
  },
  {
    group: 'Profile',
    id: 'email-exists',
    label: 'Existing Account Found',
    render: () => <ChangeEmailDialog open onOpenChange={noop} currentEmail={MY_EMAIL} defaultEmail={NEW_EMAIL} defaultView="exists" />,
  },
  {
    group: 'Profile',
    id: 'delete-empty',
    label: 'Delete Account — empty',
    render: () => <DeleteAccountDialog open onOpenChange={noop} email={MY_EMAIL} />,
  },
  {
    group: 'Profile',
    id: 'delete-code',
    label: 'Delete Account — code entered',
    render: () => <DeleteAccountDialog open onOpenChange={noop} email={MY_EMAIL} defaultCode="123456" />,
  },
  {
    group: 'Profile',
    id: 'delete-ready',
    label: 'Delete Account — ready',
    render: () => <DeleteAccountDialog open onOpenChange={noop} email={MY_EMAIL} defaultCode="123456" defaultAcknowledged />,
  },

  { group: 'Upgrade', id: 'upgrade-monthly', label: 'Monthly', render: () => <UpgradeModal open onOpenChange={noop} /> },
  {
    group: 'Upgrade',
    id: 'upgrade-yearly',
    label: 'Yearly',
    render: () => <UpgradeModal open onOpenChange={noop} defaultCycle="yearly" />,
  },
  {
    group: 'Upgrade',
    id: 'upgrade-usd',
    label: 'Yearly — USD',
    render: () => <UpgradeModal open onOpenChange={noop} defaultCycle="yearly" defaultCurrency="USD" />,
  },
]

/**
 * Dev-only gallery: pick a state on the left; the real modal renders on the right, frozen in it.
 * Each state has its own URL (?state=…). 404 in production builds.
 */
export const Route = createFileRoute('/dev/modals')({
  validateSearch: (search: Record<string, unknown>): { state?: string } =>
    typeof search.state === 'string' ? { state: search.state } : {},
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  // Referenced only in dev, so production builds drop the gallery entirely.
  component: import.meta.env.DEV ? ModalGallery : () => null,
})

function ModalGallery() {
  const { state = STATES[0].id } = Route.useSearch()
  const current = STATES.find((s) => s.id === state) ?? STATES[0]
  const groups = [...new Set(STATES.map((s) => s.group))]

  return (
    <div className="min-h-dvh bg-surface">
      {/* Above the modal overlay (z-50), so states stay clickable while a modal is open */}
      <nav className="fixed inset-y-0 left-0 z-60 flex w-60 flex-col gap-4 overflow-y-auto border-r border-border bg-background p-4">
        <div className="flex flex-col gap-1">
          <span className="text-eyebrow">Dev</span>
          <h1 className="text-base leading-6">Modals — every state</h1>
        </div>
        {groups.map((group) => (
          <div key={group} className="flex flex-col gap-0.5">
            <span className="px-2 pb-1 text-xs leading-5 text-muted-foreground">{group}</span>
            {STATES.filter((s) => s.group === group).map((s) => (
              <Link
                key={s.id}
                to="/dev/modals"
                search={{ state: s.id }}
                className={cn(
                  'rounded-lg px-2 py-1.5 text-foreground transition-colors hover:bg-accent',
                  s.id === current.id && 'bg-accent font-medium',
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <PreviewMode value>
        {/* key: a fresh mount per state, so each starts exactly as described */}
        <div key={current.id}>{current.render()}</div>
      </PreviewMode>
    </div>
  )
}
