import type { AccentId, ThemePreference } from '@/stores/appearance-store'

export const THEMES: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

/** Accent swatches in design order; `swatch` is the colour shown (each accent's `--brand` lives in colors.css). */
export const ACCENTS: { id: Exclude<AccentId, 'custom'>; swatch: string }[] = [
  { id: 'blue', swatch: 'var(--color-swatch-blue)' },
  { id: 'lime', swatch: 'var(--color-highlight)' },
  { id: 'red', swatch: 'var(--color-destructive)' },
  { id: 'orange', swatch: 'var(--color-warning)' },
  { id: 'magenta', swatch: 'var(--color-scenario-magenta)' },
  { id: 'purple', swatch: 'var(--color-scenario-purple)' },
]

/** TODO: the choice is saved, but the app has no translations yet — everything stays in English. */
export const LANGUAGES: { code: string; label: string; country: string }[] = [
  { code: 'en-US', label: 'English (US)', country: 'US' },
  { code: 'en-GB', label: 'English (UK)', country: 'GB' },
  { code: 'fr-FR', label: 'Français', country: 'FR' },
  { code: 'es-ES', label: 'Español', country: 'ES' },
  { code: 'de-DE', label: 'Deutsch', country: 'DE' },
  { code: 'pt-BR', label: 'Português (BR)', country: 'BR' },
]
