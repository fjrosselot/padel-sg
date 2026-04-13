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

import ResultadosModal from './ResultadosModal'
import type { PartidoFixture } from '../../lib/fixture/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockPartido: PartidoFixture = {
  id: 'p1',
  fase: 'grupo',
  grupo: 'A',
  numero: 1,
  pareja1: {
    id: 'i1',
    nombre: 'García / López',
    jugador1_id: 'u1',
    jugador2_id: 'u2',
    elo1: 1200,
    elo2: 1200,
  },
  pareja2: {
    id: 'i2',
    nombre: 'Martínez / Pérez',
    jugador1_id: 'u3',
    jugador2_id: 'u4',
    elo1: 1250,
    elo2: 1150,
  },
  cancha: 1,
  turno: '09:00',
  ganador: null,
  resultado: null,
}

describe('ResultadosModal', () => {
  it('shows both team names', () => {
    render(
      <ResultadosModal partido={mockPartido} torneoId="t1" onClose={() => {}} />,
      { wrapper }
    )
    expect(screen.getByText('García / López')).toBeDefined()
    expect(screen.getByText('Martínez / Pérez')).toBeDefined()
  })
  it('shows save button disabled without ganador selection', () => {
    render(
      <ResultadosModal partido={mockPartido} torneoId="t1" onClose={() => {}} />,
      { wrapper }
    )
    const saveBtn = screen.getByText('Guardar resultado')
    expect(saveBtn.closest('button')?.disabled).toBe(true)
  })
})
