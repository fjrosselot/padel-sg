import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
            order: () => Promise.resolve({ data: [], error: null }),
          })
        })
      })
    })
  }
}))

import StandingsTable from './StandingsTable'
import type { StandingRow } from '../../lib/ligas/standings'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockStandings: StandingRow[] = [
  { jugador_id: 'j1', puntos: 6, partidos_jugados: 2, partidos_ganados: 2, partidos_perdidos: 0, sets_favor: 4, sets_contra: 1, diff_sets: 3 },
  { jugador_id: 'j2', puntos: 0, partidos_jugados: 2, partidos_ganados: 0, partidos_perdidos: 2, sets_favor: 1, sets_contra: 4, diff_sets: -3 },
]

describe('StandingsTable', () => {
  it('renders POS header', () => {
    render(<StandingsTable ligaId="l1" standings={mockStandings} jugadoresMap={{}} />, { wrapper })
    expect(screen.getByText('POS')).toBeDefined()
  })
  it('renders PTS header', () => {
    render(<StandingsTable ligaId="l1" standings={mockStandings} jugadoresMap={{}} />, { wrapper })
    expect(screen.getByText('PTS')).toBeDefined()
  })
})
