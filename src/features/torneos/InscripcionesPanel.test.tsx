import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        })
      })
    })
  }
}))

vi.mock('../../hooks/useUser', () => ({
  useUser: () => ({ data: { rol: 'jugador' } })
}))

import InscripcionesPanel from './InscripcionesPanel'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('InscripcionesPanel', () => {
  it('renders heading', () => {
    render(<InscripcionesPanel torneoId="t1" estado="borrador" />, { wrapper })
    expect(screen.getByText('Inscripciones')).toBeDefined()
  })
})
