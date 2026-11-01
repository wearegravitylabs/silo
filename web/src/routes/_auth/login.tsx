import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EmailAuthForm, useSendCode } from '@/features/auth'
import { getErrorMessage } from '@/lib/api-client'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = Route.useNavigate()
  const sendCode = useSendCode()
  return (
    <EmailAuthForm
      title="Welcome back"
      subtitle="Sign in to your Silo account to continue tracking your wealth."
      onSubmit={async (email) => {
        try {
          await sendCode.mutateAsync(email)
        } catch (err) {
          toast.error(getErrorMessage(err, 'Couldn’t send your sign-in code. Try again.'))
          return
        }
        await navigate({ to: '/verify-email', search: { email, intent: 'login' } })
      }}
      footer={
        <p className="mt-5 text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/sign-up" className="font-medium text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      }
    />
  )
}
