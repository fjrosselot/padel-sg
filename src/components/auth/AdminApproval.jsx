import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const NIVEL_LABELS = { 1: 'Iniciación', 2: 'Básico', 3: 'Intermedio', 4: 'Avanzado', 5: 'Competitivo' }

export default function AdminApproval() {
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState({})

  async function cargar() {
    setCargando(true)
    const { data } = await supabase
      .from('jugadores')
      .select('id, nombre, email, telefono, anio_curso_hijo, created_at')
      .eq('estado_cuenta', 'pendiente')
      .order('created_at', { ascending: true })
    setPendientes(data ?? [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function accion(id, nuevoEstado) {
    setProcesando(p => ({ ...p, [id]: true }))
    await supabase
      .from('jugadores')
      .update({ estado_cuenta: nuevoEstado })
      .eq('id', id)
    setPendientes(p => p.filter(j => j.id !== id))
    setProcesando(p => ({ ...p, [id]: false }))
  }

  function formatFecha(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Aprobación de usuarios</h2>
      <p className="text-sm text-gray-500 mb-6">
        {pendientes.length === 0
          ? 'No hay solicitudes pendientes.'
          : `${pendientes.length} solicitud${pendientes.length > 1 ? 'es' : ''} pendiente${pendientes.length > 1 ? 's' : ''}`}
      </p>

      <div className="space-y-4">
        {pendientes.map(j => (
          <div key={j.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{j.nombre}</p>
                <p className="text-sm text-gray-500 truncate">{j.email}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {j.telefono && (
                    <a
                      href={`https://wa.me/${j.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      📱 {j.telefono}
                    </a>
                  )}
                  {j.anio_curso_hijo && (
                    <span className="text-xs text-gray-400">Curso: {j.anio_curso_hijo}</span>
                  )}
                  <span className="text-xs text-gray-400">Solicitó: {formatFecha(j.created_at)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => accion(j.id, 'activo')}
                  disabled={procesando[j.id]}
                  className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => accion(j.id, 'suspendido')}
                  disabled={procesando[j.id]}
                  className="rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50 transition"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
