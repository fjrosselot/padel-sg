import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTemporada } from '../../hooks/useTemporada'
import { TIPOS } from './tipoConfig'

const FORM_INICIAL = {
  titulo: '', tipo: 'entrenamiento', ambito: 'interno',
  descripcion: '', ubicacion: '', url_externo: '',
  fecha_inicio: '', hora_inicio: '', fecha_fin: '', hora_fin: '',
  todo_dia: false,
  inscripcion_abierta: false, cupo_max: '',
  es_publico: false,
  temporada_id: '',
}

export default function EventoCrear() {
  const { id } = useParams()   // si hay id → modo edición
  const modoEdicion = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { temporadas, temporadaActiva } = useTemporada()

  const [form, setForm] = useState({
    ...FORM_INICIAL,
    temporada_id: temporadaActiva?.id ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (modoEdicion) {
      supabase.from('eventos').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({
          titulo:              data.titulo ?? '',
          tipo:                data.tipo ?? 'entrenamiento',
          ambito:              data.ambito ?? 'interno',
          descripcion:         data.descripcion ?? '',
          ubicacion:           data.ubicacion ?? '',
          url_externo:         data.url_externo ?? '',
          fecha_inicio:        data.fecha_inicio ?? '',
          hora_inicio:         data.hora_inicio?.slice(0,5) ?? '',
          fecha_fin:           data.fecha_fin ?? '',
          hora_fin:            data.hora_fin?.slice(0,5) ?? '',
          todo_dia:            data.todo_dia ?? false,
          inscripcion_abierta: data.inscripcion_abierta ?? false,
          cupo_max:            data.cupo_max ?? '',
          es_publico:          data.es_publico ?? false,
          temporada_id:        data.temporada_id ?? '',
        })
      })
    }
  }, [id])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const esExterno = form.tipo === 'torneo_externo' || form.ambito === 'externo'

  async function handleGuardar(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('El título es obligatorio.'); return }
    if (!form.fecha_inicio) { setError('La fecha de inicio es obligatoria.'); return }
    setGuardando(true)
    setError('')

    const payload = {
      titulo:              form.titulo.trim(),
      tipo:                form.tipo,
      ambito:              form.ambito,
      descripcion:         form.descripcion.trim() || null,
      ubicacion:           form.ubicacion.trim() || null,
      url_externo:         form.url_externo.trim() || null,
      fecha_inicio:        form.fecha_inicio,
      hora_inicio:         form.todo_dia || !form.hora_inicio ? null : form.hora_inicio,
      fecha_fin:           form.fecha_fin || null,
      hora_fin:            form.todo_dia || !form.hora_fin ? null : form.hora_fin,
      todo_dia:            form.todo_dia,
      inscripcion_abierta: form.inscripcion_abierta,
      cupo_max:            form.inscripcion_abierta && form.cupo_max ? Number(form.cupo_max) : null,
      es_publico:          form.es_publico,
      temporada_id:        form.temporada_id || null,
      deporte_id:          'padel',
    }

    let error
    if (modoEdicion) {
      ;({ error } = await supabase.from('eventos').update(payload).eq('id', id))
    } else {
      payload.creado_por = user.id
      ;({ error } = await supabase.from('eventos').insert(payload))
    }

    setGuardando(false)
    if (error) { setError('Error al guardar. Verifica los datos.'); return }
    navigate('/calendario')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h2 className="text-lg font-bold text-gray-800 mb-5">
        {modoEdicion ? 'Editar evento' : 'Nuevo evento'}
      </h2>

      <form onSubmit={handleGuardar} className="space-y-5">

        {/* Básicos */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input type="text" name="titulo" required value={form.titulo} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Entrenamiento técnico" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ámbito</label>
              <select name="ambito" value={form.ambito} onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </select>
            </div>
          </div>

          {temporadas.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temporada</label>
              <select name="temporada_id" value={form.temporada_id} onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin temporada</option>
                {temporadas.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}{t.activa ? ' (activa)' : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="todo_dia" checked={form.todo_dia} onChange={handleChange}
                className="rounded" />
              Todo el día
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fecha inicio <span className="text-red-500">*</span>
              </label>
              <input type="date" name="fecha_inicio" required value={form.fecha_inicio} onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {!form.todo_dia && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio</label>
                <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin</label>
              <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange}
                min={form.fecha_inicio}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {!form.todo_dia && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin</label>
                <input type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* Detalles */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ubicación</label>
            <input type="text" name="ubicacion" value={form.ubicacion} onChange={handleChange}
              placeholder="Ej: Cancha 1 SG"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {esExterno && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Link externo</label>
              <input type="url" name="url_externo" value={form.url_externo} onChange={handleChange}
                placeholder="https://…"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3}
              placeholder="Detalles del evento…"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>

        {/* Inscripción y visibilidad */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="inscripcion_abierta" checked={form.inscripcion_abierta} onChange={handleChange}
              className="rounded w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-gray-700">Inscripción abierta</p>
              <p className="text-xs text-gray-400">Los jugadores pueden anotarse</p>
            </div>
          </label>

          {form.inscripcion_abierta && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cupo máximo</label>
              <input type="number" name="cupo_max" value={form.cupo_max} onChange={handleChange}
                min="1" placeholder="Sin límite"
                className="w-32 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="es_publico" checked={form.es_publico} onChange={handleChange}
              className="rounded w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-gray-700">Visible sin login</p>
              <p className="text-xs text-gray-400">Aparece en el feed ICS público</p>
            </div>
          </label>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => navigate('/calendario')}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition">
            {guardando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </form>
    </div>
  )
}
