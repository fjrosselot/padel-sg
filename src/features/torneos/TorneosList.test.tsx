import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) })
      })
    })
  }
}))

import TorneosList from './TorneosList'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('TorneosList', () => {
  it('renders heading', () => {
    render(<TorneosList />, { wrapper })
    expect(screen.getByText('Torneos')).toBeDefined()
  })
  it('renders new torneo button', () => {
    render(<TorneosList />, { wrapper })
    expect(screen.getByText('+ Nuevo torneo')).toBeDefined()
  })
})
