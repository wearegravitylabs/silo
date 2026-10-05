import { createFileRoute } from '@tanstack/react-router'
import { ProfileForm } from '@/features/account'

export const Route = createFileRoute('/onboarding/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = Route.useNavigate()
  return <ProfileForm onDone={() => navigate({ to: '/onboarding/portfolio' })} />
}
