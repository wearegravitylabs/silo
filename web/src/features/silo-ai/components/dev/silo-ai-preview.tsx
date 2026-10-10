import { useState } from 'react'
import type { ChatPreset } from '../../presets'
import { ChatStoreContext, createChatStore } from '../../store'
import { PanelContent } from '../panel/silo-ai-panel'

/**
 * Dev-only: the panel at its real size, frozen in one preset, with its own chat store (so a gallery
 * can show many at once). Still interactive — type, mention, send — without touching the app's chat.
 */
export function SiloAiPreview({ preset, firstName = 'Daniel' }: { preset: ChatPreset; firstName?: string }) {
  const [store] = useState(() => createChatStore(preset.snapshot))
  return (
    <ChatStoreContext.Provider value={store}>
      <div className="flex h-[42rem] w-94 shrink-0 flex-col overflow-hidden rounded-2xl bg-background shadow-small">
        <PanelContent firstName={firstName} onClose={() => {}} />
      </div>
    </ChatStoreContext.Provider>
  )
}
