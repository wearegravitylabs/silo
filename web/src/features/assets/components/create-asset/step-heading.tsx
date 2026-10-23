import type { ReactNode } from 'react'

/** Centred title + supporting line at the top of a Create Asset step. */
export function StepHeading({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h2 className="font-heading text-2xl leading-8 font-bold">{title}</h2>
      <p className="leading-5.5 text-muted-foreground">{children}</p>
    </div>
  )
}
