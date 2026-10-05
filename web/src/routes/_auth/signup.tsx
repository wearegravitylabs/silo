import { createFileRoute, Link } from '@tanstack/react-router'
import { EmailAuthForm } from '@/features/auth'

export const Route = createFileRoute('/_auth/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = Route.useNavigate()
  return (
    <EmailAuthForm
      title="Get Started"
      subtitle="Welcome to Silo, your personal silo of wealth — isolated, safe, controlled by you"
      onSubmit={(email) => navigate({ to: '/verify-email', search: { email } })}
      footer={
        <div className="mt-5 flex flex-col gap-3 text-center text-sm tracking-body text-muted-foreground">
          <p className="leading-5.5">
            By signing up, you agree to our{' '}
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
