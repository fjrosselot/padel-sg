import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowUpDown, Check } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'

interface HistorialEntry {
  torneo_id: string
  torneo_nombre: string
  torneo_fecha: string | null
  match_id: string
  fase: string | null
  turno: string | null
  pareja1_nombre: string | null
  pareja2_nombre: string | null
  ganador: number | null
  resultado: string | null
  es_pareja1: boolean
}

const FASE_LABEL: Record<string, string> = {
  grupo: 'Grupos', octavos: 'Octavos', cuartos: 'Cuartos',
  semifinal: 'Semifinal', tercer_lugar: '3er lugar', final: 'Final',
  consolacion_cuartos: 'Consola C', consolacion_sf: 'Consola SF',
  consolacion_final: 'Consola F', desafio: 'Desafío',
}

export default function JugadorPartidos() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const { data: jugador } = useQuery({
    queryKey: ['jugador-nombre', id],
    queryFn: () =>
      padelApi.get<{ nombre: string }[]>(`jugadores?select=nombre&id=eq.${id}`)
        .then(r => r[0] ?? null),
    enabled: !!id,
  })

  const { data: historial = [], isLoading } = useQuery({
    queryKey: ['jugador-historial-rpc', id],
    queryFn: () => padelApi.rpc<HistorialEntry[]>('get_player_historial', { p_jugador_id: id }),
    enabled: !!id,
  })

  const sorted = useMemo(() => {
    return [...historial].sort((a, b) => {
      const da = a.torneo_fecha ?? ''
      const db = b.torneo_fecha ?? ''
      const ta = a.turno ?? ''
      const tb = b.turno ?? ''
      const cmp = da !== db ? da.localeCompare(db) : ta.localeCompare(tb)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [historial, sortDir])

  const victorias = historial.filter(e =>
    (e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2)
  ).length
  const winRate = historial.length > 0 ? Math.round((victorias / historial.length) * 100) : null

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(`/jugadores/${id}`)}
        className="flex items-center gap-2 text-muted font-inter text-sm hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {jugador?.nombre ?? 'Jugador'}
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-manrope text-2xl font-bold text-navy">Todos los partidos</h1>
          {historial.length > 0 && (
            <p className="font-inter text-xs text-muted mt-0.5">
              {historial.length} partidos · {victorias} victorias{winRate !== null ? ` · ${winRate}%` : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-navy/20 font-inter text-xs text-muted hover:text-navy transition-colors"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortDir === 'desc' ? 'Reciente' : 'Antiguo'}
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-card overflow-hidden divide-y divide-navy/5">
        {isLoading && (
          <p className="px-4 py-8 text-center font-inter text-sm text-muted">Cargando…</p>
        )}
        {!isLoading && sorted.length === 0 && (
          <p className="px-4 py-8 text-center font-inter text-sm text-muted">Sin partidos registrados.</p>
        )}
        {sorted.map(e => {
          const gano = (e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2)
          const rival = e.es_pareja1 ? e.pareja2_nombre : e.pareja1_nombre
          const faseLabel = e.fase ? (FASE_LABEL[e.fase] ?? e.fase) : null

          let displayScore = '—'
          if (e.resultado) {
            displayScore = e.es_pareja1
              ? e.resultado
              : e.resultado.split(' ').map(s => s.split('-').reverse().join('-')).join(' ')
          }

          const fechaStr = e.torneo_fecha
            ? new Date(e.torneo_fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', timeZone: 'America/Santiago' })
            : '—'

          return (
            <div key={e.match_id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/60 transition-colors">
              {/* Estado */}
              <span className={`shrink-0 w-14 text-center rounded-md px-1.5 py-0.5 font-inter text-[10px] font-black uppercase ${
                gano ? 'bg-success/10 text-success' : 'bg-defeat/10 text-defeat'
              }`}>
                {gano ? 'Victoria' : 'Derrota'}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-inter text-xs font-medium text-navy truncate">
                  {rival ? `vs ${rival}` : (faseLabel ?? e.torneo_nombre)}
                </p>
                <p className="font-inter text-[10px] text-muted truncate">
                  {e.torneo_nombre}{faseLabel ? ` · ${faseLabel}` : ''} · {fechaStr}
                  {e.turno && ` · ${e.turno}`}
                </p>
              </div>

              {/* Score */}
              <span className="font-manrope text-sm font-bold text-navy shrink-0">{displayScore}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
