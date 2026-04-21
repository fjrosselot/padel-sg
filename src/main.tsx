import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { router } from '@/router'
import './index.css'

// Invalidate all queries when auth session arrives or changes so RLS-gated
// queries never serve stale empty data cached before the session was ready.
supabase.auth.onAuthStateChange((event, session) => {
  if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
    queryClient.invalidateQueries()
  }
  if (event === 'SIGNED_OUT') {
    queryClient.clear()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-center" richColors />
    </QueryClientProvider>
  </React.StrictMode>,
)
