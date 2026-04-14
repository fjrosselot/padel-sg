import { Link } from 'react-router-dom'
import { TIPO_CONFIG, formatFechaUI, formatHora } from './tipoConfig'

export default function EventoCard({ evento, compact = false }) {
  const cfg = TIPO_CONFIG[evento.tipo] ?? TIPO_CONFIG.otro

  const fechaDisplay = evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio
    ? `${formatFechaUI(evento.fecha_inicio)} – ${formatFechaUI(evento.fecha_fin)}`
    : formatFechaUI(evento.fecha_inicio)

  const horaDisplay = !evento.todo_dia && evento.hora_inicio
    ? formatHora(evento.hora_inicio)
    : null

  return (
    <Link to={`/calendario/${evento.id}`}
      className="flex items-start gap-3.5 bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition">

      {/* Dot de color con borde */}
      <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ${cfg.dot}`}
        style={{ ringColor: 'currentColor' }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-gray-800 truncate text-sm">{evento.titulo}</p>
          {evento.inscripcion_abierta && (
            <span className="shrink-0 rounded-full bg-green-100 text-green-700 text-xs px-2.5 py-0.5 font-semibold">
              Inscripción
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`rounded-full text-xs px-2.5 py-0.5 font-semibold ${cfg.badge}`}>{cfg.label}</span>
          <span className="text-xs text-gray-400">{fechaDisplay}</span>
          {horaDisplay && (
            <span className="text-xs text-gray-400 font-medium">{horaDisplay}</span>
          )}
        </div>

        {!compact && evento.ubicacion && (
          <p className="text-xs text-gray-400 mt-1 truncate">📍 {evento.ubicacion}</p>
        )}
      </div>

      <svg className="w-4 h-4 text-gray-300 self-center shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
      </svg>
    </Link>
  )
}
