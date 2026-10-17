import type { VaultDocument } from './types'

const MB = 1024 * 1024

export const MOCK_VAULT_DOCUMENTS: Omit<VaultDocument, 'portfolio_id'>[] = [
  { id: 'v1', file_name: 'Estate planning.pdf', file_size: 3 * MB, uploaded_at: '2026-09-02T10:00:00Z' },
  { id: 'v2', file_name: 'Coinbase recovery phrase.txt', file_size: 100 * 1024, uploaded_at: '2026-09-05T10:00:00Z' },
  { id: 'v3', file_name: 'Silo Stocks Distribution.docx', file_size: 3 * MB, uploaded_at: '2026-09-12T10:00:00Z' },
  { id: 'v4', file_name: 'Silo Stocks Distribution v2.png', file_size: 3 * MB, uploaded_at: '2026-09-20T10:00:00Z' },
]
