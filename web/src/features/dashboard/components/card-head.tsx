import type { ReactNode } from 'react'
import { ExpandIcon } from './icons'

/** 46px card title row: icon + title, expand affordance (or custom content) on the right. */
export function CardHead({ icon, title, right }: { icon: ReactNode; title: string; right?: ReactNode }) {
  return (
    <div className="flex h-11.5 items-center justify-between border-b px-4 py-3">
      <h2 className="flex items-center gap-2 leading-5.5 font-medium">
        {icon}
        {title}
      </h2>
      {right ?? <ExpandIcon />}
    </div>
  )
}
