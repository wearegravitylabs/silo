import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getErrorMessage } from '@/lib/api-client'
import { DELETE_ACCOUNT_WARNING } from '../constants'
import { useDeleteAccount } from '../queries'

/**
 * Last step of account deletion: a warning and Delete Account. Success signs out to /login.
 * TODO: the design asks for a code emailed to the user (DeletionCodeDialog); bring it back once the API sends one.
 */
export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const remove = useDeleteAccount()
  const navigate = useNavigate()

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Account?"
      confirmLabel="Delete Account"
      pending={remove.isPending}
      onConfirm={() =>
        remove.mutate(undefined, {
          onSuccess: () => {
            toast.success('Your account has been deleted')
            navigate({ to: '/login' })
          },
          onError: (error) => toast.error(getErrorMessage(error, 'Couldn’t delete your account. Try again.')),
        })
      }
    >
      {DELETE_ACCOUNT_WARNING}
    </ConfirmDialog>
  )
}
