import { MOCK_VAULT_DOCUMENTS } from './mock-data'
import type { VaultDocument, VaultStatus } from './types'

// TODO: the document endpoints exist — GET/POST /portfolios/:id/vault/documents, GET …/:docId/download-url, DELETE …/:docId.
// Files must be encrypted in the browser before upload (the server only stores ciphertext), with a key derived from the
// vault password; that isn't built yet. There are no vault-password endpoints yet either.
// Mock: the demo portfolio has a password set (any password unlocks it) and the design's four documents; other portfolios
// start with no password and no documents. Everything lives in memory, so the vault locks again on reload.
const DELAY = 600
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))

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

export const listVaultDocuments = (portfolioId: string): Promise<VaultDocument[]> => later([...docsOf(portfolioId)])

export const uploadVaultDocument = (portfolioId: string, file: File): Promise<VaultDocument> => {
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

/** A short-lived URL for the file (a blob URL in the mock; revoke it after use). */
export const getVaultDocumentUrl = (doc: VaultDocument) =>
  Promise.resolve(URL.createObjectURL(files.get(doc.id) ?? new Blob([`${doc.file_name} (sample document)`], { type: 'text/plain' })))

export const deleteVaultDocument = (portfolioId: string, docId: string) => {
  const docs = docsOf(portfolioId)
  const i = docs.findIndex((d) => d.id === docId)
  if (i !== -1) docs.splice(i, 1)
  files.delete(docId)
  return later(null)
}
