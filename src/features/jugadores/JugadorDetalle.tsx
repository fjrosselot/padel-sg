import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Trophy, Target, Percent } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Jugador } from '../../lib/supabase'
import { PuntosHistorial } from '../ranking/PuntosHistorial'

const LADO_LABEL: Record<string, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
}

const MIXTO_LABEL: Record<string, string> = {
  si: 'Sí',
  no: 'No',
  a_veces: 'A veces',
}

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
  // jugadores nombres para mostrar
  p1j1_nombre?: string
  p1j2_nombre?: string
  p2j1_nombre?: string
  p2j2_nombre?: string
}

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: jugador, isLoading, error } = useQuery({
    queryKey: ['jugador', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, categoria, elo, foto_url, lado_preferido, sexo, mixto, gradualidad, frecuencia_semanal')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Jugador & { frecuencia_semanal?: string | null; gradualidad?: string | null; mixto?: string | null }
    },
    enabled: !!id,
  })

  const { data: historial } = useQuery({
    queryKey: ['jugador-historial', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('partidos')
        .select('id, fecha, tipo, ganador, resultado, pareja1_j1, pareja1_j2, pareja2_j1, pareja2_j2, sets_pareja1, sets_pareja2')
        .or(`pareja1_j1.eq.${id},pareja1_j2.eq.${id},pareja2_j1.eq.${id},pareja2_j2.eq.${id}`)
        .eq('estado', 'jugado')
        .order('fecha', { ascending: false })
        .limit(10)
      if (error) throw error
      return data as PartidoHistorial[]
    },
    enabled: !!id,
  })

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

  // Stats calculadas del historial
  const totalPartidos = historial?.length ?? 0
  const victorias = historial?.filter(p => {
    const enPareja1 = p.pareja1_j1 === id || p.pareja1_j2 === id
    return (enPareja1 && p.ganador === 1) || (!enPareja1 && p.ganador === 2)
  }).length ?? 0
  const winRate = totalPartidos > 0 ? Math.round((victorias / totalPartidos) * 100) : null

  return (
    <div className="space-y-4">

      {/* Volver */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted font-inter text-sm hover:text-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Jugadores
      </button>

      {/* Header card */}
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
          <h1 className="font-manrope text-xl font-extrabold text-white leading-tight truncate">
            {jugador.nombre}
          </h1>
          {jugador.apodo && (
            <p className="font-inter text-sm text-white/50 mt-0.5">"{jugador.apodo}"</p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white shadow-card p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="h-4 w-4 text-gold" />
          </div>
          <p className="font-manrope text-xl font-bold text-navy">{jugador.elo}</p>
          <p className="font-inter text-[10px] text-muted uppercase tracking-wide">ELO</p>
        </div>
        <div className="rounded-xl bg-white shadow-card p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="h-4 w-4 text-slate" />
          </div>
          <p className="font-manrope text-xl font-bold text-navy">{totalPartidos}</p>
          <p className="font-inter text-[10px] text-muted uppercase tracking-wide">Partidos</p>
        </div>
        <div className="rounded-xl bg-white shadow-card p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Percent className="h-4 w-4 text-slate" />
          </div>
          <p className="font-manrope text-xl font-bold text-navy">
            {winRate !== null ? `${winRate}%` : '—'}
          </p>
          <p className="font-inter text-[10px] text-muted uppercase tracking-wide">Victorias</p>
        </div>
      </div>

      {/* Detalles */}
      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {[
          { label: 'Lado preferido', value: jugador.lado_preferido ? LADO_LABEL[jugador.lado_preferido] : '—' },
          { label: 'Juega mixto', value: jugador.mixto ? MIXTO_LABEL[jugador.mixto] : '—' },
          ...(jugador.frecuencia_semanal ? [{ label: 'Frecuencia', value: jugador.frecuencia_semanal }] : []),
        ].map(({ label, value }, idx, arr) => (
          <div
            key={label}
            className={`flex items-center justify-between px-4 py-3 ${idx !== arr.length - 1 ? 'border-b border-surface-high' : ''}`}
          >
            <span className="font-inter text-sm text-muted">{label}</span>
            <span className="font-inter text-sm font-medium text-navy">{value}</span>
          </div>
        ))}
      </div>

      {/* Historial de partidos */}
      {historial && historial.length > 0 && (
        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-high">
            <p className="font-manrope text-sm font-bold text-navy">Historial reciente</p>
          </div>
          {historial.map((p, idx) => {
            const enPareja1 = p.pareja1_j1 === id || p.pareja1_j2 === id
            const gano = (enPareja1 && p.ganador === 1) || (!enPareja1 && p.ganador === 2)
            const score = p.sets_pareja1 !== null && p.sets_pareja2 !== null
              ? enPareja1
                ? `${p.sets_pareja1}–${p.sets_pareja2}`
                : `${p.sets_pareja2}–${p.sets_pareja1}`
              : p.resultado ?? '—'
            const fechaStr = p.fecha
              ? new Date(p.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
              : '—'
            const tipoLabel = { torneo: 'Torneo', amistoso: 'Amistoso', liga: 'Liga' }[p.tipo] ?? p.tipo

            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx !== historial.length - 1 ? 'border-b border-surface-high' : ''}`}
              >
                <span className={`shrink-0 w-14 text-center rounded-md px-2 py-0.5 font-inter text-[10px] font-black uppercase ${
                  p.ganador === null ? 'bg-surface text-muted' :
                  gano ? 'bg-success/10 text-success' : 'bg-defeat/10 text-defeat'
                }`}>
                  {p.ganador === null ? 'Pend.' : gano ? 'Victoria' : 'Derrota'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-xs font-medium text-navy">{tipoLabel}</p>
                  <p className="font-inter text-[10px] text-muted">{fechaStr}</p>
                </div>
                <span className="font-manrope text-sm font-bold text-navy shrink-0">{score}</span>
              </div>
            )
          })}
        </div>
      )}

      {historial && historial.length === 0 && (
        <div className="rounded-xl bg-white shadow-card p-6 text-center">
          <p className="font-inter text-sm text-muted">Sin partidos jugados aún.</p>
        </div>
      )}

      {/* Historial de puntos de ranking */}
      <PuntosHistorial jugadorId={id!} />
    </div>
  )
}
