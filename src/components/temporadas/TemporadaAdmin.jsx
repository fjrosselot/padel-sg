import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTemporada } from '../../hooks/useTemporada'

const AÑO_ACTUAL = new Date().getFullYear()

const FORM_INICIAL = {
  nombre: `Temporada ${AÑO_ACTUAL}`,
  anio: AÑO_ACTUAL,
  fecha_inicio: `${AÑO_ACTUAL}-01-01`,
  fecha_fin: `${AÑO_ACTUAL}-12-31`,
  descripcion: '',
}

function formatFecha(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function TemporadaAdmin() {
  const { temporadas, temporadaActiva, recargar } = useTemporada()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_INICIAL)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [procesando, setProcesando] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => {
      const nuevo = { ...f, [name]: value }
      // Auto-actualizar nombre si cambia el año
      if (name === 'anio') nuevo.nombre = `Temporada ${value}`
      return nuevo
    })
    setError('')
  }

  async function handleCrear(e) {
    e.preventDefault()
    setError('')
    if (new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
      setError('La fecha de fin debe ser posterior a la de inicio.')
      return
    }
    setGuardando(true)
    const { error } = await supabase.from('temporadas').insert({
      nombre: form.nombre.trim(),
      anio: Number(form.anio),
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      descripcion: form.descripcion.trim() || null,
      activa: false,
      deporte_id: 'padel',
    })
    setGuardando(false)
    if (error) {
      setError('Error al guardar. Verifica los datos.')
      return
    }
    setMostrarForm(false)
    setForm(FORM_INICIAL)
    await recargar()
  }

  async function handleActivar(id) {
    setProcesando(id)
    const { error } = await supabase.rpc('activar_temporada', { p_id: id })
    if (error) console.error(error)
    await recargar()
    setProcesando(null)
  }

  async function handleCerrar() {
    if (!temporadaActiva) return
    setProcesando(temporadaActiva.id)
    const { error } = await supabase.rpc('cerrar_temporada_activa')
    if (error) console.error(error)
    await recargar()
    setProcesando(null)
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar esta temporada? Solo se puede si no tiene torneos o rankings asociados.')) return
    setProcesando(id)
    const { error } = await supabase.from('temporadas').delete().eq('id', id)
    if (error) alert('No se puede eliminar — tiene datos asociados.')
    await recargar()
    setProcesando(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Temporadas</h2>
          {temporadaActiva && (
            <p className="text-sm text-green-600">
              Activa: <span className="font-medium">{temporadaActiva.nombre}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => { setMostrarForm(f => !f); setError('') }}
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
        >
          {mostrarForm ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {/* Formulario nueva temporada */}
      {mostrarForm && (
        <form onSubmit={handleCrear} className="bg-white rounded-2xl shadow-sm p-5 mb-6 space-y-4 border border-gray-100">
          <h3 className="font-semibold text-gray-700">Nueva temporada</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
              <input
                type="number"
                name="anio"
                required
                min="2020"
                max="2040"
                value={form.anio}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                required
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio</label>
              <input
                type="date"
                name="fecha_inicio"
                required
                value={form.fecha_inicio}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin</label>
              <input
                type="date"
                name="fecha_fin"
                required
                value={form.fecha_fin}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
            <input
              type="text"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ej: Primer semestre 2026"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
          >
            {guardando ? 'Guardando…' : 'Crear temporada'}
          </button>
        </form>
      )}

      {/* Lista de temporadas */}
      {temporadas.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No hay temporadas. Crea la primera.
        </div>
      ) : (
        <div className="space-y-3">
          {temporadas.map(t => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl shadow-sm p-4 border ${t.activa ? 'border-green-200' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{t.nombre}</p>
                    {t.activa && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Activa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatFecha(t.fecha_inicio)} — {formatFecha(t.fecha_fin)}
                  </p>
                  {t.descripcion && (
                    <p className="text-xs text-gray-500 mt-1">{t.descripcion}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {t.activa ? (
                    <button
                      onClick={handleCerrar}
                      disabled={procesando === t.id}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition"
                    >
                      {procesando === t.id ? '…' : 'Cerrar'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleActivar(t.id)}
                        disabled={procesando === t.id}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {procesando === t.id ? '…' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleEliminar(t.id)}
                        disabled={procesando === t.id}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
