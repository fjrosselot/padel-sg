import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search, Trophy, TrendingUp, CreditCard } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import type { Jugador } from '../../lib/supabase'
import { usePlayerRankings } from '../../hooks/usePlayerRankings'
import { PuntosHistorial } from '../ranking/PuntosHistorial'
import { PuntosDefender } from '../ranking/PuntosDefender'
import { useUser } from '../../hooks/useUser'
import { PagosJugador } from '../tesoreria/PagosJugador'
import { JugadorDetalleSidebar } from './JugadorDetalleSidebar'

const FASE_LABEL: Record<string, string> = {
  grupo: 'Grupos', cuartos: 'Cuartos', semifinal: 'Semifinal', final: 'Final',
  tercer_lugar: '3er lugar', octavos: 'Octavos', consolacion_cuartos: 'Consola C',
  consolacion_sf: 'Consola SF', consolacion_final: 'Consola F', desafio: 'Desafío',
}

interface HistorialEntry {
  torneo_id: string; torneo_nombre: string; torneo_fecha: string | null
  match_id: string; fase: string | null; turno: string | null
  pareja1_nombre: string | null; pareja2_nombre: string | null
  ganador: number | null; resultado: string | null; es_pareja1: boolean
}

type Tab = 'partidos' | 'puntos' | 'pagos'

function PartidoRow({ entry, query }: { entry: HistorialEntry; query: string }) {
  const gano = entry.ganador !== null && (
    (entry.es_pareja1 && entry.ganador === 1) || (!entry.es_pareja1 && entry.ganador === 2)
  )
  const rival = entry.es_pareja1 ? entry.pareja2_nombre : entry.pareja1_nombre
  const faseLabel = entry.fase ? (FASE_LABEL[entry.fase] ?? entry.fase) : null
  if (query) {
    const q = query.toLowerCase()
    const hayMatch = (rival ?? '').toLowerCase().includes(q)
      || entry.torneo_nombre.toLowerCase().includes(q)
      || (faseLabel ?? '').toLowerCase().includes(q)
    if (!hayMatch) return null
  }
  let score = '—'
  if (entry.resultado) {
    score = entry.es_pareja1
      ? entry.resultado
      : entry.resultado.split(' ').map(s => s.split('-').reverse().join('-')).join(' ')
  }
  const fecha = entry.torneo_fecha
    ? new Date(entry.torneo_fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
    : '—'
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`shrink-0 w-14 text-center rounded-md px-1.5 py-0.5 font-inter text-[10px] font-black uppercase ${
        gano ? 'bg-success/10 text-success' : 'bg-defeat/10 text-defeat'
      }`}>
        {gano ? 'Victoria' : 'Derrota'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-inter text-xs font-medium text-navy truncate">
          {rival ? `vs ${rival}` : (faseLabel ?? entry.torneo_nombre)}
        </p>
        <p className="font-inter text-[10px] text-muted truncate">
          {entry.torneo_nombre}{faseLabel ? ` · ${faseLabel}` : ''} · {fecha}
        </p>
      </div>
      <span className="font-manrope text-sm font-bold text-navy shrink-0">{score}</span>
    </div>
  )
}

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const esPropioPeril = !!user?.id && user.id === id

  const [tab, setTab] = useState<Tab>('partidos')
  const [query, setQuery] = useState('')

  const { data: jugador, isLoading, error } = useQuery({
    queryKey: ['jugador', id],
    queryFn: () =>
      padelApi.get<(Jugador & { rut?: string | null; fecha_nacimiento?: string | null })[]>(
        `jugadores?select=id,nombre,nombre_pila,apellido,apodo,email,categoria,foto_url,lado_preferido,sexo,mixto,frecuencia_semanal,rut,telefono,hijos_sg,fecha_nacimiento&id=eq.${id}`
      ).then(r => r[0] ?? null),
    enabled: !!id,
  })

  const { data: historial = [] } = useQuery({
    queryKey: ['jugador-historial-rpc', id],
    queryFn: () => padelApi.rpc<HistorialEntry[]>('get_player_historial', { p_jugador_id: id }),
    enabled: !!id,
  })

  const { data: rankings = [] } = usePlayerRankings(id)

  // Computed stats
  const victorias = useMemo(() =>
    historial.filter(e => (e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2)).length
  , [historial])
  const winRate = historial.length > 0 ? Math.round((victorias / historial.length) * 100) : null

  const racha = useMemo(() => {
    if (!historial.length) return null
    const results = historial.map(e =>
      (e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2) ? 'v' : 'd'
    )
    const tipo = results[0]
    let n = 0; for (const r of results) { if (r === tipo) n++; else break }
    return n >= 2 ? { tipo: tipo === 'v' ? 'victoria' as const : 'derrota' as const, n } : null
  }, [historial])

  const badges = useMemo(() => {
    const list = []
    if (racha?.tipo === 'victoria' && racha.n >= 3)
      list.push({ emoji: '🔥', label: 'En racha', desc: `${racha.n} victorias consecutivas`, color: '#FF6B35', bg: '#FFF0EB' })
    const ganoFinal = historial.some(e => e.fase === 'final' && ((e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2)))
    const llegFinal = historial.some(e => e.fase === 'final')
    if (ganoFinal) list.push({ emoji: '🏆', label: 'Campeón', desc: 'Ganó al menos una final', color: '#D97706', bg: '#FEF3C7' })
    else if (llegFinal) list.push({ emoji: '🥈', label: 'Finalista', desc: 'Llegó a una final', color: '#6B7280', bg: '#F3F4F6' })
    if (winRate !== null && winRate >= 65 && historial.length >= 5)
      list.push({ emoji: '💪', label: 'Sólido', desc: '+65% de efectividad', color: '#059669', bg: '#D1FAE5' })
    if (new Set(historial.map(e => e.torneo_id)).size >= 5)
      list.push({ emoji: '⭐', label: 'Veterano', desc: 'Participó en 5+ torneos', color: '#7C3AED', bg: '#EDE9FE' })
    return list
  }, [racha, historial, winRate])

  const tabs: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: 'partidos', label: 'Mis partidos', icon: Trophy },
    { id: 'puntos',   label: 'Mis puntos',   icon: TrendingUp },
    ...(isAdmin || esPropioPeril ? [{ id: 'pagos' as Tab, label: 'Mis pagos', icon: CreditCard }] : []),
  ]
  const placeholders: Record<Tab, string> = {
    partidos: 'Buscar rival, torneo, fase…',
    puntos: 'Buscar torneo…',
    pagos: 'Buscar concepto…',
  }

  if (isLoading) return <div className="p-6 font-inter text-sm text-muted">Cargando…</div>
  if (error || !jugador) return (
    <div className="p-6 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 font-inter text-sm text-muted">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <p className="font-inter text-sm text-muted">Jugador no encontrado.</p>
    </div>
  )

  const victoriasFiltradas = historial.filter(e => (query
    ? (e.pareja2_nombre ?? e.pareja1_nombre ?? '').toLowerCase().includes(query.toLowerCase()) || e.torneo_nombre.toLowerCase().includes(query.toLowerCase())
    : true
  ) && ((e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2))).length

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-inter text-sm text-muted hover:text-navy transition-colors">
        <ArrowLeft className="h-4 w-4" /> Jugadores
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5 items-start">

        {/* ── Main area ── */}
        <div className="space-y-3 order-2 md:order-1">
          {/* Tab selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-white shadow-card">
            {tabs.map(t => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button key={t.id} type="button"
                  onClick={() => { setTab(t.id); setQuery('') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-inter text-[11px] font-semibold transition-all ${
                    active ? 'bg-navy text-gold shadow-sm' : 'text-slate hover:text-navy'
                  }`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Search (only for partidos) */}
          {tab === 'partidos' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-card">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={placeholders[tab]}
                className="flex-1 bg-transparent font-inter text-xs text-navy outline-none placeholder:text-muted" />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="font-inter text-[10px] text-muted">✕</button>
              )}
            </div>
          )}

          {/* Tab content */}
          {tab === 'partidos' && (
            <div className="rounded-xl bg-white shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-surface flex items-center justify-between">
                <div>
                  <p className="font-manrope text-sm font-bold text-navy">Partidos</p>
                  {historial.length > 0 && !query && (
                    <p className="font-inter text-[10px] text-muted mt-0.5">
                      {historial.length} partidos · {victorias} victorias{winRate !== null ? ` · ${winRate}%` : ''}
                    </p>
                  )}
                  {query && (
                    <p className="font-inter text-[10px] text-muted mt-0.5">
                      {victoriasFiltradas} victorias en resultados filtrados
                    </p>
                  )}
                </div>
                {historial.length > 10 && !query && (
                  <Link to={`/jugadores/${id}/partidos`} className="font-inter text-xs text-gold hover:underline">
                    Ver todos →
                  </Link>
                )}
              </div>
              <div className="divide-y divide-surface">
                {historial.length === 0
                  ? <p className="px-4 py-8 text-center font-inter text-sm text-muted">Sin partidos registrados.</p>
                  : historial.slice(0, query ? undefined : 10).map(e => (
                      <PartidoRow key={e.match_id} entry={e} query={query} />
                    ))
                }
              </div>
            </div>
          )}

          {tab === 'puntos' && (
            <div className="space-y-3">
              <PuntosDefender jugadorId={id!} />
              <PuntosHistorial jugadorId={id!} />
            </div>
          )}

          {tab === 'pagos' && (isAdmin || esPropioPeril) && (
            <div className="rounded-xl bg-white shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-surface">
                <p className="font-manrope text-sm font-bold text-navy">Pagos y cobros</p>
              </div>
              <div className="p-4">
                <PagosJugador jugadorId={id!} />
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="order-1 md:order-2">
          <JugadorDetalleSidebar
            jugador={jugador}
            rankings={rankings}
            badges={badges}
            esPropioPeril={esPropioPeril}
            isAdmin={isAdmin}
            currentUserId={user?.id}
          />
        </div>
      </div>
    </div>
  )
}
