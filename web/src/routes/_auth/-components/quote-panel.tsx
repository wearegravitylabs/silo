import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

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

/** Rotating money-quote panel beside the auth forms. Mounted once for the whole auth flow. */
export function QuotePanel() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const interval = useRef<ReturnType<typeof setInterval>>(undefined)

  const advance = useCallback((next?: number) => {
    setPhase('out')
    timeout.current = setTimeout(() => {
      setIdx((i) => next ?? (i + 1) % QUOTES.length)
      setPhase('in')
    }, EXIT_MS)
  }, [])

  const goTo = (i: number) => {
    clearInterval(interval.current)
    clearTimeout(timeout.current)
    advance(i)
    interval.current = setInterval(() => advance(), INTERVAL_MS)
  }

  useEffect(() => {
    interval.current = setInterval(() => advance(), INTERVAL_MS)
    return () => {
      clearInterval(interval.current)
      clearTimeout(timeout.current)
    }
  }, [advance])

  return (
    <aside className="relative hidden w-120 shrink-0 items-center justify-center overflow-hidden bg-night bg-[url(/auth/backdrop.png)] bg-cover bg-center lg:flex">
      <figure className="flex w-92 flex-col">
        <div className="min-h-45">
          <blockquote key={`q-${idx}`} className={cn('heading-h5 text-white', phase === 'in' ? 'animate-quote-in' : 'animate-quote-out')}>
            {QUOTES[idx].text}
          </blockquote>
        </div>
        <figcaption
          key={`a-${idx}`}
          className={cn('mt-6 leading-5.5 font-medium text-sky', phase === 'in' ? 'animate-author-in' : 'animate-quote-out')}
        >
          {QUOTES[idx].author}
        </figcaption>

        <div className="mt-8 flex items-center gap-2">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show quote ${i + 1}`}
              aria-current={i === idx || undefined}
              onClick={() => goTo(i)}
              className={cn(
                'h-0.75 rounded-full transition-all duration-500',
                i === idx ? 'w-6 animate-dot-pulse bg-white/90' : 'w-1.5 bg-white/25',
              )}
            />
          ))}
        </div>
      </figure>
    </aside>
  )
}
