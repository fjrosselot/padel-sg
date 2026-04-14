import { useMemo } from 'react'
import { calcularEstructura } from '../../../lib/fixture'

const FORMATOS = [
  { key: 'grupos_eliminatoria', label: 'Grupos + Eliminatoria', desc: 'Lo más común. Fase de grupos y luego cuadro eliminatorio.' },
  { key: 'round_robin',         label: 'Round Robin',            desc: 'Todos contra todos. El mejor puntaje gana.' },
  { key: 'eliminacion_directa', label: 'Eliminación Directa',    desc: 'Bracket directo desde el principio.' },
]

export default function Paso2Formato({ datos, onChange }) {
  const estructura = useMemo(() => {
    if (!datos.max_parejas || datos.max_parejas < 2) return null
    return calcularEstructura(datos)
  }, [datos.max_parejas, datos.formato, datos.tam_grupo, datos.pasan_por_grupo, datos.tercer_lugar])

  return (
    <div className="space-y-4">

      {/* Número de parejas */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Número de parejas <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => onChange({ max_parejas: Math.max(4, datos.max_parejas - 2) })}
            className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center">
            −
          </button>
          <span className="text-2xl font-bold text-gray-800 w-10 text-center">{datos.max_parejas}</span>
          <button type="button"
            onClick={() => onChange({ max_parejas: Math.min(32, datos.max_parejas + 2) })}
            className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center">
            +
          </button>
          <span className="text-xs text-gray-400 ml-1">parejas (mín. 4)</span>
        </div>
      </div>

      {/* Formato */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-3">
        <p className="text-xs font-medium text-gray-600">Formato</p>
        {FORMATOS.map(f => (
          <label key={f.key}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition
              ${datos.formato === f.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="formato" value={f.key} checked={datos.formato === f.key}
              onChange={() => onChange({ formato: f.key })} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800">{f.label}</p>
              <p className="text-xs text-gray-400">{f.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Config grupos_eliminatoria */}
      {datos.formato === 'grupos_eliminatoria' && (
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">
          <p className="text-xs font-medium text-gray-600">Configuración de grupos</p>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Parejas por grupo</label>
            <div className="flex gap-2">
              {[3, 4].map(n => (
                <button key={n} type="button"
                  onClick={() => onChange({ tam_grupo: n })}
                  className={`flex-1 rounded-xl py-2.5 text-sm border transition font-medium
                    ${datos.tam_grupo === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {n} parejas
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Clasifican por grupo</label>
            <div className="flex gap-2">
              {[1, 2].map(n => (
                <button key={n} type="button"
                  onClick={() => onChange({ pasan_por_grupo: n })}
                  className={`flex-1 rounded-xl py-2.5 text-sm border transition font-medium
                    ${datos.pasan_por_grupo === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {n === 1 ? '1° de cada grupo' : '1° y 2° de cada grupo'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={datos.tercer_lugar}
              onChange={e => onChange({ tercer_lugar: e.target.checked })} className="rounded w-4 h-4" />
            <span className="text-sm text-gray-700">Partido por 3° y 4° lugar</span>
          </label>
        </div>
      )}

      {/* Preview de estructura */}
      {estructura && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-2">Vista previa</p>
          <div className="space-y-1 text-sm text-blue-800">
            {estructura.grupos && (
              <p>
                {estructura.grupos.length} grupo{estructura.grupos.length > 1 ? 's' : ''}
                {' '}({estructura.grupos.map(g => `${g.letra}: ${g.posiciones.length}p`).join(', ')})
                {' · '}{estructura.partidos_grupos} partidos de grupos
              </p>
            )}
            {estructura.bracket && (
              <p>
                {estructura.bracket.fases.map(f => f.nombre).join(' → ')}
                {' · '}{estructura.partidos_bracket} partidos eliminatorios
              </p>
            )}
            <p className="font-bold">Total: {estructura.total_partidos} partidos</p>
          </div>
        </div>
      )}
    </div>
  )
}
