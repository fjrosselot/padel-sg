import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const ESTADO_CONFIG = {
  borrador:    { label: 'Borrador',       cls: 'bg-outline/10 text-outline' },
  inscripcion: { label: 'Inscripciones',  cls: 'bg-primary/10 text-primary' },
  en_curso:    { label: 'En curso',       cls: 'bg-tertiary/10 text-tertiary' },
  finalizado:  { label: 'Finalizado',     cls: 'bg-secondary/10 text-secondary' },
  cancelado:   { label: 'Cancelado',      cls: 'bg-error/10 text-error' },
}

const FORMATO_LABEL = {
  grupos_eliminatoria: 'Grupos + Elim.',
  round_robin:         'Round Robin',
  eliminacion_directa: 'Elim. Directa',
}

function TorneoCard({ torneo }) {
  const cfg = ESTADO_CONFIG[torneo.estado] ?? ESTADO_CONFIG.borrador
  const fmtFecha = iso => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <Link to={`/torneos/${torneo.id}`}
      className="block bg-surface-container-lowest rounded-xl shadow-ambient p-5 hover:bg-surface-container-low transition-colors active:scale-[0.99]">

      {/* Estado + Temporada */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`font-label text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.cls}`}>
          {cfg.label}
        </span>
        {torneo.temporadas?.nombre && (
          <span className="font-label text-[10px] text-on-surface-variant">{torneo.temporadas.nombre}</span>
        )}
      </div>

      {/* Nombre */}
      <p className="font-headline font-extrabold text-on-surface uppercase tracking-tight text-sm leading-tight">
        {torneo.nombre}
      </p>

      {/* Fechas */}
      {torneo.fecha_inicio && (
        <div className="flex items-center gap-1.5 mt-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <p className="font-label text-xs font-medium">
            {fmtFecha(torneo.fecha_inicio)}
            {torneo.fecha_fin ? ` — ${fmtFecha(torneo.fecha_fin)}` : ''}
          </p>
        </div>
      )}

      {/* Pills info */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="font-label text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant rounded-full px-2.5 py-1">
          {FORMATO_LABEL[torneo.formato] ?? torneo.formato}
        </span>
        <span className="font-label text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant rounded-full px-2.5 py-1">
          {torneo.max_parejas} parejas
        </span>
      </div>
    </Link>
  )
}

export default function TorneosList() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [torneos, setTorneos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('activos')

  useEffect(() => {
    setCargando(true)
    let q = supabase
      .from('torneos')
      .select('id, nombre, formato, max_parejas, estado, fecha_inicio, fecha_fin, temporada_id, temporadas(nombre)')
      .order('fecha_inicio', { ascending: false })

    if (filtro === 'activos') q = q.in('estado', ['inscripcion', 'en_curso', 'borrador'])

    q.then(({ data }) => { setTorneos(data ?? []); setCargando(false) })
  }, [filtro])

  return (
    <div className="px-5 pt-6 pb-28 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[11px] font-bold text-primary uppercase tracking-[0.15em]">Competición</p>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface uppercase tracking-tight">
            Torneos
          </h1>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/torneos/nuevo')}
            className="shrink-0 editorial-gradient text-on-primary font-headline font-bold text-[0.65rem] uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>add</span>
            Nuevo
          </button>
        )}
      </div>

      {/* Filtro pills */}
      <div className="flex gap-2">
        {[['activos','Activos'],['todos','Todos']].map(([key, label]) => (
          <button key={key} onClick={() => setFiltro(key)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
              ${filtro === key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : torneos.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant text-sm font-medium">
          {filtro === 'activos' ? 'No hay torneos activos.' : 'No hay torneos registrados.'}
        </p>
      ) : (
        <div className="space-y-3">
          {torneos.map(t => <TorneoCard key={t.id} torneo={t} />)}
        </div>
      )}
    </div>
  )
}
