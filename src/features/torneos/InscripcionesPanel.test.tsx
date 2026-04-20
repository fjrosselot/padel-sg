import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => {
            const chain: Record<string, unknown> = {}
            const terminal = Promise.resolve({ data: [], error: null })
            chain['order'] = () => chain
            chain['then'] = terminal.then.bind(terminal)
            chain['catch'] = terminal.catch.bind(terminal)
            return chain
          },
          insert: () => Promise.resolve({ error: null }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        }),
      }),
    }),
  },
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
    render(<InscripcionesPanel torneoId="t1" estado="borrador" categorias={[]} />, { wrapper })
    expect(screen.getByText('Inscripciones')).toBeDefined()
  })
})
