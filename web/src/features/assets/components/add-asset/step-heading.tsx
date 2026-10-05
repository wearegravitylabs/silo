import type { ReactNode } from 'react'

/** Left-aligned step title + description used at the top of each add-asset step. */
export function StepHeading({ title, description }: { title: ReactNode; description: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-2xl leading-8 font-bold">{title}</h2>
      <p className="text-sm leading-5.5 text-muted-foreground">{description}</p>
    </div>
  )
}
