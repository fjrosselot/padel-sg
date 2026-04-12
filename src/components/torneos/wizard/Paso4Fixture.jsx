import { useMemo } from 'react'
import { calcularEstructura, calcularBloquesPorJornada, listaPartidosGrupos, asignarTurnos } from '../../../lib/fixture'

export default function Paso4Fixture({ datos }) {
  const { estructura, partidos } = useMemo(() => {
    if (!datos.max_parejas || datos.max_parejas < 2) return { estructura: null, partidos: [] }
    const e = calcularEstructura(datos)
    if (!e) return { estructura: null, partidos: [] }

    const bloques = calcularBloquesPorJornada(datos.hora_inicio, datos.hora_fin, datos.duracion_partido)
    const lista = listaPartidosGrupos(e.grupos)
    const conTurnos = asignarTurnos(lista, datos.num_canchas, bloques)
    return { estructura: e, partidos: conTurnos }
  }, [datos])

  if (!estructura) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 text-center text-gray-400 text-sm">
        Configura los pasos anteriores para ver el fixture.
      </div>
    )
  }

  // Agrupar por jornada
  const porJornada = partidos.reduce((acc, p) => {
    if (!acc[p.jornada]) acc[p.jornada] = []
    acc[p.jornada].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-4">

      {/* Resumen */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-2">Resumen del torneo</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
          <div>
            <span className="text-xs text-blue-500 block">Parejas</span>
            {datos.max_parejas}
          </div>
          <div>
            <span className="text-xs text-blue-500 block">Formato</span>
            {{ grupos_eliminatoria: 'Grupos + Elim.', round_robin: 'Round Robin', eliminacion_directa: 'Eliminación directa' }[datos.formato]}
          </div>
          {estructura.grupos && (
            <div>
              <span className="text-xs text-blue-500 block">Grupos</span>
              {estructura.grupos.length} grupos
            </div>
          )}
          <div>
            <span className="text-xs text-blue-500 block">Partidos</span>
            {estructura.total_partidos} total
          </div>
        </div>
      </div>

      {/* Fixture de grupos por jornada */}
      {Object.keys(porJornada).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-600">Fase de grupos — distribución por jornada</p>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(porJornada).map(([j, ps]) => (
              <div key={j} className="px-5 py-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Jornada {j}</p>
                <div className="space-y-1.5">
                  {ps.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                        Gr.{p.grupo} R{p.ronda}
                      </span>
                      <span className="text-gray-700 font-medium">{p.a}</span>
                      <span className="text-gray-300">vs</span>
                      <span className="text-gray-700 font-medium">{p.b}</span>
                      <span className="ml-auto text-xs text-gray-400">Bl.{p.bloque} C{p.cancha}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bracket eliminatorio (esquema) */}
      {estructura.bracket && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-600">Fase eliminatoria</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 flex-wrap">
              {estructura.bracket.fases.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-700">{f.nombre}</div>
                    <div className="text-xs text-gray-400">{f.partidos} partido{f.partidos !== 1 ? 's' : ''}{f.extra ? ` +${f.extra}` : ''}</div>
                  </div>
                  {i < estructura.bracket.fases.length - 1 && (
                    <span className="text-gray-300">→</span>
                  )}
                </div>
              ))}
            </div>
            {estructura.bracket.byes > 0 && (
              <p className="text-xs text-gray-400 mt-2">{estructura.bracket.byes} bye{estructura.bracket.byes !== 1 ? 's' : ''} en primera ronda</p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center px-4">
        Los números de pareja (P1, A1…) se asignarán al sortear los grupos una vez cerrada la inscripción.
      </p>
    </div>
  )
}
