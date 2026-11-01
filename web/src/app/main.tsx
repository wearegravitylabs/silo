import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { onSessionExpired } from '@/lib/session'
import { Providers } from './providers'
import { router } from './router'
import '@/styles/index.css'

onSessionExpired(() => router.navigate({ to: '/login' }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
