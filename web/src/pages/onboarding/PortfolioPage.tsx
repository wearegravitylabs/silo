import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Logo } from '@/components/Logo'
import { ProgressDots } from '@/components/ProgressDots'
import { FieldError } from '@/components/FieldError'
import {
  AvatarPicker,
  AVATAR_VARIANTS,
} from '@/components/AvatarPicker'
import type { AvatarId } from '@/components/AvatarPicker'
import { portfolioApi, currencyApi } from '@/lib/api'
import type { Currency } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

// ─── Log out button (same gradient family as ProfilePage) ─────────────────────
const LOG_OUT_SHADOW =
  '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)'

// ─── Currency select dropdown ─────────────────────────────────────────────────
const CARET_SHADOW =
  '0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)'

interface CurrencySelectProps {
  value: string
  onChange: (code: string) => void
  currencies: Currency[]
  isLoading?: boolean
  hasError?: boolean
}

function CurrencySelect({
  value,
  onChange,
  currencies,
  isLoading,
  hasError,
}: CurrencySelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = currencies.find((c) => c.code === value) ?? null

  // Close on outside click
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

  // Focus search when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 40)
      return () => clearTimeout(t)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!search.trim()) return currencies
    const q = search.toLowerCase()
    return currencies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbol.includes(q),
    )
  }, [search, currencies])

  const displayCode = selected
    ? `${selected.code} ${selected.symbol}`
    : isLoading
      ? 'Loading…'
      : 'USD $'

  return (
    <div className="relative" ref={containerRef}>
      {/* Input trigger */}
      <button
        type="button"
        onClick={() => !isLoading && setOpen((o) => !o)}
        disabled={isLoading}
        className={cn(
          'flex items-center w-full h-10 rounded-xl bg-surface overflow-hidden transition-colors',
          hasError
            ? 'border-2 border-danger'
            : open
              ? 'border border-primary'
              : 'border border-border hover:border-primary/50',
          isLoading && 'opacity-60 cursor-not-allowed',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {/* Left: selected currency code + symbol */}
        <span
          className="text-sm text-muted font-medium shrink-0 px-3"
          style={{ width: '71px' }}
        >
          {displayCode}
        </span>

        {/* Divider */}
        <div className="w-px h-5 bg-border shrink-0" />

        {/* Main: currency name */}
        <span className="flex-1 px-4 text-sm text-left">
          {selected ? (
            <span className="text-foreground">{selected.name}</span>
          ) : (
            <span className="text-subtle">Select currency</span>
          )}
        </span>

        {/* Chevron */}
        <span className="px-3 shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6E738C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className="absolute z-50 top-[calc(100%+4px)] left-0 w-full rounded-xl bg-white border border-border overflow-hidden"
          style={{ boxShadow: CARET_SHADOW }}
        >
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency…"
              className="w-full h-8 px-3 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-subtle outline-none focus:border-primary transition-colors"
            />
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted text-center">No results</p>
            ) : (
              filtered.map((c) => {
                const isSelected = c.code === value
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(c.code)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2 text-sm text-left transition-colors',
                      isSelected
                        ? 'bg-surface font-medium text-foreground'
                        : 'hover:bg-surface text-foreground',
                    )}
                  >
                    <span className="w-12 shrink-0 font-medium text-muted">
                      {c.code}
                    </span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-muted shrink-0">{c.symbol}</span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export function PortfolioPage() {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>('lime')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const navigate = useNavigate()
  const { clearAuth, setCurrentPortfolioId } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate({ to: '/login' })
  }

  // Fetch currencies from the API
  const { data: currenciesData, isLoading: currenciesLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => currencyApi.list().then((r) => r.data.data),
    staleTime: Infinity,
  })
  const currencies: Currency[] = currenciesData ?? []

  // Once currencies load, default to "USD" if present; fall back to first
  useEffect(() => {
    if (!currencies.length) return
    const hasUSD = currencies.some((c) => c.code === 'USD')
    if (!hasUSD) setCurrency(currencies[0].code)
  }, [currencies])

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => {
      const variant = AVATAR_VARIANTS.find((v) => v.id === selectedAvatar)!
      return portfolioApi.create({
        name: name.trim(),
        base_currency: currency,
        description: description.trim() || undefined,
        image_url: `avatar:${variant.id}`,
      })
    },
    onSuccess: (res) => {
      const portfolioId = res.data?.data?.id
      if (portfolioId) setCurrentPortfolioId(portfolioId)
      navigate({ to: '/dashboard' })
    },
  })

  const apiError =
    (error as any)?.response?.data?.error?.message ??
    (error ? 'Something went wrong' : null)

  const nameError = submitAttempted && !name.trim() ? 'Enter a portfolio name' : ''
  const canSubmit = name.trim().length > 0 && currency.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    if (!canSubmit) return
    mutate()
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-background)' }}
    >
      {/* ── Top navigation (same as ProfilePage) ── */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{ height: '72px', padding: '0 40px' }}
      >
        <Logo />

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center transition-opacity hover:opacity-80 active:scale-[0.97]"
          style={{
            width: '72px',
            height: '32px',
            padding: '8px 12px',
            borderRadius: '10px',
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)',
            boxShadow: LOG_OUT_SHADOW,
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#2C2E35',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Log out
        </button>
      </header>

      {/* ── Centered form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div
          style={{
            width: '343px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {/* Heading */}
          <div className="text-center">
            <h1
              className="font-bold text-foreground"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.1px',
              }}
            >
              Create a new portfolio
            </h1>
            <p
              className="mt-3"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                lineHeight: '22px',
                letterSpacing: '-0.1px',
                color: 'var(--color-muted)',
              }}
            >
              Your portfolio is where you track specific assets, debts and insights
            </p>
          </div>

          {/* Avatar picker card */}
          <AvatarPicker selected={selectedAvatar} onChange={setSelectedAvatar} />

          {/* Form fields */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col"
            style={{ gap: '16px' }}
          >
            {/* Portfolio Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="portfolio-name"
                className="text-sm font-medium text-foreground"
                style={{ letterSpacing: '0.1px' }}
              >
                Portfolio Name
              </label>
              <input
                id="portfolio-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My wealth portfolio"
                required
                className={cn(
                  'w-full h-10 px-4 rounded-xl bg-surface text-foreground placeholder:text-subtle text-sm outline-none transition-colors',
                  nameError
                    ? 'border-2 border-danger'
                    : 'border border-border focus:border-primary',
                )}
              />
              {nameError && <FieldError message={nameError} />}
            </div>

            {/* Base Currency */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-foreground"
                style={{ letterSpacing: '0.1px' }}
              >
                Base Currency
              </label>
              <CurrencySelect
                value={currency}
                onChange={setCurrency}
                currencies={currencies}
                isLoading={currenciesLoading}
              />
              {/* Support hint */}
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="10" fill="#B3B8CB" />
                  <path
                    d="M12 16v-4M12 8h.01"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    lineHeight: '20px',
                    color: 'var(--color-muted)',
                  }}
                >
                  All portfolio values will be converted to this currency
                </span>
              </div>
            </div>

            {/* Description (optional) */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="portfolio-desc"
                className="text-sm font-medium text-foreground"
                style={{ letterSpacing: '0.1px' }}
              >
                Description
              </label>
              <input
                id="portfolio-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Long-term investments"
                className="w-full h-10 px-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-subtle text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {apiError && <FieldError message={apiError} />}

            {/* Continue CTA */}
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className={cn(
                'w-full h-10 rounded-xl text-white font-semibold text-sm tracking-[0.1px]',
                'bg-gradient-to-b from-primary to-primary-dark',
                'transition-[opacity,transform] duration-150',
                isPending || !canSubmit
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90 active:scale-[0.98] active:opacity-80',
              )}
            >
              {isPending ? 'Creating…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Bottom: onboarding step 2 ── */}
      <div className="flex justify-center pb-8 shrink-0">
        <ProgressDots steps={3} current={2} />
      </div>
    </div>
  )
}
