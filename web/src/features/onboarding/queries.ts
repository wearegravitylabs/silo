import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { onboard } from './api'

export const useOnboard = () => {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({ mutationFn: onboard, onSuccess: setUser })
}
