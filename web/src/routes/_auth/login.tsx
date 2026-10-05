import { createFileRoute, Link } from '@tanstack/react-router'
import { EmailAuthForm } from '@/features/auth'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = Route.useNavigate()
  return (
    <EmailAuthForm
      title="Welcome back"
      subtitle="Sign in to your Silo account to continue tracking your wealth."
      onSubmit={(email) => navigate({ to: '/verify-email', search: { email } })}
      footer={
        <p className="mt-5 text-center text-sm tracking-body text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      }
    />
  )
}
