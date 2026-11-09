export type FolderType = 'asset' | 'debt'

export interface Folder {
  id: string
  portfolio_id: string
  folder_type: FolderType
  name: string
  icon: string | null
  image_url: string | null
  /** Colour token from FOLDER_COLORS; null picks one by position. TODO: stored in the API folder's `icon` for now */
  color: string | null
  position: number
  created_at: string
  updated_at: string
}
