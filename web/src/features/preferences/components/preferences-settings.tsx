import { useId } from 'react'
import { ColorSwatches } from '@/components/color-swatches'
import { CountryFlag } from '@/components/country-flag'
import { HexInput } from '@/components/hex-input'
import { SettingRow } from '@/components/setting-row'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resolveColor } from '@/lib/colors'
import { useAppearanceStore } from '@/stores/appearance-store'
import { ACCENTS, LANGUAGES } from '../constants'
import { ThemePicker } from './theme-picker'

/** Body of Settings → Preferences (inside <SettingsPage>). Every change applies — and is remembered — at once. */
export function PreferencesSettings() {
  const { theme, accent, customAccent, language, setTheme, setAccent, setCustomAccent, setLanguage } = useAppearanceStore()
  const accentId = useId()
  const languageId = useId()
  const preset = ACCENTS.find((a) => a.id === accent)
  const hex = preset ? resolveColor(preset.swatch).toUpperCase() : customAccent

  return (
    <div className="flex flex-col gap-6">
      <ThemePicker value={theme} onChange={setTheme} />

      <SettingRow id={accentId} title="Accent Colour" description="Choose your accent colour">
        <div className="flex flex-wrap items-center gap-2">
          <ColorSwatches
            label="Accent colour"
            colors={ACCENTS.map((a) => a.swatch)}
            value={preset?.swatch}
            onChange={(swatch) => setAccent(ACCENTS.find((a) => a.swatch === swatch)!.id)}
            className="gap-2"
            swatchClassName="size-7 aria-checked:ring-[1.5px] aria-checked:ring-current aria-checked:ring-offset-[1.5px]"
          />
          <HexInput value={hex} onChange={setCustomAccent} label="Custom accent hex" className="w-24" />
        </div>
      </SettingRow>

      <SettingRow id={languageId} title="Language" description="Choose your default language">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger aria-labelledby={languageId} className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                <span className="flex items-center gap-3">
                  <CountryFlag code={l.country} />
                  {l.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}
