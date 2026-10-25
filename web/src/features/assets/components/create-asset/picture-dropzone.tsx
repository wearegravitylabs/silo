import { useRef, useState } from 'react'
import { UploadIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { InfoDotIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { ASSET_IMAGE_MAX_BYTES, ASSET_IMAGE_TYPES, MAX_PICTURES } from '../../constants'

/**
 * Photo drop area (drag & drop or click; PNG/JPEG up to 1MB, at most 4), with the picked photos as thumbnails underneath
 * in four slots. Reports local preview URLs; a removed one is revoked.
 */
export function PictureDropzone({ id, pictures, onChange }: { id?: string; pictures: string[]; onChange: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const full = pictures.length >= MAX_PICTURES

  const add = (list: FileList | null) => {
    // Copy first: the FileList is live and empties when the input is reset.
    const files = Array.from(list ?? [])
    if (input.current) input.current.value = '' // so picking the same file again still fires
    if (!files.length) return
    const room = MAX_PICTURES - pictures.length
    const accepted: string[] = []
    for (const file of files) {
      if (!ASSET_IMAGE_TYPES.includes(file.type)) toast.error(`${file.name} isn't a PNG or JPEG`)
      else if (file.size > ASSET_IMAGE_MAX_BYTES) toast.error(`${file.name} is over 1MB`)
      else if (accepted.length < room) accepted.push(URL.createObjectURL(file))
    }
    if (files.length > room) toast.error(`You can upload up to ${MAX_PICTURES} pictures`)
    if (accepted.length) onChange([...pictures, ...accepted])
  }

  const remove = (url: string) => {
    URL.revokeObjectURL(url)
    onChange(pictures.filter((p) => p !== url))
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        id={id}
        type="button"
        disabled={full}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!full) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!full) add(e.dataTransfer.files)
        }}
        className={cn(
          'flex h-33 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
          dragging ? 'border-primary bg-primary-subtle' : 'border-border hover:bg-surface',
        )}
      >
        <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent text-foreground">
          <UploadIcon className="size-4" aria-hidden />
        </span>
        <span className="font-medium text-foreground">Drag &amp; drop or choose file</span>
        <span className="text-xs leading-5 text-muted-foreground">PNG or JPEG, Max file size: 1MB</span>
      </button>
      <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
        <InfoDotIcon />
        Upload up to {MAX_PICTURES} pictures
      </p>

      {pictures.length > 0 && (
        <ul className="mt-1 grid grid-cols-4 gap-2">
          {Array.from({ length: MAX_PICTURES }, (_, i) => {
            const url = pictures[i]
            return (
              <li key={url ?? `slot-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                {url && (
                  <>
                    <img src={url} alt={`Picture ${i + 1}`} className="size-full animate-rise object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove picture ${i + 1}`}
                      onClick={() => remove(url)}
                      className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-small transition-opacity outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept={ASSET_IMAGE_TYPES.join(',')}
        multiple
        hidden
        aria-label="Pictures"
        onChange={(e) => add(e.target.files)}
      />
    </div>
  )
}
