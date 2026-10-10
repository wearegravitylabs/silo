import { createContext, useContext } from 'react'

/**
 * Dev galleries render real modals and menus in a fixed state. Inside <PreviewMode>, dialogs and menus
 * are non-modal (no focus trap, no blocked page), so the gallery around them stays usable.
 */
const PreviewModeContext = createContext(false)

export const PreviewMode = PreviewModeContext.Provider
export const usePreviewMode = () => useContext(PreviewModeContext)
