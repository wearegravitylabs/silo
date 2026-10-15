import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'system' | 'light' | 'dark'

/** Preset accents. Each (except the default, blue) is a `data-accent` value in styles/colors.css. */
export const ACCENT_IDS = ['blue', 'lime', 'red', 'orange', 'magenta', 'purple'] as const
export type AccentId = (typeof ACCENT_IDS)[number] | 'custom'

interface AppearanceState {
  theme: ThemePreference
  accent: AccentId
  /** "#RRGGBB" used when accent is 'custom' */
  customAccent: string
  /** BCP 47 tag, e.g. "en-US" */
  language: string
  setTheme: (theme: ThemePreference) => void
  setAccent: (accent: Exclude<AccentId, 'custom'>) => void
  setCustomAccent: (hex: string) => void
  setLanguage: (language: string) => void
}

/** Storage key; index.html reads it before first paint, so keep the two in step. */
export const APPEARANCE_STORAGE_KEY = 'silo-appearance'

/**
 * Look and feel from Settings → Preferences, remembered on this device. <AppearanceSync> applies it to <html>.
 * TODO: also save to the user's profile once the API has preferences.
 */
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      theme: 'system',
      accent: 'blue',
      customAccent: '#BBE03B',
      language: 'en-US',
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setCustomAccent: (customAccent) => set({ accent: 'custom', customAccent }),
      setLanguage: (language) => set({ language }),
    }),
    { name: APPEARANCE_STORAGE_KEY },
  ),
)
