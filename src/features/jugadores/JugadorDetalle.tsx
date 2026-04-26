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

const LADO_LABEL: Record<string, string> = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }
const MIXTO_LABEL: Record<string, string> = { si: 'Sí', no: 'No', a_veces: 'A veces' }

interface JugadorNombre { nombre: string; apodo: string | null }

interface PartidoHistorial {
  id: string
  fecha: string | null
  tipo: string
  ganador: 1 | 2 | null
  resultado: string | null
  pareja1_j1: string | null
  pareja1_j2: string | null
  pareja2_j1: string | null
  pareja2_j2: string | null
  sets_pareja1: number | null
  sets_pareja2: number | null
  p1j1: JugadorNombre | null
  p1j2: JugadorNombre | null
  p2j1: JugadorNombre | null
  p2j2: JugadorNombre | null
}

interface AmistosoRaw {
  id: string
  fecha: string | null
  creador_id: string | null
  companero_id: string | null
  jugador3_id: string | null
  jugador4_id: string | null
  creador: JugadorNombre | null
  companero: JugadorNombre | null
  jugador3: JugadorNombre | null
  jugador4: JugadorNombre | null
}

interface InscripcionCompanero {
  jugador1_id: string
  jugador2_id: string
  j1: { nombre: string; foto_url: string | null } | null
  j2: { nombre: string; foto_url: string | null } | null
}

type JugadorExtra = Jugador & {
  rut?: string | null
}

function nombreCorto(nombre: string) {
  const parts = nombre.trim().split(' ').filter(Boolean)
  if (parts.length <= 1) return nombre
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function calcularRacha(historial: PartidoHistorial[], jugadorId: string): { tipo: 'victoria' | 'derrota'; n: number } | null {
  const torneos = historial.filter(p => p.tipo !== 'amistoso')
  const results = torneos.map(p => {
    if (p.ganador === null) return null
    const enP1 = p.pareja1_j1 === jugadorId || p.pareja1_j2 === jugadorId
    return (enP1 && p.ganador === 1) || (!enP1 && p.ganador === 2) ? 'victoria' as const : 'derrota' as const
  }).filter(Boolean) as ('victoria' | 'derrota')[]
  if (results.length === 0) return null
  const tipo = results[0]
  let n = 0
  for (const r of results) { if (r === tipo) n++; else break }
  return n >= 2 ? { tipo, n } : null
}

function PartidoCard({ p, jugadorId }: { p: PartidoHistorial; jugadorId: string }) {
  const enP1 = p.pareja1_j1 === jugadorId || p.pareja1_j2 === jugadorId
  const gano = p.ganador !== null && ((enP1 && p.ganador === 1) || (!enP1 && p.ganador === 2))
  const isAmistoso = p.tipo === 'amistoso'
  const score = p.sets_pareja1 !== null && p.sets_pareja2 !== null
    ? enP1 ? `${p.sets_pareja1}–${p.sets_pareja2}` : `${p.sets_pareja2}–${p.sets_pareja1}`
    : p.resultado ?? '—'
  const fechaStr = p.fecha
    ? new Date(p.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
    : '—'
  const tipoLabel = ({ torneo: 'Torneo', amistoso: 'Amistoso', liga: 'Liga' } as Record<string, string>)[p.tipo] ?? p.tipo
  const rivalJ1 = enP1 ? p.p2j1 : p.p1j1
  const rivalJ2 = enP1 ? p.p2j2 : p.p1j2
  const rivalStr = [rivalJ1, rivalJ2].filter(Boolean).map(j => nombreCorto(j!.nombre)).join(' / ') || '—'

  const badgeClass = isAmistoso
    ? 'bg-surface text-muted'
    : p.ganador === null
      ? 'bg-surface text-muted'
      : gano ? 'bg-success/10 text-success' : 'bg-defeat/10 text-defeat'

  const badgeLabel = isAmistoso
    ? 'Amist.'
    : p.ganador === null ? 'Pend.' : gano ? 'Victoria' : 'Derrota'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`shrink-0 w-14 text-center rounded-md px-1.5 py-0.5 font-inter text-[10px] font-black uppercase ${badgeClass}`}>
        {badgeLabel}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-inter text-xs font-medium text-navy truncate">vs {rivalStr}</p>
        <p className="font-inter text-[10px] text-muted">{tipoLabel} · {fechaStr}</p>
      </div>
      <span className="font-manrope text-sm font-bold text-navy shrink-0">{isAmistoso ? '—' : score}</span>
    </div>
  )
}

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const { data: jugador, isLoading, error } = useQuery({
    queryKey: ['jugador', id],
    queryFn: () =>
      padelApi.get<JugadorExtra[]>(
        `jugadores?select=id,nombre,apodo,categoria,foto_url,lado_preferido,sexo,mixto,frecuencia_semanal,rut,telefono&id=eq.${id}`
      ).then(rows => rows[0] ?? null),
    enabled: !!id,
  })

  const { data: torneosHistorial = [] } = useQuery({
    queryKey: ['jugador-historial', id],
    queryFn: () =>
      padelApi.get<PartidoHistorial[]>(
        `partidos?select=id,fecha,tipo,ganador,resultado,pareja1_j1,pareja1_j2,pareja2_j1,pareja2_j2,sets_pareja1,sets_pareja2,p1j1:jugadores!pareja1_j1(nombre,apodo),p1j2:jugadores!pareja1_j2(nombre,apodo),p2j1:jugadores!pareja2_j1(nombre,apodo),p2j2:jugadores!pareja2_j2(nombre,apodo)&or=(pareja1_j1.eq.${id},pareja1_j2.eq.${id},pareja2_j1.eq.${id},pareja2_j2.eq.${id})&estado=eq.jugado&order=fecha.desc&limit=20`
      ),
    enabled: !!id,
  })

  const { data: amistososRaw = [] } = useQuery({
    queryKey: ['jugador-amistosos', id],
    queryFn: () =>
      padelApi.get<AmistosoRaw[]>(
        `partidas_abiertas?select=id,fecha,creador_id,companero_id,jugador3_id,jugador4_id,creador:jugadores!creador_id(nombre,apodo),companero:jugadores!companero_id(nombre,apodo),jugador3:jugadores!jugador3_id(nombre,apodo),jugador4:jugadores!jugador4_id(nombre,apodo)&or=(creador_id.eq.${id},companero_id.eq.${id},jugador3_id.eq.${id},jugador4_id.eq.${id})&estado=eq.jugada&order=fecha.desc&limit=20`
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

  const historial = useMemo((): PartidoHistorial[] => {
    const amistososMapped: PartidoHistorial[] = amistososRaw.map(a => ({
      id: a.id,
      fecha: a.fecha,
      tipo: 'amistoso',
      ganador: null,
      resultado: null,
      pareja1_j1: a.creador_id,
      pareja1_j2: a.companero_id,
      pareja2_j1: a.jugador3_id,
      pareja2_j2: a.jugador4_id,
      sets_pareja1: null,
      sets_pareja2: null,
      p1j1: a.creador,
      p1j2: a.companero,
      p2j1: a.jugador3,
      p2j2: a.jugador4,
    }))
    return [...torneosHistorial, ...amistososMapped]
      .sort((a, b) => {
        if (!a.fecha) return 1
        if (!b.fecha) return -1
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      })
      .slice(0, 10)
  }, [torneosHistorial, amistososRaw])

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

  const initials = jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const torneosJugados = torneosHistorial.length
  const totalPartidos = historial.length
  const victorias = torneosHistorial.filter(p => {
    const enP1 = p.pareja1_j1 === id || p.pareja1_j2 === id
    return (enP1 && p.ganador === 1) || (!enP1 && p.ganador === 2)
  }).length
  const winRate = torneosJugados > 0 ? Math.round((victorias / torneosJugados) * 100) : null
  const racha = calcularRacha(historial, id!)

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
          <div className="rounded-xl bg-navy p-5 flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl shrink-0 bg-navy-mid flex items-center justify-center overflow-hidden border-2 border-white/10">
              {jugador.foto_url
                ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
                : <span className="font-manrope text-2xl font-bold text-gold">{initials}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {jugador.categoria && (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-gold/20 text-gold font-inter text-[10px] font-black tracking-wider uppercase">
                    Cat. {jugador.categoria}
                  </span>
                )}
                {jugador.sexo && (
                  <span className="font-inter text-[10px] text-white/50 uppercase tracking-wider">
                    {jugador.sexo === 'M' ? 'Masculino' : 'Femenino'}
                  </span>
                )}
              </div>
              <h1 className="font-manrope text-xl font-extrabold text-white leading-tight truncate">{jugador.nombre}</h1>
              {jugador.apodo && <p className="font-inter text-sm text-white/50 mt-0.5">"{jugador.apodo}"</p>}
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
                <p className="font-inter text-xs text-muted">De los últimos {torneosJugados} torneos registrados</p>
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
            {historial.length > 0
              ? historial.map((p, idx) => (
                <div key={p.id} className={idx !== historial.length - 1 ? 'border-b border-surface-high' : ''}>
                  <PartidoCard p={p} jugadorId={id!} />
                </div>
              ))
              : <p className="px-4 py-6 font-inter text-sm text-muted text-center">Sin partidos jugados aún.</p>
            }
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
