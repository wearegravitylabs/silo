import { Link, useNavigate } from '@tanstack/react-router'
import { EmailAuthForm } from '@/features/auth'

export function LoginPage() {
  const navigate = useNavigate()
  return (
    <EmailAuthForm
      title="Welcome back"
      subtitle="Sign in to your Silo account to continue tracking your wealth."
      onCodeSent={() => navigate({ to: '/verify-email' })}
      footer={
        <p className="mt-5 text-center text-sm text-muted-foreground tracking-[-0.1px]">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      }
    />
  )
}
