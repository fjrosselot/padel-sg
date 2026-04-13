import { useState } from 'react'
import { useParams } from 'react-router-dom'
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
  estado: string
  jugador1: { nombre: string; elo: number } | null
  jugador2: { nombre: string; elo: number } | null
}

export default function LigaDetalle() {
  const { id } = useParams<{ id: string }>()
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
          id, pareja1_j1, pareja2_j1, sets_pareja1, sets_pareja2, ganador, estado,
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

  if (ligaLoading) return <div className="p-6 text-gray-400">Cargando…</div>
  if (!liga) return <div className="p-6 text-red-500">Liga no encontrada</div>

  const jugadoresMap = Object.fromEntries(
    (participantes ?? []).map(p => [p.jugador_id, p.jugador?.nombre ?? p.jugador_id])
  )

  const jugadorIds = (participantes ?? []).map(p => p.jugador_id)
  const standings = calcStandings(jugadorIds, partidos ?? [])

  const pendientes = (partidos ?? []).filter(p => p.estado === 'pendiente')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-manrope text-navy">{liga.nombre}</h1>
          <p className="text-gray-400 text-sm">
            {liga.formato === 'round_robin' ? 'Round Robin' : 'Escalerilla'} · {liga.fecha_inicio}
          </p>
        </div>
        <Badge>{ESTADO_LABELS[liga.estado]}</Badge>
      </div>

      {liga.formato === 'round_robin' ? (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Tabla de posiciones</p>
            <StandingsTable ligaId={liga.id} standings={standings} jugadoresMap={jugadoresMap} />
          </div>

          {pendientes.length > 0 && isAdmin && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Partidos pendientes</p>
              <div className="space-y-2">
                {pendientes.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm">
                      <span className="font-medium text-navy">{p.jugador1?.nombre ?? '?'}</span>
                      <span className="text-gray-400 mx-2">vs</span>
                      <span className="font-medium text-navy">{p.jugador2?.nombre ?? '?'}</span>
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setSelectedPartido(p)}>
                      Cargar resultado
                    </Button>
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
