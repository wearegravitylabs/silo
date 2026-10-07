import { createFileRoute, Link } from '@tanstack/react-router'
import { EmailAuthForm } from '@/features/auth'

const SIMULATED_DELAY_MS = 1500

export const Route = createFileRoute('/_auth/sign-up')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = Route.useNavigate()
  return (
    <EmailAuthForm
      title="Get Started"
      subtitle="Welcome to Silo, your personal silo of wealth — isolated, safe, controlled by you"
      onSubmit={async (email) => {
        await new Promise((r) => setTimeout(r, SIMULATED_DELAY_MS)) // stand-in for the sign-up request
        await navigate({ to: '/verify-email', search: { email, intent: 'sign-up' } })
      }}
      footer={
        <div className="mt-4 flex flex-col gap-3 text-center">
          <p>
            By signing up, you agree to our <br />
            <a href="#" className="font-medium text-foreground hover:underline">
              Terms of service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-foreground hover:underline">
              Privacy policy
            </a>
          </p>
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Log in
            </Link>
          </p>
        </div>
      }
    />
  )
}
