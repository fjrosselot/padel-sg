import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTemporada } from '../../hooks/useTemporada'
import { TIPO_CONFIG } from './tipoConfig'
import EventoCard from './EventoCard'

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  let startDow = (firstDay.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default function Calendario() {
  const { isAdmin } = useAuth()
  const { temporadaSeleccionada } = useTemporada()

  const hoy = new Date()
  const hoyISO = hoy.toISOString().split('T')[0]

  const [vista, setVista] = useState('lista')
  const [mesAno, setMesAno] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() })
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  useEffect(() => { cargar() }, [vista, mesAno, temporadaSeleccionada?.id])

  async function cargar() {
    setCargando(true)
    let query = supabase
      .from('eventos')
      .select('id, titulo, tipo, fecha_inicio, fecha_fin, hora_inicio, todo_dia, ubicacion, inscripcion_abierta, temporada_id')
      .order('fecha_inicio')

    if (vista === 'lista') {
      query = query.gte('fecha_inicio', hoyISO).limit(50)
    } else {
      const { year, month } = mesAno
      const inicio = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const fin = new Date(year, month + 1, 0)
      const finStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`
      query = query.gte('fecha_inicio', inicio).lte('fecha_inicio', finStr)
    }

    if (temporadaSeleccionada?.id) query = query.eq('temporada_id', temporadaSeleccionada.id)

    const { data } = await query
    setEventos(data ?? [])
    setCargando(false)
  }

  const eventosPorDia = {}
  eventos.forEach(e => {
    const d = e.fecha_inicio
    if (!eventosPorDia[d]) eventosPorDia[d] = []
    eventosPorDia[d].push(e)
  })

  function isoDay(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const eventosDiaSeleccionado = diaSeleccionado
    ? (eventosPorDia[isoDay(mesAno.year, mesAno.month, diaSeleccionado)] ?? [])
    : []

  function prevMes() {
    setMesAno(p => { const d = new Date(p.year, p.month - 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }
  function nextMes() {
    setMesAno(p => { const d = new Date(p.year, p.month + 1); return { year: d.getFullYear(), month: d.getMonth() } })
  }

  return (
    <div className="px-5 pt-6 pb-28 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[11px] font-bold text-primary uppercase tracking-[0.15em]">Actividades</p>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface uppercase tracking-tight">
            Calendario
          </h1>
        </div>
        {isAdmin && (
          <Link to="/calendario/nuevo"
            className="shrink-0 editorial-gradient text-on-primary font-headline font-bold text-[0.65rem] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>add</span>
            Evento
          </Link>
        )}
      </div>

      {/* Toggle vista */}
      <div className="flex gap-2">
        {[['lista','Lista'],['mensual','Mensual']].map(([key, label]) => (
          <button key={key}
            onClick={() => { setVista(key); setDiaSeleccionado(null) }}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
              ${vista === key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 font-label text-xs text-on-surface-variant">
            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vista === 'lista' ? (

        /* ── LISTA ── */
        <div className="space-y-2">
          {eventos.length === 0 ? (
            <p className="text-center py-12 text-on-surface-variant text-sm font-medium">
              No hay próximos eventos.{isAdmin && ' Crea el primero con "+ Evento".'}
            </p>
          ) : (
            eventos.map(e => <EventoCard key={e.id} evento={e} />)
          )}
        </div>

      ) : (

        /* ── MENSUAL ── */
        <div className="space-y-3">
          {/* Navegación mes */}
          <div className="flex items-center justify-between bg-surface-container-lowest rounded-2xl shadow-ambient px-5 py-3.5">
            <button onClick={prevMes}
              className="w-9 h-9 rounded-xl hover:bg-surface-container-low text-on-surface-variant flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <span className="font-headline font-black text-on-surface uppercase tracking-wide text-sm">
              {MESES[mesAno.month]} {mesAno.year}
            </span>
            <button onClick={nextMes}
              className="w-9 h-9 rounded-xl hover:bg-surface-container-low text-on-surface-variant flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>

          {/* Grid calendario */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient overflow-hidden">
            {/* Cabecera días */}
            <div className="grid grid-cols-7 bg-surface-container-low/50">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center py-3">
                  <span className="font-label text-[10px] font-bold text-outline uppercase tracking-widest">{d}</span>
                </div>
              ))}
            </div>
            {/* Celdas */}
            <div className="grid grid-cols-7">
              {getCalendarDays(mesAno.year, mesAno.month).map((day, idx) => {
                const iso = day ? isoDay(mesAno.year, mesAno.month, day) : null
                const evs = iso ? (eventosPorDia[iso] ?? []) : []
                const esHoy = day && iso === hoyISO
                const seleccionado = day === diaSeleccionado
                return (
                  <div key={idx}
                    onClick={() => day && setDiaSeleccionado(seleccionado ? null : day)}
                    className={`min-h-[52px] p-1.5 border-b border-r border-outline-variant/10 last:border-r-0
                      ${!day ? 'bg-surface-container-low/20' : 'cursor-pointer hover:bg-surface-container-low/60'}
                      ${seleccionado ? 'bg-primary/5' : ''}`}>
                    {day && (
                      <>
                        <span className={`font-label text-xs font-bold block text-center w-6 h-6 rounded-full mx-auto leading-6
                          ${esHoy ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>
                          {day}
                        </span>
                        <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                          {evs.slice(0, 3).map(e => (
                            <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${TIPO_CONFIG[e.tipo]?.dot ?? 'bg-outline'}`} />
                          ))}
                          {evs.length > 3 && (
                            <span className="font-label text-on-surface-variant text-[9px]">+{evs.length - 3}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Eventos del día seleccionado */}
          {diaSeleccionado && (
            <div className="space-y-2">
              <p className="font-label text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
                {String(diaSeleccionado).padStart(2,'0')}/{String(mesAno.month+1).padStart(2,'0')}/{mesAno.year}
              </p>
              {eventosDiaSeleccionado.length === 0 ? (
                <p className="text-sm text-on-surface-variant bg-surface-container-lowest rounded-xl shadow-ambient p-4">
                  Sin eventos este día.
                </p>
              ) : (
                eventosDiaSeleccionado.map(e => <EventoCard key={e.id} evento={e} compact />)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
