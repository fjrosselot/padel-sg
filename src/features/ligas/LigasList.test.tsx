import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) })
      })
    })
  }
}))
vi.mock('../../hooks/useUser', () => ({ useUser: () => ({ data: { rol: 'jugador' } }) }))

import LigasList from './LigasList'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <MemoryRouter><QueryClientProvider client={qc}>{children}</QueryClientProvider></MemoryRouter>
}

describe('LigasList', () => {
  it('renders heading', () => {
    render(<LigasList />, { wrapper })
    expect(screen.getByText('Ligas')).toBeDefined()
  })
})
