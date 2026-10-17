import { useEffect, useSyncExternalStore } from 'react'
import { useAppearanceStore } from '@/stores/appearance-store'

const DARK_QUERY = '(prefers-color-scheme: dark)'

const subscribeToScheme = (onChange: () => void) => {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const systemIsDark = () => window.matchMedia(DARK_QUERY).matches

/**
 * Applies the appearance preferences to <html> — data-theme (System follows the OS live), data-accent, a custom
 * accent's --brand, and lang. Everything else is CSS (styles/colors.css). Renders nothing.
 */
export function AppearanceSync() {
  const { theme, accent, customAccent, language } = useAppearanceStore()
  const osDark = useSyncExternalStore(subscribeToScheme, systemIsDark)
  const resolved = theme === 'system' ? (osDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const html = document.documentElement
    html.dataset.theme = resolved
    if (accent === 'blue') delete html.dataset.accent
    else html.dataset.accent = accent
    if (accent === 'custom') html.style.setProperty('--brand', customAccent)
    else html.style.removeProperty('--brand')
    html.lang = language
  }, [resolved, accent, customAccent, language])

  return null
}
