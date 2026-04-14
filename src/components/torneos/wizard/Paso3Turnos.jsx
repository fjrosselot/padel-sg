import { useMemo } from 'react'
import { calcularBloquesPorJornada, calcularJornadas, calcularEstructura } from '../../../lib/fixture'

export default function Paso3Turnos({ datos, onChange }) {
  const bloques = useMemo(
    () => calcularBloquesPorJornada(datos.hora_inicio, datos.hora_fin, datos.duracion_partido),
    [datos.hora_inicio, datos.hora_fin, datos.duracion_partido]
  )

  const resumen = useMemo(() => {
    if (!datos.max_parejas || datos.max_parejas < 2) return null
    const estructura = calcularEstructura(datos)
    if (!estructura) return null
    const { capacidad, jornadas } = calcularJornadas(estructura.total_partidos, datos.num_canchas, bloques)
    return { total_partidos: estructura.total_partidos, capacidad, jornadas }
  }, [datos, bloques])

  function h(e) {
    const { name, value } = e.target
    onChange({ [name]: name === 'num_canchas' || name === 'duracion_partido' ? Number(value) : value })
  }

  return (
    <div className="space-y-4">

      {/* Canchas */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-3">Número de canchas</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(n => (
            <button key={n} type="button"
              onClick={() => onChange({ num_canchas: n })}
              className={`flex-1 rounded-xl py-2.5 text-sm border transition font-medium
                ${datos.num_canchas === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Horario */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">
        <p className="text-xs font-medium text-gray-600">Horario de juego</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
            <input type="time" name="hora_inicio" value={datos.hora_inicio} onChange={h}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hora fin</label>
            <input type="time" name="hora_fin" value={datos.hora_fin} onChange={h}
              min={datos.hora_inicio}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-2">Duración por partido</label>
          <div className="flex gap-2">
            {[45, 60, 75, 90].map(min => (
              <button key={min} type="button"
                onClick={() => onChange({ duracion_partido: min })}
                className={`flex-1 rounded-xl py-2.5 text-sm border transition font-medium
                  ${datos.duracion_partido === min ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {min}'
              </button>
            ))}
          </div>
        </div>

        {bloques > 0 && (
          <p className="text-xs text-gray-400">
            {bloques} bloque{bloques !== 1 ? 's' : ''} por jornada · {datos.num_canchas * bloques} partido{datos.num_canchas * bloques !== 1 ? 's' : ''}/jornada
          </p>
        )}
        {bloques === 0 && (
          <p className="text-xs text-red-400">El horario no permite ningún bloque con la duración seleccionada.</p>
        )}
      </div>

      {/* Resumen */}
      {resumen && resumen.jornadas > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-2">Estimación de jornadas</p>
          <div className="space-y-1 text-sm text-blue-800">
            <p>{resumen.total_partidos} partidos en total</p>
            <p>{resumen.capacidad} partidos por jornada ({datos.num_canchas} cancha{datos.num_canchas !== 1 ? 's' : ''} × {bloques} bloques)</p>
            <p className="font-bold">{resumen.jornadas} jornada{resumen.jornadas !== 1 ? 's' : ''} necesaria{resumen.jornadas !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
    </div>
  )
}
