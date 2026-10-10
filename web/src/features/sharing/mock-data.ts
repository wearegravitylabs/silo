import type { AccessRole, ExportFeature, ExportTemplate, SectionKey } from './types'

/** Sections in display order — shared by the invite access picker and Manage Access, so they can't drift. */
export const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'insights', label: 'Insights' },
  { key: 'assets', label: 'Assets' },
  { key: 'debts', label: 'Debts' },
  { key: 'vault', label: 'Vault' },
  { key: 'projections', label: 'Projections' },
]

export const ALL_SECTIONS = SECTIONS.map((s) => s.key)

export const ROLE_LABEL: Record<AccessRole, string> = { viewer: 'Viewer', partner: 'Partner' }

// TODO: the portfolio's real share link from the API
export const MOCK_SHARE_LINK = 'https://app.silo.com/102345/retirement-portfolio'

/** First name for headings: the member's name, or one guessed from their email ("taiwo.odetola@…" → "Taiwo"). */
export function firstName(member: { name?: string; email: string }) {
  const raw = member.name?.split(' ')[0] ?? member.email.split('@')[0].split(/[._-]/)[0]
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export const EXPORT_FEATURES: { key: ExportFeature; label: string }[] = [
  { key: 'assets', label: 'Assets' },
  { key: 'debts', label: 'Debts' },
  { key: 'documents', label: 'Documents' },
  { key: 'charts', label: 'Charts' },
]

export const EXPORT_TEMPLATES: { key: ExportTemplate; label: string }[] = [
  { key: 'executive-summary', label: 'Executive Summary' },
  { key: 'detailed-report', label: 'Detailed Report' },
  { key: 'asset-list', label: 'Asset List Only' },
]
