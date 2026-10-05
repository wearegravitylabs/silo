import { useNavigate } from '@tanstack/react-router'
import { ProfileForm } from '@/features/onboarding'

export function ProfilePage() {
  const navigate = useNavigate()
  return <ProfileForm onDone={() => navigate({ to: '/onboarding/portfolio' })} />
}
