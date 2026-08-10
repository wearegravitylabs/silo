import { useState, useEffect, useRef, useMemo } from 'react'
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
} from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import { cn } from '@/lib/utils'

// ─── Country data (built from libphonenumber-js metadata) ────────────────────

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

function toFlagEmoji(iso2: string) {
  return iso2
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

export interface Country {
  code: CountryCode
  dialCode: string // e.g. "+1"
  name: string     // English display name
  flag: string     // emoji flag
}

export const ALL_COUNTRIES: Country[] = getCountries()
  .map((code) => ({
    code,
    dialCode: `+${getCountryCallingCode(code)}`,
    name: regionNames.of(code) ?? code,
    flag: toFlagEmoji(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

/** Validate a national-format phone number given the ISO country code */
export function validatePhoneNumber(
  nationalNumber: string,
  countryCode: CountryCode,
): boolean {
  if (!nationalNumber?.trim()) return false
  try {
    return isValidPhoneNumber(nationalNumber, countryCode)
  } catch {
    return false
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CountryPhoneInputProps {
  /** The national phone number (without dial code) */
  value: string
  onChange: (value: string) => void
  country: Country
  onCountryChange: (country: Country) => void
  hasError?: boolean
  placeholder?: string
}

export function CountryPhoneInput({
  value,
  onChange,
  country,
  onCountryChange,
  hasError,
  placeholder = '801 234 5678',
}: CountryPhoneInputProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus search when dropdown opens; scroll selected item into view
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      searchRef.current?.focus()
      const active = listRef.current?.querySelector('[data-selected="true"]')
      active?.scrollIntoView({ block: 'nearest' })
    }, 40)
    return () => clearTimeout(t)
  }, [open])

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES
    const q = search.toLowerCase()
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().startsWith(q),
    )
  }, [search])

  const handleSelect = (c: Country) => {
    onCountryChange(c)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* ── Input row ── */}
      <div
        className={cn(
          'flex items-center h-10 rounded-xl bg-surface overflow-hidden transition-colors',
          hasError
            ? 'border-2 border-danger'
            : 'border border-border focus-within:border-primary',
        )}
      >
        {/* Country / dial-code trigger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-[4px] h-full px-3 hover:bg-black/[0.03] transition-colors shrink-0"
          style={{ width: '95px' }}
          aria-label="Select country code"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="text-sm leading-none select-none">{country.flag}</span>
          <span className="text-sm font-medium text-foreground">{country.dialCode}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6E738C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-border shrink-0" />

        {/* National number input */}
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d\s\-()]/g, ''))}
          placeholder={placeholder}
          className="flex-1 h-full px-3 bg-transparent text-sm text-foreground placeholder:text-subtle outline-none"
        />
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div
          role="listbox"
          className="absolute z-50 top-[calc(100%+4px)] left-0 w-[280px] rounded-xl bg-white border border-border overflow-hidden"
          style={{
            boxShadow:
              '0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)',
          }}
        >
          {/* Search bar */}
          <div className="p-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country…"
              className="w-full h-8 px-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-subtle outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Country list */}
          <div ref={listRef} className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted text-center">
                No results
              </p>
            ) : (
              filtered.map((c) => {
                const isSelected = c.code === country.code
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => handleSelect(c)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
                      isSelected
                        ? 'bg-surface font-medium text-foreground'
                        : 'hover:bg-surface text-foreground',
                    )}
                  >
                    <span className="text-sm leading-none select-none" style={{ minWidth: '18px' }}>
                      {c.flag}
                    </span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-muted shrink-0">{c.dialCode}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
