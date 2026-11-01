import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { EmailAuthForm, useSendCode } from '@/features/auth'
import { getErrorMessage } from '@/lib/api-client'

export const Route = createFileRoute('/_auth/sign-up')({
  validateSearch: (search: Record<string, unknown>): { invite?: string } =>
    typeof search.invite === 'string' ? { invite: search.invite } : {},
  component: SignupPage,
})

function SignupPage() {
  const { invite } = Route.useSearch()
  const navigate = Route.useNavigate()
  const sendCode = useSendCode()
  return (
    <EmailAuthForm
      title="Get Started"
      subtitle="Welcome to Silo, your personal silo of wealth — isolated, safe, controlled by you"
      onSubmit={async (email) => {
        try {
          await sendCode.mutateAsync(email)
        } catch (err) {
          toast.error(getErrorMessage(err, 'Couldn’t send your sign-up code. Try again.'))
          return
        }
        await navigate({ to: '/verify-email', search: { email, intent: 'sign-up', invite } })
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
