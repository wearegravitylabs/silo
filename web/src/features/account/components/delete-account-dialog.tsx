import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { DeletionCodeDialog } from '@/components/deletion-code-dialog'
import { DELETE_ACCOUNT_WARNING, DELETION_CODE_LENGTH } from '../constants'
import { useDeleteAccount } from '../queries'

/**
 * Final step of account deletion: the code emailed to `email` plus an acknowledgement unlock Delete Account.
 * Success signs out to /login. Reopens empty.
 */
export function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
  defaultCode,
  defaultAcknowledged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  /** Dev gallery: open with a code typed / the box ticked. */
  defaultCode?: string
  defaultAcknowledged?: boolean
}) {
  const remove = useDeleteAccount()
  const navigate = useNavigate()

  return (
    <DeletionCodeDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Verify Account Deletion"
      warning={DELETE_ACCOUNT_WARNING}
      email={email}
      acknowledgement="I acknowledge that all of my account data will be deleted and want to proceed."
      confirmLabel="Delete Account"
      codeLength={DELETION_CODE_LENGTH}
      pending={remove.isPending}
      invalid={remove.isError}
      onReset={remove.reset}
      onConfirm={(code) =>
        remove.mutate(code, {
          onSuccess: () => {
            toast.success('Your account has been deleted')
            navigate({ to: '/login' })
          },
        })
      }
      defaultCode={defaultCode}
      defaultAcknowledged={defaultAcknowledged}
    />
  )
}
