import { createFileRoute, notFound } from '@tanstack/react-router'
import { CHAT_PRESETS, SiloAiPreview } from '@/features/silo-ai'

/**
 * Dev-only gallery: every Silo AI state side by side, for checking against the design.
 * Each preview is live (its own chat), so states can also be poked at. 404 in production builds.
 */
export const Route = createFileRoute('/dev/silo-ai')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  // Referenced only in dev, so production builds drop the gallery (and its presets) entirely.
  component: import.meta.env.DEV ? SiloAiGallery : () => null,
})

function SiloAiGallery() {
  return (
    <div className="min-h-dvh bg-surface px-6 py-8 md:px-10">
      <header className="mb-8 flex flex-col gap-1">
        <span className="text-[0.6875rem] leading-4 font-medium tracking-[0.0625rem] text-muted-foreground uppercase">Dev</span>
        <h1 className="text-xl leading-7">Silo AI — every state</h1>
        <p>Frozen at each designed screen. Each preview has its own chat, so you can type, mention and send in any of them.</p>
      </header>
      <div className="flex flex-wrap gap-8">
        {CHAT_PRESETS.map((preset, i) => (
          <figure key={preset.id} className="flex flex-col gap-3">
            <figcaption className="text-xs leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">{String(i + 1).padStart(2, '0')}</span> · {preset.label}
            </figcaption>
            <SiloAiPreview preset={preset} />
          </figure>
        ))}
      </div>
    </div>
  )
}
