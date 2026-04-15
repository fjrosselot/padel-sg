import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import StandingsTable from './StandingsTable'
import LadderView from './LadderView'
import ResultadoLigaModal from './ResultadoLigaModal'
import { calcStandings } from '../../lib/ligas/standings'
import { useUser } from '../../hooks/useUser'
import type { Database } from '../../lib/types/database.types'

type Liga = Database['padel']['Tables']['ligas']['Row']

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador', activa: 'Activa', finalizada: 'Finalizada',
}

interface PartidoLiga {
  id: string
  pareja1_j1: string | null
  pareja1_j2: string | null
  pareja2_j1: string | null
  pareja2_j2: string | null
  sets_pareja1: number | null
  sets_pareja2: number | null
  ganador: 1 | 2 | null
  estado: 'pendiente' | 'en_curso' | 'jugado' | 'walkover'
  jugador1: { nombre: string; elo: number } | null
  jugador2: { nombre: string; elo: number } | null
}

export default function LigaDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [selectedPartido, setSelectedPartido] = useState<PartidoLiga | null>(null)

  const { data: liga, isLoading: ligaLoading } = useQuery({
    queryKey: ['liga', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('ligas')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Liga
    },
    enabled: !!id,
  })

  const { data: participantes } = useQuery({
    queryKey: ['liga-participantes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('liga_participantes')
        .select('id, jugador_id, posicion, jugador:jugadores!jugador_id(nombre, elo)')
        .eq('liga_id', id!)
        .order('posicion', { ascending: true })
      if (error) throw error
      return data as unknown as Array<{
        id: string; jugador_id: string; posicion: number | null;
        jugador: { nombre: string; elo: number } | null
      }>
    },
    enabled: !!id,
  })

  const { data: partidos } = useQuery({
    queryKey: ['partidos-liga', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('partidos')
        .select(`
          id, pareja1_j1, pareja1_j2, pareja2_j1, pareja2_j2, sets_pareja1, sets_pareja2, ganador, estado,
          jugador1:jugadores!pareja1_j1(nombre, elo),
          jugador2:jugadores!pareja2_j1(nombre, elo)
        `)
        .eq('liga_id', id!)
        .order('numero_partido', { ascending: true })
      if (error) throw error
      return data as unknown as PartidoLiga[]
    },
    enabled: !!id,
  })

  if (ligaLoading) return <div className="p-6 text-muted">Cargando…</div>
  if (!liga) return <div className="p-6 text-red-500">Liga no encontrada</div>

  const jugadoresMap = Object.fromEntries(
    (participantes ?? []).map(p => [p.jugador_id, p.jugador?.nombre ?? p.jugador_id])
  )

  const jugadorIds = (participantes ?? []).map(p => p.jugador_id)
  const standings = calcStandings(jugadorIds, partidos ?? [])

  const pendientes = (partidos ?? []).filter(p => p.estado === 'pendiente')

  // Partidos que involucran al usuario actual (para mostrarle sus pendientes)
  const misPendientes = (partidos ?? []).filter(p =>
    p.estado === 'pendiente' && (
      p.pareja1_j1 === user?.id || p.pareja1_j2 === user?.id ||
      p.pareja2_j1 === user?.id || p.pareja2_j2 === user?.id
    )
  )

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted font-inter text-sm hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Ligas
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-manrope text-navy">{liga.nombre}</h1>
          <p className="text-muted text-sm">
            {liga.formato === 'round_robin' ? 'Round Robin' : 'Escalerilla'} · {liga.fecha_inicio}
          </p>
        </div>
        <Badge>{ESTADO_LABELS[liga.estado]}</Badge>
      </div>

      {liga.formato === 'round_robin' ? (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Tabla de posiciones</p>
            <StandingsTable ligaId={liga.id} standings={standings} jugadoresMap={jugadoresMap} />
          </div>

          {(pendientes.length > 0 && isAdmin || misPendientes.length > 0) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
                {isAdmin ? 'Partidos pendientes' : 'Mis partidos pendientes'}
              </p>
              <div className="space-y-2">
                {(isAdmin ? pendientes : misPendientes).map(p => (
                  <div key={p.id} className="bg-surface rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm">
                      <span className="font-medium text-navy">{p.jugador1?.nombre ?? '?'}</span>
                      <span className="text-muted mx-2">vs</span>
                      <span className="font-medium text-navy">{p.jugador2?.nombre ?? '?'}</span>
                    </span>
                    {isAdmin && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedPartido(p)} className="border border-slate/30 text-navy text-sm hover:bg-surface">
                        Cargar resultado
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <LadderView ligaId={liga.id} estado={liga.estado} />
      )}

      {selectedPartido && (
        <ResultadoLigaModal
          partido={selectedPartido}
          ligaId={liga.id}
          onClose={() => setSelectedPartido(null)}
        />
      )}
    </div>
  )
}
