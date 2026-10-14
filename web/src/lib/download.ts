/** Saves a URL as `fileName`; blob URLs are revoked afterwards. */
export function downloadUrl(url: string, fileName: string) {
  Object.assign(document.createElement('a'), { href: url, download: fileName }).click()
  if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 1000)
}
