import { api } from '@/lib/api-client'
import { isDemoPortfolio } from '@/lib/demo'
import { mockDelay } from '@/lib/mock'
import { MOCK_VAULT_DOCUMENTS } from './mock-data'
import type { VaultDocument, VaultStatus } from './types'

// A real portfolio's documents are the API's (each member sees only their own). The vault password is still mocked:
// the API has no password endpoints, so any portfolio but the demo starts with none, and it locks again on reload.
// TODO: the API expects files encrypted in the browser (it stores ciphertext), with a key from the vault password; that
// isn't built yet, so files are uploaded as they are.
// Mock: the demo portfolio has a password set (any password unlocks it) and the design's four documents.
const DELAY = 600
const later = mockDelay(DELAY)

const documents = new Map<string, VaultDocument[]>()
const files = new Map<string, Blob>()
/** Portfolio → password; `null` = set, but unknown to the mock (demo). */
const passwords = new Map<string, string | null>([['demo', null]])
const unlocked = new Set<string>()

const docsOf = (portfolioId: string) => {
  if (!documents.has(portfolioId))
    documents.set(portfolioId, portfolioId === 'demo' ? MOCK_VAULT_DOCUMENTS.map((d) => ({ ...d, portfolio_id: portfolioId })) : [])
  return documents.get(portfolioId)!
}

export const getVaultStatus = (portfolioId: string): Promise<VaultStatus> =>
  later({ has_password: passwords.has(portfolioId), unlocked: unlocked.has(portfolioId) })

/** Sets the vault password and unlocks the vault. */
export const createVaultPassword = (portfolioId: string, password: string): Promise<VaultStatus> => {
  passwords.set(portfolioId, password)
  unlocked.add(portfolioId)
  return later({ has_password: true, unlocked: true })
}

/** Rejects with "Incorrect password" when it doesn't match. */
export const unlockVault = (portfolioId: string, password: string): Promise<VaultStatus> => {
  const stored = passwords.get(portfolioId)
  if (stored != null && stored !== password)
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Incorrect password')), DELAY))
  unlocked.add(portfolioId)
  return later({ has_password: true, unlocked: true })
}

const documentsPath = (portfolioId: string) => `/portfolios/${portfolioId}/vault/documents`

/** The document fields the UI uses, from the API's. */
const toDocument = ({ id, portfolio_id, file_name, file_size, uploaded_at }: VaultDocument): VaultDocument => ({
  id,
  portfolio_id,
  file_name,
  file_size,
  uploaded_at,
})

export const listVaultDocuments = async (portfolioId: string): Promise<VaultDocument[]> => {
  if (!isDemoPortfolio(portfolioId)) return ((await api<VaultDocument[] | null>(documentsPath(portfolioId))) ?? []).map(toDocument)
  return later([...docsOf(portfolioId)])
}

export const uploadVaultDocument = async (portfolioId: string, file: File): Promise<VaultDocument> => {
  if (!isDemoPortfolio(portfolioId)) {
    const form = new FormData()
    form.append('file', file)
    return toDocument(await api<VaultDocument>(documentsPath(portfolioId), { method: 'POST', body: form }))
  }
  const doc: VaultDocument = {
    id: crypto.randomUUID(),
    portfolio_id: portfolioId,
    file_name: file.name,
    file_size: file.size,
    uploaded_at: new Date().toISOString(),
  }
  docsOf(portfolioId).push(doc)
  files.set(doc.id, file)
  return later(doc)
}

/** A short-lived URL for the file: a signed link from the API, or a blob URL in the mock (revoke it after use). */
export const getVaultDocumentUrl = async (doc: VaultDocument) => {
  if (!isDemoPortfolio(doc.portfolio_id))
    return (await api<{ url: string }>(`${documentsPath(doc.portfolio_id)}/${doc.id}/download-url`)).url
  return URL.createObjectURL(files.get(doc.id) ?? new Blob([`${doc.file_name} (sample document)`], { type: 'text/plain' }))
}

export const deleteVaultDocument = async (portfolioId: string, docId: string) => {
  if (!isDemoPortfolio(portfolioId)) {
    await api(`${documentsPath(portfolioId)}/${docId}`, { method: 'DELETE' })
    return null
  }
  const docs = docsOf(portfolioId)
  const i = docs.findIndex((d) => d.id === docId)
  if (i !== -1) docs.splice(i, 1)
  files.delete(docId)
  return later(null)
}

// Changing the password proves it's you first: a link + code go to the account email, the code is checked, then
// the new password is set. TODO: no endpoints yet. Mock: any 6-digit code works except "000000".
const MOCK_INVALID_CODE = '000000'
const fail = (message: string) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), DELAY))

export const requestVaultPasswordChange = (_portfolioId: string) => later(null)

export const verifyVaultPasswordCode = (_portfolioId: string, code: string) =>
  code === MOCK_INVALID_CODE ? fail('Invalid code, please try again!') : later(null)

export const changeVaultPassword = (portfolioId: string, code: string, password: string): Promise<VaultStatus> => {
  if (code === MOCK_INVALID_CODE) return fail('Invalid code, please try again!')
  passwords.set(portfolioId, password)
  unlocked.delete(portfolioId) // re-enter the new password next time
  return later({ has_password: true, unlocked: false })
}
