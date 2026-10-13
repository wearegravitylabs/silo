import { useState, type ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { AiSparkleIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { DashboardInsight } from '../../types'

/** Silo AI insights beside the net worth card: gradient frame, pager, fading text, "Talk to Silo AI". */
export function AiInsightsCard({
  insights,
  onTalkToAi,
  className,
}: {
  insights: DashboardInsight[]
  onTalkToAi: () => void
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const insight = insights[Math.min(index, insights.length - 1)]
  const go = (step: number) => setIndex((i) => (i + step + insights.length) % insights.length)

  return (
    // 1px gradient border: the gradient fills the outer box, the tinted body sits 1px inside it.
    <section aria-label="AI Insights" className={cn('rounded-2xl bg-gradient-ai p-px shadow-panel', className)}>
      <div className="flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)] bg-surface">
        <header className="flex h-11.5 shrink-0 items-center justify-between px-4">
          <h2 className="flex items-center gap-2 font-sans leading-5.5 font-medium">
            <AiSparkleIcon />
            AI Insights
          </h2>
          {/* Always shown; with fewer than two insights the arrows are inert ("0 / 0" when empty) */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PagerButton label="Previous insight" onClick={() => go(-1)} disabled={insights.length < 2}>
              <ChevronLeftIcon className="size-3" />
            </PagerButton>
            <span
              className={cn(
                'flex h-5 min-w-10 items-center justify-center rounded-md bg-background px-1.5 tabular-nums',
                insights.length > 1 && 'border border-border shadow-small',
              )}
              aria-live="polite"
            >
              {insights.length ? index + 1 : 0} / {insights.length}
            </span>
            <PagerButton label="Next insight" onClick={() => go(1)} disabled={insights.length < 2}>
              <ChevronRightIcon className="size-3" />
            </PagerButton>
          </div>
        </header>

        {insight ? (
          <article
            key={insight.id}
            className="flex min-h-0 flex-1 animate-rise flex-col overflow-hidden rounded-xl border border-border bg-background px-4 pt-4"
          >
            <h3 className="border-b border-border pb-3 font-sans leading-5.5 font-medium">{insight.title}</h3>
            {/* Longer text fades and blurs out at the bottom; the card border stays crisp */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div className="flex flex-col divide-y divide-border mask-[linear-gradient(to_bottom,black_60%,transparent)] leading-5.5">
                {insight.sections.map((s) => (
                  <p key={s.lead} className="py-3">
                    <span className="text-foreground">{s.lead}:</span> <Highlighted text={s.text} />
                  </p>
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 mask-[linear-gradient(to_bottom,transparent,black)] backdrop-blur-[2px]"
              />
            </div>
          </article>
        ) : (
          <p className="flex flex-1 items-center justify-center px-6 text-center text-xs leading-5">
            Silo AI will give insights to your portfolio
          </p>
        )}

        <div className="shrink-0 p-4 pt-3">
          <button
            type="button"
            onClick={onTalkToAi}
            className="flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium shadow-small transition-colors hover:bg-surface"
          >
            <AiSparkleIcon className="size-3.5" />
            <span className="text-gradient-ai">Talk to Silo AI</span>
            <ChevronRightIcon className="ml-auto size-3.5 text-muted-foreground" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}

function PagerButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-5 items-center justify-center rounded-md border border-border bg-background shadow-small transition-colors hover:text-foreground disabled:border-transparent disabled:bg-line disabled:shadow-none disabled:hover:text-inherit"
    >
      {children}
    </button>
  )
}

/** Renders **dark** and ++green++ highlights inside insight text. */
function Highlighted({ text }: { text: string }) {
  return text.split(/(\*\*.+?\*\*|\+\+.+?\+\+)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return (
        <span key={i} className="text-foreground">
          {part.slice(2, -2)}
        </span>
      )
    if (part.startsWith('++') && part.endsWith('++'))
      return (
        <span key={i} className="text-success">
          {part.slice(2, -2)}
        </span>
      )
    return part
  })
}
