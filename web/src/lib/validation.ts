const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Loose shape check (something@domain.tld); the API is the final validator. */
export const isEmail = (value: string) => EMAIL_RE.test(value)
