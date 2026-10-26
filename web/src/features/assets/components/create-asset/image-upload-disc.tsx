import { useRef } from 'react'
import { ImageIcon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { DotsIcon } from '@/components/icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ASSET_IMAGE_MAX_BYTES, ASSET_IMAGE_TYPES } from '../../constants'

const badge =
  'absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow-small outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40'

/**
 * 64px image picker for an asset: a grey disc with an upload badge, then the picked image with a ⋯ badge (Change image,
 * Remove image). Reports a local preview URL (the mock keeps it as the asset's image); a replaced or removed one is
 * revoked.
 */
export function ImageUploadDisc({
  value,
  onChange,
  fallback,
}: {
  value: string | null
  onChange: (url: string | null) => void
  /** Shown until an image is picked (e.g. the first photo); never revoked here */
  fallback?: string | null
}) {
  const input = useRef<HTMLInputElement>(null)

  const replace = (url: string | null) => {
    if (value) URL.revokeObjectURL(value)
    onChange(url)
  }

  const pick = (file: File | undefined) => {
    if (input.current) input.current.value = '' // so picking the same file again still fires
    if (!file) return
    if (!ASSET_IMAGE_TYPES.includes(file.type)) return toast.error('Choose a JPG or PNG image')
    if (file.size > ASSET_IMAGE_MAX_BYTES) return toast.error('Image must be 1MB or smaller')
    replace(URL.createObjectURL(file))
  }

  return (
    <div className="relative">
      {value ? (
        <span className="flex size-16 overflow-hidden rounded-full border border-border bg-background">
          <img src={value} alt="Asset image" className="size-full object-cover" />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-label="Upload asset image"
          className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-accent text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {fallback ? (
            <img src={fallback} alt="" className="size-full rounded-full object-cover" />
          ) : (
            <ImageIcon className="size-5" aria-hidden />
          )}
        </button>
      )}

      {value ? (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Image options" className={badge}>
            <DotsIcon className="text-current" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onSelect={() => input.current?.click()}>Change image</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => replace(null)}>
              Remove image
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button type="button" aria-hidden tabIndex={-1} onClick={() => input.current?.click()} className={badge}>
          <UploadIcon className="size-3" />
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept={ASSET_IMAGE_TYPES.join(',')}
        hidden
        aria-label="Asset image"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  )
}
