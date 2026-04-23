import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/padelApi', () => ({
  padelApi: {
    patch: vi.fn().mockResolvedValue(null),
    get: vi.fn().mockResolvedValue([{
      id: 't1',
      estado: 'en_curso',
      categorias: [{
        nombre: '4a',
        grupos: [{ letra: 'A', parejas: [{ id: 'i1', nombre: 'García / López', jugador1_id: 'u1', jugador2_id: 'u2', elo1: 1200, elo2: 1200 }], partidos: [] }],
        faseEliminatoria: [],
        consola: [],
      }],
    }]),
  },
}))

vi.mock('./PlayerCombobox', () => ({
  PlayerCombobox: ({ onChange }: { onChange: (id: string) => void }) => (
    <button onClick={() => onChange('u99')}>Select player</button>
  ),
  usePastCompaneros: () => [],
}))

import EditParejaModal from './EditParejaModal'
import type { ParejaFixture } from '../../lib/fixture/types'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const mockPareja: ParejaFixture = {
  id: 'i1',
  nombre: 'García / López',
  jugador1_id: 'u1',
  jugador2_id: 'u2',
  elo1: 1200,
  elo2: 1200,
}

describe('EditParejaModal', () => {
  it('shows Renombrar and Reemplazar tabs', () => {
    render(
      <EditParejaModal torneoId="t1" inscripcionId="i1" pareja={mockPareja} onClose={() => {}} />,
      { wrapper }
    )
    expect(screen.getByRole('tab', { name: /renombrar/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /reemplazar/i })).toBeDefined()
  })

  it('shows current pareja nombre in rename field', () => {
    render(
      <EditParejaModal torneoId="t1" inscripcionId="i1" pareja={mockPareja} onClose={() => {}} />,
      { wrapper }
    )
    expect(screen.getByDisplayValue('García / López')).toBeDefined()
  })
})
