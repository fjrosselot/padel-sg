import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../lib/padelApi', () => ({
  padelApi: { patch: vi.fn().mockResolvedValue(null) },
}))

import EditTorneoModal from './EditTorneoModal'
import type { Database } from '../../lib/types/database.types'

type Torneo = Database['padel']['Tables']['torneos']['Row']

const baseTorneo: Torneo = {
  id: 't1',
  nombre: 'Torneo Test',
  fecha_inicio: '2026-05-01',
  estado: 'borrador',
  tipo: 'interno',
  colegio_rival: null,
  categorias: [{ nombre: '4a', num_parejas: 4, sexo: 'M', formato: 'americano_grupos' }] as any,
  config_fixture: { duracion_partido: 45, pausa_entre_partidos: 10, num_canchas: 2, hora_inicio: '09:00' } as any,
  created_at: '2026-01-01T00:00:00Z',
  descripcion: null,
  ambito: 'interno',
  club_externo: null,
  url_externo: null,
  formato: null,
  sistema_ranking: 'elo',
  temporada_id: null,
  evento_id: null,
  fecha_fin: null,
  max_parejas: null,
  inscripcion_abierta: false,
  deporte_id: 'padel',
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('EditTorneoModal', () => {
  it('renders with current torneo nombre', () => {
    render(<EditTorneoModal torneo={baseTorneo} onClose={() => {}} />, { wrapper })
    expect(screen.getByDisplayValue('Torneo Test')).toBeDefined()
  })

  it('shows borrador-only sections when estado is borrador', () => {
    render(<EditTorneoModal torneo={baseTorneo} onClose={() => {}} />, { wrapper })
    expect(screen.getByText(/tipo de torneo/i)).toBeDefined()
  })

  it('does not show tipo radio when estado is inscripcion', () => {
    const torneo = { ...baseTorneo, estado: 'inscripcion' as const }
    render(<EditTorneoModal torneo={torneo} onClose={() => {}} />, { wrapper })
    expect(screen.queryByText(/tipo de torneo/i)).toBeNull()
  })

  it('shows colegio_rival field when tipo is vs_colegio', () => {
    const torneo = { ...baseTorneo, tipo: 'vs_colegio' as const }
    render(<EditTorneoModal torneo={torneo} onClose={() => {}} />, { wrapper })
    expect(screen.getByLabelText(/colegio rival/i)).toBeDefined()
  })
})
