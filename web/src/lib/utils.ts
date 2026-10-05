import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the custom theme scales in app/index.css. Without this it reads
// e.g. `text-13` as a colour and drops it when merged with `text-white`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['2xs', '11', '13', '15', '28', '32'],
      radius: ['10'],
      shadow: ['panel', 'button', 'elevated', 'dropdown', 'popover', 'sheet'],
      tracking: ['label', 'body', 'caps'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
