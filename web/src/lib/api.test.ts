import { describe, expect, it } from 'vitest'
import { resolveApiOrigin } from './api'

describe('resolveApiOrigin', () => {
  it('returns an empty string when unset, keeping the base URL relative', () => {
    expect(resolveApiOrigin(undefined)).toBe('')
    expect(resolveApiOrigin('')).toBe('')
    expect(resolveApiOrigin('   ')).toBe('')
  })

  it('assumes https for a bare hostname', () => {
    expect(resolveApiOrigin('silo-api.onrender.com')).toBe('https://silo-api.onrender.com')
  })

  it('preserves an explicit scheme', () => {
    expect(resolveApiOrigin('https://api.example.com')).toBe('https://api.example.com')
    expect(resolveApiOrigin('http://localhost:8080')).toBe('http://localhost:8080')
  })

  it('strips trailing slashes so the path is not doubled', () => {
    expect(resolveApiOrigin('https://api.example.com/')).toBe('https://api.example.com')
    expect(resolveApiOrigin('https://api.example.com///')).toBe('https://api.example.com')
  })

  it('trims surrounding whitespace', () => {
    expect(resolveApiOrigin('  https://api.example.com  ')).toBe('https://api.example.com')
  })
})
