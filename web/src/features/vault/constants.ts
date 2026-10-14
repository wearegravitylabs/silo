/** Minimum vault password length. */
export const MIN_PASSWORD_LENGTH = 8

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  txt: 'TXT',
  doc: 'DOCS',
  docx: 'DOCS',
  xls: 'XLS',
  xlsx: 'XLS',
  csv: 'CSV',
  png: 'PNG',
  jpg: 'JPG',
  jpeg: 'JPG',
}

const extension = (fileName: string) => (fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '')

/** "Estate planning.pdf" → "PDF" (the Document Type column and filter). */
export const documentType = (fileName: string) => {
  const ext = extension(fileName)
  return TYPE_LABELS[ext] ?? (ext.toUpperCase() || 'FILE')
}

/** "Estate planning.pdf" → "Estate planning" */
export const documentTitle = (fileName: string) => fileName.replace(/\.[^.]+$/, '')
