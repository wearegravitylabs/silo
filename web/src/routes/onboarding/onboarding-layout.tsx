import { Outlet, useLocation } from '@tanstack/react-router'
import { Logo } from '@/components/logo'
import { ProgressDots } from '@/components/progress-dots'
import { endSession } from '@/lib/session'
import { ELEVATED_SHADOW } from '@/lib/shadows'

const STEPS = ['/onboarding/profile', '/onboarding/portfolio']

/** Shared onboarding shell: logo + log out on top, step dots at the bottom. */
export function OnboardingLayout() {
  const { pathname } = useLocation()
  const step = STEPS.indexOf(pathname) + 1 || 1


  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-background)' }}
    >
      {/* ── Top navigation ── */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{ height: '72px', padding: '0 40px' }}
      >
        <Logo />

        <button
          type="button"
          onClick={endSession}
          className="flex items-center justify-center transition-opacity hover:opacity-80 active:scale-[0.97]"
          style={{
            width: '72px',
            height: '32px',
            padding: '8px 12px',
            borderRadius: '10px',
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)',
            boxShadow: ELEVATED_SHADOW,
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

      {/* ── Centered step content ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <Outlet />
      </div>

      {/* ── Bottom: onboarding step progress ── */}
      <div className="flex justify-center pb-8 shrink-0">
        <ProgressDots steps={3} current={step} />
      </div>
    </div>
  )
}
