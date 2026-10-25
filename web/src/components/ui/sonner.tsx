import { toast, Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, Loader2Icon, XIcon } from 'lucide-react'

/**
 * App toasts, top right. Solid status colour with white text (success green, error red), dark for `toastDone`;
 * others are white cards. Every toast has a ✕. Call with `toast.success('…')` from 'sonner'.
 */
const Toaster = (props: ToasterProps) => (
  <Sonner
    position="top-right"
    offset="2.25rem"
    mobileOffset="1rem"
    closeButton
    icons={{
      success: <CircleCheckIcon className="size-4 fill-white text-success" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <TriangleAlertIcon className="size-4 fill-white text-destructive" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
      close: <XIcon className="size-4" />,
    }}
    toastOptions={{
      unstyled: true,
      classNames: {
        toast:
          'flex w-full items-center gap-3 rounded-lg border border-border bg-popover px-4 py-3 font-medium text-popover-foreground shadow-elevated sm:w-99',
        // `!` so these beat the base card's bg/text whatever their order in the CSS
        success: 'border-transparent! bg-success! text-white!',
        error: 'border-transparent! bg-destructive! text-white!',
        // Only toastDone uses the info type
        info: 'border-transparent! bg-foreground! text-background!',
        icon: 'flex shrink-0',
        content: 'min-w-0 flex-1',
        description: 'text-xs font-normal opacity-80',
        closeButton:
          'order-last flex shrink-0 rounded-sm opacity-80 transition-opacity outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/60',
      },
    }}
    {...props}
  />
)

/** Dark toast with a tick, for a finished step that took something away ("You have left the portfolio successfully!"). */
const toastDone = (message: string) => toast.info(message, { icon: <CircleCheckIcon className="size-4 fill-background text-foreground" /> })

export { Toaster, toastDone }
