import { useEffect, useEffectEvent, type RefObject } from 'react'

/** Calls `onOutside` on a mousedown outside every ref'd element, while `enabled`. */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  onOutside: () => void,
  enabled = true,
) {
  const handle = useEffectEvent((e: MouseEvent) => {
    const target = e.target as Node
    if (refs.every((r) => !r.current?.contains(target))) onOutside()
  })

  useEffect(() => {
    if (!enabled) return
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [enabled])
}
