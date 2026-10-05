import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Native date field in Silo styling, with a calendar glyph. Empty values render in the placeholder colour. */
export function DateInput({ className, value, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <div className="relative">
      <Input type="date" value={value} className={cn('pr-10 scheme-light', !value && 'text-subtle', className)} {...props} />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5 1.5a.75.75 0 0 1 .75.75V3h4.5V2.25a.75.75 0 0 1 1.5 0V3H13A1.5 1.5 0 0 1 14.5 4.5v9A1.5 1.5 0 0 1 13 15H3A1.5 1.5 0 0 1 1.5 13.5v-9A1.5 1.5 0 0 1 3 3h1.25V2.25A.75.75 0 0 1 5 1.5ZM3 6v7.5h10V6H3Z"
        />
      </svg>
    </div>
  )
}
