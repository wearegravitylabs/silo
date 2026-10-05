import { Link, useNavigate } from '@tanstack/react-router'
import { EmailAuthForm } from '@/features/auth'

export function SignupPage() {
  const navigate = useNavigate()
  return (
    <EmailAuthForm
      title="Get Started"
      subtitle="Welcome to Silo, your personal silo of wealth — isolated, safe, controlled by you"
      onCodeSent={() => navigate({ to: '/verify-email' })}
      footer={
        <>
          <p className="mt-5 text-center text-sm text-muted-foreground leading-[22px] tracking-[-0.1px]">
            By signing up, you agree to our{' '}
            <a href="#" className="font-medium text-foreground hover:underline">
              Terms of service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-foreground hover:underline">
              Privacy policy
            </a>
          </p>

          <p className="mt-3 text-center text-sm text-muted-foreground tracking-[-0.1px]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Log in
            </Link>
          </p>
        </>
      }
    />
  )
}
