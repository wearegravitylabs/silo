import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the custom theme scales in styles/. Without this it reads
// e.g. `text-h6` as a colour and drops it when merged with `text-white`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['h5', 'h6'],
      shadow: ['panel', 'button', 'elevated', 'dropdown', 'popover', 'sheet'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
