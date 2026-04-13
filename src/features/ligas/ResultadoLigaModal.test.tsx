import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        update: () => ({ eq: () => Promise.resolve({ error: null }) })
      })
    })
  }
}))

import ResultadoLigaModal from './ResultadoLigaModal'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockPartido = {
  id: 'p1',
  pareja1_j1: 'u1',
  pareja2_j1: 'u2',
  jugador1: { nombre: 'García', elo: 1200 },
  jugador2: { nombre: 'López', elo: 1250 },
  estado: 'pendiente',
}

describe('ResultadoLigaModal', () => {
  it('shows both player names', () => {
    render(<ResultadoLigaModal partido={mockPartido} ligaId="l1" onClose={() => {}} />, { wrapper })
    expect(screen.getByText('García')).toBeDefined()
    expect(screen.getByText('López')).toBeDefined()
  })
  it('save button disabled without ganador selection', () => {
    render(<ResultadoLigaModal partido={mockPartido} ligaId="l1" onClose={() => {}} />, { wrapper })
    const btn = screen.getByText('Guardar resultado')
    expect(btn.closest('button')?.disabled).toBe(true)
  })
})
