/** A complete "#RRGGBB". */
export const HEX_RE = /^#[\da-f]{6}$/i

let ctx: CanvasRenderingContext2D | null = null

/**
 * Any CSS colour — a token (`var(--color-primary)`), oklch/color-mix, a name — as "#RRGGBB", computed in the page
 * so it follows the current theme and accent. Hex passes straight through.
 */
export function resolveColor(color: string): string {
  if (HEX_RE.test(color)) return color
  // The browser resolves var()/relative colours on an element; a canvas then turns any colour space into sRGB bytes.
  const probe = document.createElement('span')
  probe.style.color = color
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()

  ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return color
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = computed
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
