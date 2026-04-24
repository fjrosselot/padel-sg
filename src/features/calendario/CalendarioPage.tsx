import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CalendarDays, List, Trophy, Swords, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'
import { padelApi } from '../../lib/padelApi'
import { buildCatColorMap } from '../torneos/catColors'
import type { Database } from '../../lib/types/database.types'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

type TorneoRow = Database['padel']['Tables']['torneos']['Row']
type LigaRow = Database['padel']['Tables']['ligas']['Row']
type TorneoItem = Pick<TorneoRow, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado' | 'tipo' | 'categorias' | 'colegio_rival' | 'ambito'>
type LigaItem = Pick<LigaRow, 'id' | 'nombre' | 'fecha_inicio' | 'fecha_fin' | 'estado'>

interface Evento {
  id: string
  nombre: string
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: string
  kind: 'torneo' | 'liga'
  // torneo only
  tipo?: string
  categorias?: unknown
  colegio_rival?: string | null
  ambito?: string
}

const ESTADO_COLOR: Record<string, string> = {
  inscripcion: 'bg-gold/15 text-gold border-gold/30',
  en_curso: 'bg-success/15 text-success border-success/30',
  finalizado: 'bg-surface-high text-muted border-transparent',
}

const ESTADO_LABEL: Record<string, string> = {
  inscripcion: 'Inscripción',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
}

const TIPO_LABEL: Record<string, string> = {
  interno: 'Interno',
  vs_colegio: 'vs Colegio',
  externo: 'Externo',
}

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

function isMiPartido(p: PartidoFixture, uid: string): boolean {
  return [p.pareja1?.jugador1_id, p.pareja1?.jugador2_id, p.pareja2?.jugador1_id, p.pareja2?.jugador2_id]
    .includes(uid)
}

function categoriasCount(categorias: unknown): number {
  if (!Array.isArray(categorias)) return 0
  return categorias.length
}

function categoriasLabel(categorias: unknown): string {
  if (!Array.isArray(categorias) || categorias.length === 0) return ''
  const nombres = categorias
    .slice(0, 3)
    .map((c: Record<string, string>) => c.nombre ?? c.sexo ?? '')
    .filter(Boolean)
  const suffix = categorias.length > 3 ? ` +${categorias.length - 3}` : ''
  return nombres.join(' · ') + suffix
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function buildEventsByDay(eventos: Evento[]): Map<string, Evento[]> {
  const map = new Map<string, Evento[]>()
  for (const ev of eventos) {
    if (!ev.fecha_inicio) continue
    const start = new Date(ev.fecha_inicio + 'T00:00:00')
    const end = ev.fecha_fin ? new Date(ev.fecha_fin + 'T00:00:00') : start
    const cur = new Date(start)
    while (cur <= end) {
      const key = toDateStr(cur)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}

function EventoCard({ ev }: { ev: Evento }) {
  const navigate = useNavigate()
  const href = ev.kind === 'torneo' ? `/torneos/${ev.id}` : `/ligas/${ev.id}`
  const cats = categoriasLabel(ev.categorias)
  const nCats = categoriasCount(ev.categorias)

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="w-full text-left rounded-xl bg-white shadow-card p-4 space-y-2 hover:shadow-card-hover transition-shadow active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {ev.kind === 'torneo'
            ? <Trophy className="h-4 w-4 text-gold shrink-0" />
            : <Swords className="h-4 w-4 text-navy/50 shrink-0" />
          }
          <p className="font-manrope text-sm font-bold text-navy truncate">{ev.nombre}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 font-inter text-[11px] font-semibold ${
          ESTADO_COLOR[ev.estado] ?? 'bg-surface text-muted border-transparent'
        }`}>
          {ESTADO_LABEL[ev.estado] ?? ev.estado}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {ev.fecha_inicio && (
          <span className="font-inter text-xs text-muted">
            {new Date(ev.fecha_inicio + 'T00:00:00').toLocaleDateString('es-CL', {
              day: 'numeric', month: 'short', timeZone: 'America/Santiago',
            })}
            {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && (
              ` → ${new Date(ev.fecha_fin + 'T00:00:00').toLocaleDateString('es-CL', {
                day: 'numeric', month: 'short', timeZone: 'America/Santiago',
              })}`
            )}
          </span>
        )}
        {ev.kind === 'torneo' && ev.tipo && (
          <span className="font-inter text-[11px] text-slate bg-surface-high rounded px-1.5 py-0.5">
            {ev.colegio_rival ? `vs ${ev.colegio_rival}` : (TIPO_LABEL[ev.tipo] ?? ev.tipo)}
          </span>
        )}
        {ev.kind === 'torneo' && nCats > 0 && (
          <span className="font-inter text-[11px] text-slate bg-surface-high rounded px-1.5 py-0.5">
            {nCats} {nCats === 1 ? 'categoría' : 'categorías'}
          </span>
        )}
      </div>

      {ev.kind === 'torneo' && cats && (
        <p className="font-inter text-[11px] text-muted truncate">{cats}</p>
      )}
    </button>
  )
}

function VistaCalendario({ eventos }: { eventos: Evento[] }) {
  const hoy = new Date()
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const eventsByDay = useMemo(() => buildEventsByDay(eventos), [eventos])

  const diasDelMes = useMemo(() => {
    const days: (Date | null)[] = []
    const first = new Date(mes.getFullYear(), mes.getMonth(), 1)
    // Monday-first: getDay() returns 0=Sun, so offset = (getDay()+6)%7
    const offset = (first.getDay() + 6) % 7
    for (let i = 0; i < offset; i++) days.push(null)
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= total; d++) days.push(new Date(mes.getFullYear(), mes.getMonth(), d))
    return days
  }, [mes])

  const mesNombre = mes.toLocaleDateString('es-CL', { month: 'long', timeZone: 'America/Santiago' })
  const mesLabel = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1) + ' ' + mes.getFullYear()
  const hoyStr = toDateStr(hoy)

  const eventosDia = diaSeleccionado ? (eventsByDay.get(diaSeleccionado) ?? []) : []

  return (
    <div className="space-y-4">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-card px-4 py-3">
        <button type="button" onClick={() => setMes(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-navy transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-manrope text-sm font-bold text-navy">{mesLabel}</p>
        <button type="button" onClick={() => setMes(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-navy transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Grilla */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {/* Header días */}
        <div className="grid grid-cols-7 border-b border-surface-high">
          {DIAS.map(d => (
            <div key={d} className="py-2 text-center font-inter text-[11px] font-bold uppercase tracking-wider text-muted">
              {d}
            </div>
          ))}
        </div>
        {/* Celdas */}
        <div className="grid grid-cols-7">
          {diasDelMes.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-12 border-b border-r border-surface-high/50 last:border-r-0" />
            const key = toDateStr(day)
            const evs = eventsByDay.get(key) ?? []
            const isHoy = key === hoyStr
            const isSelected = key === diaSeleccionado
            const hasEvents = evs.length > 0

            return (
              <button
                key={key}
                type="button"
                onClick={() => setDiaSeleccionado(isSelected ? null : key)}
                className={`relative h-12 flex flex-col items-center justify-start pt-1.5 gap-0.5 border-b border-r border-surface-high/50 last:border-r-0 transition-colors ${
                  isSelected ? 'bg-navy' : hasEvents ? 'hover:bg-gold/5' : 'hover:bg-surface'
                }`}
              >
                <span className={`font-inter text-xs font-semibold leading-none ${
                  isSelected ? 'text-white' : isHoy ? 'text-gold font-bold' : hasEvents ? 'text-navy' : 'text-muted'
                }`}>
                  {day.getDate()}
                </span>
                {hasEvents && (
                  <div className="flex gap-0.5 justify-center">
                    {evs.slice(0, 3).map((ev, j) => (
                      <span key={j} className={`h-1 w-1 rounded-full ${
                        isSelected ? 'bg-gold' : ev.kind === 'torneo' ? 'bg-gold' : 'bg-navy/40'
                      }`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Eventos del día seleccionado */}
      {diaSeleccionado && (
        <div className="space-y-2">
          <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">
            {new Date(diaSeleccionado + 'T00:00:00').toLocaleDateString('es-CL', {
              weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
            })}
          </p>
          {eventosDia.length === 0
            ? <p className="font-inter text-sm text-muted">Sin eventos este día.</p>
            : eventosDia.map(ev => <EventoCard key={ev.id} ev={ev} />)
          }
        </div>
      )}
    </div>
  )
}

function VistaLista({ eventos }: { eventos: Evento[] }) {
  const proximos = eventos.filter(ev => ev.estado !== 'finalizado')
  const pasados = eventos.filter(ev => ev.estado === 'finalizado')

  return (
    <div className="space-y-5">
      {proximos.length > 0 && (
        <div className="space-y-2">
          <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Próximos y en curso</p>
          {proximos.map(ev => <EventoCard key={ev.id} ev={ev} />)}
        </div>
      )}
      {proximos.length === 0 && (
        <div className="rounded-xl bg-white shadow-card p-6 text-center">
          <p className="font-inter text-sm text-muted">No hay torneos ni ligas próximas.</p>
        </div>
      )}
      {pasados.length > 0 && (
        <div className="space-y-2">
          <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">Finalizados</p>
          {pasados.map(ev => <EventoCard key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  )
}

type MisPartidosGrupo = {
  torneoId: string
  torneoNombre: string
  fechaLabel: string
  dateKey: string
  catNombre: string
  catBg: string
  catDot: string
  partidos: PartidoFixture[]
}

function MisPartidosView({ grupos }: { grupos: MisPartidosGrupo[] }) {
  const navigate = useNavigate()

  if (grupos.length === 0) return (
    <div className="rounded-xl bg-white shadow-card p-6 text-center">
      <p className="font-inter text-sm text-muted">No tienes partidos programados en torneos activos.</p>
    </div>
  )

  const byDate = new Map<string, MisPartidosGrupo[]>()
  for (const g of grupos) {
    if (!byDate.has(g.dateKey)) byDate.set(g.dateKey, [])
    byDate.get(g.dateKey)!.push(g)
  }
  const sortedDates = [...byDate.keys()].sort()

  return (
    <div className="space-y-5">
      {sortedDates.map(date => (
        <div key={date} className="space-y-2">
          <p className="font-inter text-xs font-semibold uppercase tracking-widest text-muted">
            {byDate.get(date)![0].fechaLabel}
          </p>
          {byDate.get(date)!.map((g, i) => (
            <button
              key={i}
              type="button"
              onClick={() => navigate(`/torneos/${g.torneoId}`)}
              className="w-full text-left rounded-xl bg-white shadow-card overflow-hidden hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: g.catBg }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.catDot }} />
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-[11px] font-semibold text-navy truncate">{g.torneoNombre}</p>
                  <p className="font-inter text-[10px] text-muted">{g.catNombre}</p>
                </div>
              </div>
              <div className="px-4">
                {g.partidos.slice(0, 3).map((p, pi) => (
                  <div key={pi} className="flex items-center gap-3 py-2 border-b border-surface-high last:border-0">
                    <div className="shrink-0 text-center" style={{ minWidth: 40 }}>
                      <p className="font-manrope text-[13px] font-bold text-navy">{p.turno ?? '--:--'}</p>
                      {p.cancha != null && <p className="font-inter text-[10px] text-muted">C{p.cancha}</p>}
                    </div>
                    <div className="w-px h-7 bg-navy/10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-inter text-[10px] text-muted mb-0.5">{p.fase === 'grupo' ? `P-${p.numero}` : p.fase}</p>
                      <p className="font-inter text-[12px] truncate text-slate">
                        {[p.pareja1, p.pareja2].map(pr => pr?.nombre).filter(Boolean).join(' vs ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function CalendarioPage() {
  const [vista, setVista] = useState<'calendario' | 'lista'>('lista')
  const [modo, setModo] = useState<'todos' | 'mis'>('todos')
  const { data: user } = useUser()

  const { data: torneos = [] } = useQuery({
    queryKey: ['calendario-torneos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('torneos')
        .select('id, nombre, fecha_inicio, fecha_fin, estado, tipo, categorias, colegio_rival, ambito')
        .neq('estado', 'borrador')
        .order('fecha_inicio', { ascending: true })
      if (error) throw error
      return data as TorneoItem[]
    },
  })

  const { data: ligas = [] } = useQuery({
    queryKey: ['calendario-ligas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('ligas')
        .select('id, nombre, fecha_inicio, fecha_fin, estado')
        .neq('estado', 'borrador')
        .order('fecha_inicio', { ascending: true })
      if (error) throw error
      return data as LigaItem[]
    },
  })

  const { data: misPartidosGrupos = [] } = useQuery({
    queryKey: ['mis-partidos-cal', user?.id],
    enabled: !!user?.id && modo === 'mis',
    queryFn: async () => {
      const fetchedTorneos = await padelApi.get<{ id: string; nombre: string; fecha_inicio: string | null; categorias: unknown }[]>(
        'torneos?estado=in.(en_curso,inscripcion)&select=id,nombre,fecha_inicio,categorias&order=fecha_inicio.asc'
      )
      const result: MisPartidosGrupo[] = []
      for (const torneo of fetchedTorneos) {
        const cats = (torneo.categorias as unknown as CategoriaFixture[]).filter(
          (c): c is CategoriaFixture => Array.isArray((c as CategoriaFixture).grupos) || Array.isArray((c as CategoriaFixture).partidos)
        )
        if (cats.length === 0) continue
        const colorMap = buildCatColorMap(cats.map(c => c.nombre))
        const dateKey = torneo.fecha_inicio ?? ''
        const fechaLabel = dateKey ? new Date(dateKey + 'T00:00:00').toLocaleDateString('es-CL', {
          weekday: 'short', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
        }) : 'Sin fecha'
        for (const cat of cats) {
          const todos: PartidoFixture[] = [
            ...(cat.grupos ?? []).flatMap(g => g.partidos),
            ...cat.faseEliminatoria,
            ...cat.consola,
            ...(cat.partidos ?? []),
          ]
          const misPartidos = todos.filter(p => !p.ganador && isMiPartido(p, user!.id))
          if (misPartidos.length > 0) {
            result.push({
              torneoId: torneo.id,
              torneoNombre: torneo.nombre,
              fechaLabel,
              dateKey,
              catNombre: cat.nombre,
              catBg: colorMap.get(cat.nombre)?.bg ?? '#f1f5f9',
              catDot: colorMap.get(cat.nombre)?.dot ?? '#94b0cc',
              partidos: misPartidos,
            })
          }
        }
      }
      return result
    },
  })

  const eventos: Evento[] = useMemo(() => {
    const ts: Evento[] = torneos.map(t => ({
      id: t.id,
      nombre: t.nombre,
      fecha_inicio: t.fecha_inicio,
      fecha_fin: t.fecha_fin,
      estado: t.estado,
      kind: 'torneo' as const,
      tipo: t.tipo,
      categorias: t.categorias,
      colegio_rival: t.colegio_rival,
      ambito: t.ambito,
    }))
    const ls: Evento[] = ligas.map(l => ({
      id: l.id,
      nombre: l.nombre,
      fecha_inicio: l.fecha_inicio,
      fecha_fin: l.fecha_fin,
      estado: l.estado,
      kind: 'liga' as const,
    }))
    return [...ts, ...ls].sort((a, b) => {
      if (!a.fecha_inicio) return 1
      if (!b.fecha_inicio) return -1
      return a.fecha_inicio.localeCompare(b.fecha_inicio)
    })
  }, [torneos, ligas])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-manrope text-2xl font-bold text-navy">Calendario</h1>
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex rounded-lg border border-navy/15 bg-white overflow-hidden shadow-card">
              <button
                type="button"
                onClick={() => setModo('todos')}
                className={`flex items-center gap-1.5 px-3 py-2 transition-colors font-inter text-xs font-semibold ${modo === 'todos' ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setModo('mis')}
                className={`flex items-center gap-1.5 px-3 py-2 transition-colors font-inter text-xs font-semibold ${modo === 'mis' ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}
              >
                <User className="h-3.5 w-3.5" />
                Mis partidos
              </button>
            </div>
          )}
          {modo === 'todos' && (
            <div className="flex md:hidden rounded-lg border border-navy/15 bg-white overflow-hidden shadow-card">
              <button
                type="button"
                onClick={() => setVista('lista')}
                className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                  vista === 'lista' ? 'bg-navy text-white' : 'text-muted hover:text-navy'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="font-inter text-xs font-semibold">Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setVista('calendario')}
                className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${
                  vista === 'calendario' ? 'bg-navy text-white' : 'text-muted hover:text-navy'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span className="font-inter text-xs font-semibold">Mes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {modo === 'mis' ? (
        <MisPartidosView grupos={misPartidosGrupos} />
      ) : (
        <>
          {/* Desktop: ambas vistas lado a lado */}
          <div className="hidden md:grid md:grid-cols-[1fr_360px] md:gap-6 md:items-start">
            <VistaCalendario eventos={eventos} />
            <VistaLista eventos={eventos} />
          </div>

          {/* Mobile: una vista a la vez */}
          <div className="md:hidden">
            {vista === 'lista'
              ? <VistaLista eventos={eventos} />
              : <VistaCalendario eventos={eventos} />
            }
          </div>
        </>
      )}
    </div>
  )
}
