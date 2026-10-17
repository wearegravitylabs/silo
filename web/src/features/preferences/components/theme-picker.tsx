import { useId } from 'react'
import { SettingHeading } from '@/components/setting-row'
import { cn } from '@/lib/utils'
import type { ThemePreference } from '@/stores/appearance-store'
import { THEMES } from '../constants'
import { ThemePreview } from './theme-preview'

/** Interface Theme: System / Light / Dark preview cards. System shows light and dark split down the middle. */
export function ThemePicker({ value, onChange }: { value: ThemePreference; onChange: (theme: ThemePreference) => void }) {
  const headingId = useId()
  return (
    <section className="flex flex-col gap-3">
      <SettingHeading id={headingId} title="Interface Theme" description="Select or customise your theme" />
      <div role="radiogroup" aria-labelledby={headingId} className="grid grid-cols-3 gap-3 sm:gap-4">
        {THEMES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className="group flex min-w-0 flex-col gap-2 text-left outline-none"
          >
            <span
              className={cn(
                'relative aspect-171/120 w-full overflow-hidden rounded-xl transition-shadow',
                'ring-1 ring-line/70 group-hover:ring-subtle group-focus-visible:ring-2 group-focus-visible:ring-ring/40',
                'group-aria-checked:ring-[1.5px] group-aria-checked:ring-primary',
              )}
            >
              <ThemePreview theme={id === 'dark' ? 'dark' : 'light'} />
              {id === 'system' && <ThemePreview theme="dark" className="absolute inset-0 [clip-path:inset(0_0_0_50%)]" />}
            </span>
            <span className="truncate font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
