import { useRef } from 'react'
import { InfoIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '../constants'
import { useRemoveAvatar, useUploadAvatar } from '../queries'
import type { User } from '../types'

/** 64px photo (or first initial on lime) with Upload/Change and Remove. Changes save straight away. */
export function ProfilePhoto({ user }: { user: User }) {
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const hasPhoto = !!user.avatar_url

  const pick = (file: File | undefined) => {
    if (input.current) input.current.value = '' // so picking the same file again still fires
    if (!file) return
    const error = photoError(file)
    if (error) toast.error(error)
    else upload.mutate(file, { onSuccess: () => toast.success('Profile photo updated') })
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar
        name={user.first_name}
        src={user.avatar_url}
        className="size-16 border-0 bg-highlight text-4xl leading-none font-medium text-ink"
      />
      <div className="flex min-w-0 flex-col items-start gap-2.5">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="xs" loading={upload.isPending} onClick={() => input.current?.click()}>
            {hasPhoto ? 'Change Photo' : 'Upload Photo'}
          </Button>
          {hasPhoto && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Remove photo"
              loading={remove.isPending}
              onClick={() => remove.mutate(undefined, { onSuccess: () => toast.success('Profile photo removed') })}
              className="text-destructive hover:bg-destructive-subtle hover:text-destructive [&_svg]:size-3.5"
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-xs leading-5">
          <InfoIcon className="size-3 shrink-0 fill-subtle text-white" aria-hidden />
          Supported: JPG, PNG, 1MB Max
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept={AVATAR_TYPES.join(',')}
        hidden
        aria-label="Profile photo"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  )
}

function photoError(file: File) {
  if (!AVATAR_TYPES.includes(file.type)) return 'Choose a JPG or PNG image'
  if (file.size > AVATAR_MAX_BYTES) return 'Image must be 1MB or smaller'
}
