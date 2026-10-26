import { useState } from 'react'

/** Field-by-field equality over `a`'s fields; arrays (tags) compare element by element. */
export function sameValues<T extends object>(a: T, b: T) {
  return (Object.keys(a) as (keyof T)[]).every((key) => {
    const x = a[key]
    const y = b[key]
    return Array.isArray(x) && Array.isArray(y) ? x.length === y.length && x.every((v, i) => v === y[i]) : x === y
  })
}

/**
 * An editable copy of a form's values. `dirty` while it differs from `saved` — always for a new item (`saved` null,
 * starting from `initial`) — so Save Changes can wait for a change. `normalize` (trim, …) applies to both sides
 * before comparing; `same` replaces the field-by-field check.
 */
export function useFormDraft<T extends object>(
  saved: T | null,
  {
    initial,
    normalize = (values) => values,
    same = sameValues,
  }: { initial?: T; normalize?: (values: T) => T; same?: (a: T, b: T) => boolean } = {},
) {
  const [values, setValues] = useState<T>(() => (saved ?? initial) as T)
  const change = <K extends keyof T>(key: K, value: T[K]) => setValues((v) => ({ ...v, [key]: value }))
  const dirty = !saved || !same(normalize(values), normalize(saved))
  return { values, setValues, change, dirty }
}
