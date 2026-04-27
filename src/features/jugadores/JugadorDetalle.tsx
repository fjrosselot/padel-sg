import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy, Target, Percent, Flame, Users, Wallet } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import type { Jugador } from '../../lib/supabase'
import { usePlayerRankings } from '../../hooks/usePlayerRankings'
import { PuntosHistorial } from '../ranking/PuntosHistorial'
import { PuntosDefender } from '../ranking/PuntosDefender'
import { useUser } from '../../hooks/useUser'
import { PagosJugador } from '../tesoreria/PagosJugador'
import { LadoBadge } from './LadoBadge'
import { useCategorias } from '../categorias/useCategorias'

const LADO_LABEL: Record<string, string> = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }
const MIXTO_LABEL: Record<string, string> = { si: 'Sí', no: 'No', a_veces: 'A veces' }
const FASE_LABEL: Record<string, string> = {
  grupo: 'Fase de grupos', cuartos: 'Cuartos de final',
  semifinal: 'Semifinal', final: 'Final', tercer_lugar: 'Tercer lugar',
  octavos: 'Octavos de final', consolacion_cuartos: 'Consolación',
  consolacion_sf: 'Cons. SF', consolacion_final: 'Cons. Final', desafio: 'Desafío',
}

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

interface AmistosoBase {
  id: string
  fecha: string | null
  creador_id: string | null
  companero_id: string | null
  jugador3_id: string | null
  jugador4_id: string | null
}

interface InscripcionCompanero {
  jugador1_id: string
  jugador2_id: string
  j1: { nombre: string; foto_url: string | null } | null
  j2: { nombre: string; foto_url: string | null } | null
}

type JugadorExtra = Jugador & { rut?: string | null }

function TorneoCard({ entry }: { entry: HistorialEntry }) {
  const gano = entry.ganador !== null && (
    (entry.es_pareja1 && entry.ganador === 1) ||
    (!entry.es_pareja1 && entry.ganador === 2)
  )
  const rival = entry.es_pareja1 ? entry.pareja2_nombre : entry.pareja1_nombre
  const faseLabel = entry.fase ? (FASE_LABEL[entry.fase] ?? entry.fase) : null

  let displayScore = '—'
  if (entry.resultado) {
    const parts = entry.resultado.split('-')
    if (parts.length === 2) {
      displayScore = entry.es_pareja1
        ? `${parts[0]}–${parts[1]}`
        : `${parts[1]}–${parts[0]}`
    }
  }

  const fechaStr = entry.torneo_fecha
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
          {entry.torneo_nombre}{faseLabel ? ` · ${faseLabel}` : ''} · {fechaStr}
        </p>
      </div>
      <span className="font-manrope text-sm font-bold text-navy shrink-0">{displayScore}</span>
    </div>
  )
}

function AmistosoCard({ a }: { a: AmistosoBase }) {
  const fechaStr = a.fecha
    ? new Date(a.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
    : '—'
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0 w-14 text-center rounded-md px-1.5 py-0.5 font-inter text-[10px] font-black uppercase bg-surface text-muted">
        Amist.
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-inter text-xs font-medium text-navy">Amistoso jugado</p>
        <p className="font-inter text-[10px] text-muted">{fechaStr}</p>
      </div>
      <span className="font-manrope text-sm font-bold text-navy shrink-0">—</span>
    </div>
  )
}

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const { data: globalCats } = useCategorias()

  const { data: jugador, isLoading, error } = useQuery({
    queryKey: ['jugador', id],
    queryFn: () =>
      padelApi.get<JugadorExtra[]>(
        `jugadores?select=id,nombre,apodo,categoria,foto_url,lado_preferido,sexo,mixto,frecuencia_semanal,rut,telefono&id=eq.${id}`
      ).then(rows => rows[0] ?? null),
    enabled: !!id,
  })

  // Read historial from torneos.categorias JSON via RPC — has both pairs and correct results
  const { data: historialTorneos = [] } = useQuery({
    queryKey: ['jugador-historial-rpc', id],
    queryFn: () => padelApi.rpc<HistorialEntry[]>('get_player_historial', { p_jugador_id: id }),
    enabled: !!id,
  })

  const { data: amistososRaw = [] } = useQuery({
    queryKey: ['jugador-amistosos', id],
    queryFn: () =>
      padelApi.get<AmistosoBase[]>(
        `partidas_abiertas?select=id,fecha,creador_id,companero_id,jugador3_id,jugador4_id&or=(creador_id.eq.${id},companero_id.eq.${id},jugador3_id.eq.${id},jugador4_id.eq.${id})&estado=eq.jugada&order=fecha.desc&limit=20`
      ),
    enabled: !!id,
  })

  const { data: inscripcionesRaw = [] } = useQuery({
    queryKey: ['jugador-companeros', id],
    queryFn: () => padelApi.get<InscripcionCompanero[]>(
      `inscripciones?select=jugador1_id,jugador2_id,j1:jugadores!jugador1_id(nombre,foto_url),j2:jugadores!jugador2_id(nombre,foto_url)&or=(jugador1_id.eq.${id},jugador2_id.eq.${id})&estado=eq.confirmada`
    ),
    enabled: !!id,
  })

  const { data: rankings } = usePlayerRankings(id)

  const companerosFrecuentes = useMemo(() => {
    const count = new Map<string, { nombre: string; foto_url: string | null; n: number }>()
    for (const ins of inscripcionesRaw) {
      const isJ1 = ins.jugador1_id === id
      const partnerId = isJ1 ? ins.jugador2_id : ins.jugador1_id
      const partnerData = isJ1 ? ins.j2 : ins.j1
      if (!partnerData || !partnerId || partnerId === id) continue
      if (!count.has(partnerId)) count.set(partnerId, { nombre: partnerData.nombre, foto_url: partnerData.foto_url, n: 0 })
      count.get(partnerId)!.n++
    }
    return Array.from(count.entries())
      .map(([pid, data]) => ({ id: pid, ...data }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 3)
  }, [inscripcionesRaw, id])

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando…</div>
  if (error || !jugador) return (
    <div className="p-6 space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted font-inter text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <p className="font-inter text-sm text-muted">Jugador no encontrado.</p>
    </div>
  )

  const cat = globalCats?.find(c => c.id === jugador.categoria || c.nombre === jugador.categoria)
  const headerBg = cat?.color_fondo ?? '#162844'
  const headerText = cat?.color_texto ?? '#ffffff'
  const headerMuted = cat ? `${cat.color_texto}99` : 'rgba(255,255,255,0.5)'
  const avatarBg = cat?.color_borde ?? '#1e3a5f'
  const avatarText = cat?.color_texto ?? '#e8c547'

  const initials = jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const victorias = historialTorneos.filter(e =>
    (e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2)
  ).length
  const totalTorneos = historialTorneos.length
  const totalPartidos = totalTorneos + amistososRaw.length
  const winRate = totalTorneos > 0 ? Math.round((victorias / totalTorneos) * 100) : null

  // Racha: consecutive wins/losses from latest tournament matches
  const rachaResults = historialTorneos.map(e =>
    (e.es_pareja1 && e.ganador === 1) || (!e.es_pareja1 && e.ganador === 2) ? 'v' : 'd'
  )
  const rachaTipo = rachaResults.length > 0 ? rachaResults[0] : null
  let rachaN = 0
  for (const r of rachaResults) { if (r === rachaTipo) rachaN++; else break }
  const racha = rachaN >= 2 ? { tipo: rachaTipo === 'v' ? 'victoria' as const : 'derrota' as const, n: rachaN } : null

  // Merge tournament historial (last 10) and amistosos sorted by date
  const recentAmistosos = amistososRaw.slice(0, 10)
  const showHistorial = historialTorneos.slice(0, 10)

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted font-inter text-sm hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Jugadores
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Header */}
          <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: headerBg }}>
            <div
              className="h-20 w-20 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border-2"
              style={{ background: avatarBg, borderColor: `${headerText}30` }}
            >
              {jugador.foto_url
                ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
                : <span className="font-manrope text-2xl font-bold" style={{ color: avatarText }}>{initials}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {jugador.categoria && (
                  <span
                    className="inline-block px-2 py-0.5 rounded-md font-inter text-[10px] font-black tracking-wider uppercase"
                    style={{ background: `${headerText}20`, color: headerText }}
                  >
                    Cat. {jugador.categoria}
                  </span>
                )}
                {jugador.sexo && (
                  <span className="font-inter text-[10px] uppercase tracking-wider" style={{ color: headerMuted }}>
                    {jugador.sexo === 'M' ? 'Masculino' : 'Femenino'}
                  </span>
                )}
              </div>
              <h1 className="font-manrope text-xl font-extrabold leading-tight truncate" style={{ color: headerText }}>
                {jugador.nombre}
              </h1>
              {jugador.apodo && (
                <p className="font-inter text-sm mt-0.5" style={{ color: headerMuted }}>"{jugador.apodo}"</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white shadow-card p-3 text-center">
              <div className="flex items-center justify-center mb-1"><Trophy className="h-4 w-4 text-gold" /></div>
              {rankings && rankings.length > 0 ? rankings.map(r => (
                <div key={`${r.categoria}_${r.sexo}`}>
                  <p className="font-manrope text-lg font-bold text-navy leading-tight">#{r.posicion}</p>
                  <p className="font-inter text-[9px] text-muted uppercase tracking-wide">{r.categoria} · {r.puntos_total} pts</p>
                </div>
              )) : (
                <>
                  <p className="font-manrope text-xl font-bold text-navy">—</p>
                  <p className="font-inter text-[10px] text-muted uppercase tracking-wide">Ranking</p>
                </>
              )}
            </div>
            <div className="rounded-xl bg-white shadow-card p-3 text-center">
              <div className="flex items-center justify-center mb-1"><Target className="h-4 w-4 text-slate" /></div>
              <p className="font-manrope text-xl font-bold text-navy">{totalPartidos}</p>
              <p className="font-inter text-[10px] text-muted uppercase tracking-wide">Partidos</p>
            </div>
            <div className="rounded-xl bg-white shadow-card p-3 text-center">
              <div className="flex items-center justify-center mb-1"><Percent className="h-4 w-4 text-slate" /></div>
              <p className="font-manrope text-xl font-bold text-navy">{winRate !== null ? `${winRate}%` : '—'}</p>
              <p className="font-inter text-[10px] text-muted uppercase tracking-wide">Victorias</p>
            </div>
          </div>

          {/* Racha */}
          {racha && (
            <div className={`rounded-xl p-3 flex items-center gap-3 ${racha.tipo === 'victoria' ? 'bg-success/10 border border-success/20' : 'bg-defeat/10 border border-defeat/20'}`}>
              <Flame className={`h-5 w-5 shrink-0 ${racha.tipo === 'victoria' ? 'text-success' : 'text-defeat'}`} />
              <div>
                <p className={`font-manrope text-sm font-bold ${racha.tipo === 'victoria' ? 'text-success' : 'text-defeat'}`}>
                  Racha de {racha.n} {racha.tipo === 'victoria' ? (racha.n === 1 ? 'victoria' : 'victorias') : (racha.n === 1 ? 'derrota' : 'derrotas')}
                </p>
                <p className="font-inter text-xs text-muted">Últimos {totalTorneos} torneos registrados</p>
              </div>
            </div>
          )}

          {/* Detalles */}
          <div className="rounded-xl bg-white shadow-card overflow-hidden">
            {[
              { label: 'Lado preferido', value: jugador.lado_preferido ? LADO_LABEL[jugador.lado_preferido] : '—', node: jugador.lado_preferido ? <LadoBadge lado={jugador.lado_preferido} /> : null },
              { label: 'Juega mixto', value: jugador.mixto ? MIXTO_LABEL[jugador.mixto] : '—' },
              ...(jugador.frecuencia_semanal ? [{ label: 'Frecuencia', value: jugador.frecuencia_semanal }] : []),
              ...(jugador.rut ? [{ label: 'RUT', value: jugador.rut as unknown as string }] : []),
              ...(jugador.telefono ? [{
                label: 'Teléfono',
                value: '',
                node: (
                  <a
                    href={`https://wa.me/${jugador.telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-inter text-sm font-medium text-[#25d366] hover:underline"
                  >
                    {jugador.telefono}
                  </a>
                ),
              }] : []),
            ].map(({ label, value, node }, idx, arr) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 ${idx !== arr.length - 1 ? 'border-b border-surface-high' : ''}`}>
                <span className="font-inter text-sm text-muted">{label}</span>
                {node ?? <span className="font-inter text-sm font-medium text-navy">{value}</span>}
              </div>
            ))}
          </div>

          {/* Compañeros frecuentes */}
          {companerosFrecuentes.length > 0 && (
            <div className="rounded-xl bg-white shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-high flex items-center gap-2">
                <Users className="h-4 w-4 text-muted" />
                <p className="font-manrope text-sm font-bold text-navy">Compañeros frecuentes</p>
              </div>
              {companerosFrecuentes.map((c, idx) => {
                const init = c.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== companerosFrecuentes.length - 1 ? 'border-b border-surface-high' : ''}`}>
                    <div className="h-8 w-8 rounded-full bg-navy shrink-0 flex items-center justify-center overflow-hidden">
                      {c.foto_url
                        ? <img src={c.foto_url} alt={c.nombre} className="h-full w-full object-cover" />
                        : <span className="font-manrope text-xs font-bold text-gold">{init}</span>
                      }
                    </div>
                    <p className="flex-1 font-inter text-sm text-navy">{c.nombre}</p>
                    <span className="font-inter text-xs text-muted">{c.n} {c.n === 1 ? 'torneo' : 'torneos'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Últimos partidos */}
          <div className="rounded-xl bg-white shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-high">
              <p className="font-manrope text-sm font-bold text-navy">Últimos partidos</p>
            </div>
            {showHistorial.length === 0 && recentAmistosos.length === 0 ? (
              <p className="px-4 py-6 font-inter text-sm text-muted text-center">Sin partidos jugados aún.</p>
            ) : (
              <div className="divide-y divide-surface-high">
                {showHistorial.map(e => <TorneoCard key={e.match_id} entry={e} />)}
                {recentAmistosos.map(a => <AmistosoCard key={a.id} a={a} />)}
              </div>
            )}
          </div>

          <PuntosDefender jugadorId={id!} />
          <PuntosHistorial jugadorId={id!} />

          {isAdmin && (
            <div className="rounded-xl bg-white shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-high flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted" />
                <p className="font-manrope text-sm font-bold text-navy">Pagos</p>
              </div>
              <div className="p-4">
                <PagosJugador jugadorId={id!} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
