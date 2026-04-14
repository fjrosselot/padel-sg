import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NivelDots, { NIVELES_HOMBRE, NIVELES_MUJER } from './NivelDots'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const BLOQUES = [
  { key: 'manana', label: 'Mañana', sub: '7-12'  },
  { key: 'tarde',  label: 'Tarde',  sub: '12-18' },
  { key: 'noche',  label: 'Noche',  sub: '18-23' },
]
const LADO_LABEL = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }
const TODOS_NIVELES = [...NIVELES_HOMBRE, ...NIVELES_MUJER]

function parseJson(val, fallback = []) {
  try { return JSON.parse(val || JSON.stringify(fallback)) } catch { return fallback }
}

function Initials({ nombre }) {
  const ini = nombre?.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') ?? '?'
  return (
    <div className="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
      {ini}
    </div>
  )
}

export default function BuscadorCompanero() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])          // todos los jugadores activos con disponibilidad
  const [cargando, setCargando] = useState(true)
  const [buscado, setBuscado] = useState(false)
  const [resultados, setResultados] = useState([])

  // Filtros
  const [diasSel, setDiasSel] = useState(new Set())
  const [bloquesSel, setBloquesSel] = useState(new Set())
  const [nivelesSel, setNivelesSel] = useState(new Set())
  const [ladoSel, setLadoSel] = useState('')

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('jugadores')
        .select('id, nombre, apodo, nivel, lado_preferido, hijos, telefono, disponibilidad(dia_semana, bloque)')
        .eq('estado_cuenta', 'activo')
        .neq('id', user.id)
        .order('nombre')
      setTodos(data ?? [])
      setCargando(false)
    }
    cargar()
  }, [user.id])

  function toggleSet(setter, key) {
    setter(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function buscar() {
    const resultados = todos
      .map(j => {
        const disponSet = new Set((j.disponibilidad || []).map(d => `${d.dia_semana}-${d.bloque}`))

        // Calcular slots coincidentes con los filtros seleccionados
        let slotsCoincidentes = 0
        if (diasSel.size > 0 || bloquesSel.size > 0) {
          const diasCheck = diasSel.size > 0 ? [...diasSel] : [0,1,2,3,4,5,6]
          const bloquesCheck = bloquesSel.size > 0 ? [...bloquesSel] : BLOQUES.map(b => b.key)
          diasCheck.forEach(d => bloquesCheck.forEach(b => {
            if (disponSet.has(`${d}-${b}`)) slotsCoincidentes++
          }))
        } else {
          // Sin filtro de horario → contar total de slots disponibles
          slotsCoincidentes = disponSet.size
        }

        return { ...j, disponSet, slotsCoincidentes }
      })
      .filter(j => {
        // Filtro horario: al menos un slot coincidente (si hay filtro activo)
        if ((diasSel.size > 0 || bloquesSel.size > 0) && j.slotsCoincidentes === 0) return false
        // Filtro nivel
        if (nivelesSel.size > 0 && !nivelesSel.has(j.nivel)) return false
        // Filtro lado preferido
        if (ladoSel && j.lado_preferido && j.lado_preferido !== ladoSel && j.lado_preferido !== 'ambos') return false
        return true
      })
      .sort((a, b) => b.slotsCoincidentes - a.slotsCoincidentes)

    setResultados(resultados)
    setBuscado(true)
  }

  function limpiar() {
    setDiasSel(new Set())
    setBloquesSel(new Set())
    setNivelesSel(new Set())
    setLadoSel('')
    setBuscado(false)
    setResultados([])
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Buscar compañero</h2>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-5">

        {/* Días */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Días disponibles <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {DIAS_SHORT.map((dia, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleSet(setDiasSel, i)}
                className={`rounded-xl px-3 py-2 text-sm border transition
                  ${diasSel.has(i) ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>

        {/* Bloques */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Horario <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="flex gap-2">
            {BLOQUES.map(b => (
              <button
                key={b.key}
                type="button"
                onClick={() => toggleSet(setBloquesSel, b.key)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm border transition
                  ${bloquesSel.has(b.key) ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                <div>{b.label}</div>
                <div className="text-xs text-gray-400">{b.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Nivel */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Nivel del compañero <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="space-y-1.5">
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-gray-400 self-center w-16">Hombres</span>
              {NIVELES_HOMBRE.map(({ key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSet(setNivelesSel, key)}
                  className={`rounded-xl px-2.5 py-1.5 border transition
                    ${nivelesSel.has(key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <NivelDots nivel={key} size="sm" />
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-gray-400 self-center w-16">Mujeres</span>
              {NIVELES_MUJER.map(({ key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSet(setNivelesSel, key)}
                  className={`rounded-xl px-2.5 py-1.5 border transition
                    ${nivelesSel.has(key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <NivelDots nivel={key} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lado preferido */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Lado del compañero <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="flex gap-2">
            {[['', 'Cualquiera'], ['drive', 'Drive'], ['reves', 'Revés']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setLadoSel(val)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm border transition
                  ${ladoSel === val ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          {buscado && (
            <button
              type="button"
              onClick={limpiar}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={buscar}
            className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {resultados.length === 0
              ? 'Sin resultados. Prueba con otros filtros.'
              : `${resultados.length} compañero${resultados.length > 1 ? 's' : ''} encontrado${resultados.length > 1 ? 's' : ''}`}
          </p>

          <div className="space-y-3">
            {resultados.map(j => {
              const hijos = parseJson(j.hijos, [])
              const slotsActivos = j.slotsCoincidentes

              return (
                <div key={j.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Initials nombre={j.nombre} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">{j.nombre}</span>
                        {j.apodo && <span className="text-xs text-gray-400">"{j.apodo}"</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {j.nivel && <NivelDots nivel={j.nivel} size="sm" />}
                        {j.lado_preferido && (
                          <span className="text-xs text-gray-500">{LADO_LABEL[j.lado_preferido]}</span>
                        )}
                        {hijos.length > 0 && (
                          <span className="text-xs text-gray-400">{hijos.join(' · ')}</span>
                        )}
                      </div>
                      {(diasSel.size > 0 || bloquesSel.size > 0) && slotsActivos > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {slotsActivos} bloque{slotsActivos > 1 ? 's' : ''} en común
                        </p>
                      )}
                    </div>
                    {j.telefono && (
                      <a
                        href={`https://wa.me/${j.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-xl bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
