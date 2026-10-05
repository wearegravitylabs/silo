import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'

// Pages that need the content vertically centered instead of top-200px
const CENTERED_PATHS = ['/verify-email']

const QUOTES = [
  {
    text: '"Do not save what is left after spending, but spend what is left after saving."',
    author: 'Warren Buffett',
  },
  {
    text: '"An investment in knowledge pays the best interest."',
    author: 'Benjamin Franklin',
  },
  {
    text: '"The stock market is a device for transferring money from the impatient to the patient."',
    author: 'Warren Buffett',
  },
  {
    text: '"It\'s not about how much money you make, but how much money you keep — and how hard it works for you."',
    author: 'Robert Kiyosaki',
  },
  {
    text: '"Financial freedom is available to those who learn about it and work for it."',
    author: 'Robert Kiyosaki',
  },
  {
    text: '"Wealth consists not in having great possessions, but in having few wants."',
    author: 'Epictetus',
  },
  {
    text: '"Money is a terrible master but an excellent servant."',
    author: 'P.T. Barnum',
  },
  {
    text: '"The rich invest their money and spend what\'s left. The poor spend their money and invest what\'s left."',
    author: 'Jim Rohn',
  },
  {
    text: '"Beware of little expenses; a small leak will sink a great ship."',
    author: 'Benjamin Franklin',
  },
  {
    text: '"Every time you borrow money, you\'re robbing your future self."',
    author: 'Nathan W. Morris',
  },
]

const INTERVAL_MS = 6500
const EXIT_MS = 420

export function AuthLayout() {
  const { pathname } = useLocation()
  const centered = CENTERED_PATHS.includes(pathname)

  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = useCallback((next?: number) => {
    setPhase('out')
    timeoutRef.current = setTimeout(() => {
      setIdx(i => (next !== undefined ? next : (i + 1) % QUOTES.length))
      setPhase('in')
    }, EXIT_MS)
  }, [])

  const goTo = useCallback(
    (i: number) => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      advance(i)
      intervalRef.current = setInterval(() => advance(), INTERVAL_MS)
    },
    [advance],
  )

  useEffect(() => {
    intervalRef.current = setInterval(() => advance(), INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [advance])

  return (
    <div className="min-h-dvh flex">
      {/* Left: form area — keyed by pathname so content re-animates on nav */}
      <div
        className={`flex-1 flex justify-center px-6 bg-background overflow-y-auto ${
          centered ? 'items-center py-12' : 'pt-[200px] pb-16'
        }`}
      >
        <div
          key={pathname}
          className="w-full max-w-[343px]"
          style={{ animation: 'fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <Outlet />
        </div>
      </div>

      {/* Right: persistent quote panel — never remounts */}
      <div
        className="hidden lg:flex w-[480px] shrink-0 relative items-center justify-center overflow-hidden"
        style={{ background: '#EFF0F5' }}
      >
        {/* Background — swap div for real image: url(/silo-bg.jpg) at -776px -42px */}
        <div className="absolute inset-0" style={{ background: '#071160' }} />

        {/* Beam columns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[18, 32, 46, 60, 74].map((left, i) => (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${left}%`,
                width: '1.5px',
                background:
                  'linear-gradient(to bottom, rgba(180,210,255,0.7) 0%, rgba(120,170,255,0.35) 45%, transparent 80%)',
                filter: 'blur(2px)',
              }}
            />
          ))}
          {[25, 53].map((left, i) => (
            <div
              key={i}
              className="absolute top-0 h-[75%]"
              style={{
                left: `${left}%`,
                width: '60px',
                transform: 'translateX(-50%)',
                background:
                  'linear-gradient(to bottom, rgba(100,150,255,0.18) 0%, transparent 100%)',
                filter: 'blur(18px)',
              }}
            />
          ))}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: '300px',
              height: '180px',
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(100,150,255,0.28) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Quote block */}
        <div className="relative z-10 flex flex-col" style={{ width: '368px' }}>
          <div style={{ minHeight: '180px' }}>
            <blockquote
              key={`q-${idx}`}
              className="font-bold text-white"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '32px',
                lineHeight: '36px',
                letterSpacing: '-0.2px',
                animation:
                  phase === 'in'
                    ? 'quoteIn 0.55s cubic-bezier(0.16,1,0.3,1) both'
                    : 'quoteOut 0.4s ease both',
              }}
            >
              {QUOTES[idx].text}
            </blockquote>
          </div>

          <p
            key={`a-${idx}`}
            className="font-medium mt-6"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              lineHeight: '22px',
              letterSpacing: '0.1px',
              color: '#B3DFFF',
              animation:
                phase === 'in'
                  ? 'authorIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both'
                  : 'quoteOut 0.35s ease both',
            }}
          >
            {QUOTES[idx].author}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-8">
            {QUOTES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Quote ${i + 1}`}
                onClick={() => goTo(i)}
                className="h-[3px] rounded-full transition-all duration-500 cursor-pointer"
                style={{
                  width: i === idx ? '24px' : '6px',
                  background:
                    i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                  animation: i === idx ? 'dotPulse 1.5s ease infinite' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
