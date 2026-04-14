import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { TIPO_CONFIG, formatFechaUI, formatHora } from './tipoConfig'

export default function EventoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, jugador, isAdmin } = useAuth()

  const [evento, setEvento] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [miInscripcion, setMiInscripcion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)

  async function cargar() {
    const [{ data: e }, { data: p }] = await Promise.all([
      supabase.from('eventos').select('*').eq('id', id).single(),
      supabase
        .from('evento_participantes')
        .select('id, estado, jugador_id, jugadores(nombre, apodo)')
        .eq('evento_id', id)
        .neq('estado', 'baja'),
    ])
    setEvento(e)
    setParticipantes(p ?? [])
    setMiInscripcion(p?.find(p => p.jugador_id === user?.id) ?? null)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [id])

  async function inscribirse() {
    setProcesando(true)
    await supabase.from('evento_participantes').insert({
      evento_id: id, jugador_id: user.id, estado: 'inscrito',
    })
    await cargar()
    setProcesando(false)
  }

  async function darBaja() {
    if (!miInscripcion) return
    setProcesando(true)
    await supabase.from('evento_participantes')
      .update({ estado: 'baja' })
      .eq('id', miInscripcion.id)
    await cargar()
    setProcesando(false)
  }

  async function eliminarEvento() {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('eventos').delete().eq('id', id)
    navigate('/calendario')
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!evento) {
    return <p className="text-center py-16 text-gray-400">Evento no encontrado.</p>
  }

  const cfg = TIPO_CONFIG[evento.tipo] ?? TIPO_CONFIG.otro
  const cupoRestante = evento.cupo_max ? evento.cupo_max - participantes.length : null
  const puedeInscribirse = evento.inscripcion_abierta && !miInscripcion && (cupoRestante === null || cupoRestante > 0)

  const fechaDisplay = evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio
    ? `${formatFechaUI(evento.fecha_inicio)} – ${formatFechaUI(evento.fecha_fin)}`
    : formatFechaUI(evento.fecha_inicio)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

      {/* Cabecera */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`rounded-full text-xs px-2.5 py-1 font-medium ${cfg.badge}`}>
            {cfg.label}
          </span>
          {isAdmin && (
            <div className="flex gap-2">
              <Link
                to={`/calendario/${id}/editar`}
                className="text-xs text-blue-600 hover:underline"
              >
                Editar
              </Link>
              <button onClick={eliminarEvento} className="text-xs text-red-500 hover:underline">
                Eliminar
              </button>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-3">{evento.titulo}</h2>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-5">📅</span>
            <span>{fechaDisplay}</span>
            {!evento.todo_dia && evento.hora_inicio && (
              <span className="text-gray-400">
                {formatHora(evento.hora_inicio)}
                {evento.hora_fin && ` – ${formatHora(evento.hora_fin)}`}
              </span>
            )}
          </div>
          {evento.ubicacion && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-5">📍</span>
              <span>{evento.ubicacion}</span>
            </div>
          )}
          {evento.url_externo && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-5">🔗</span>
              <a href={evento.url_externo} target="_blank" rel="noreferrer"
                className="text-blue-600 hover:underline truncate">
                Ver más info
              </a>
            </div>
          )}
          {evento.inscripcion_abierta && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-5">👥</span>
              <span>
                {participantes.length} inscrito{participantes.length !== 1 ? 's' : ''}
                {cupoRestante !== null && ` · ${cupoRestante} lugar${cupoRestante !== 1 ? 'es' : ''} disponible${cupoRestante !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}
        </div>

        {evento.descripcion && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
            {evento.descripcion}
          </p>
        )}
      </div>

      {/* Inscripción */}
      {evento.inscripcion_abierta && (
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          {miInscripcion ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-700">✓ Estás inscrito</p>
                <p className="text-xs text-gray-400 mt-0.5">Estado: {miInscripcion.estado}</p>
              </div>
              <button
                onClick={darBaja}
                disabled={procesando}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              >
                {procesando ? '…' : 'Darme de baja'}
              </button>
            </div>
          ) : cupoRestante === 0 ? (
            <p className="text-sm text-gray-500 text-center py-2">Sin cupo disponible.</p>
          ) : (
            <button
              onClick={inscribirse}
              disabled={procesando}
              className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
            >
              {procesando ? 'Inscribiendo…' : 'Inscribirse'}
            </button>
          )}
        </div>
      )}

      {/* Lista de participantes */}
      {participantes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">
            Participantes ({participantes.length})
          </h3>
          <div className="space-y-2">
            {participantes.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-gray-700">
                  {p.jugadores?.apodo || p.jugadores?.nombre || '—'}
                </span>
                {p.estado === 'confirmado' && (
                  <span className="text-xs text-green-600 ml-auto">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
