import { calcularEstructura, calcularBloquesPorJornada, calcularJornadas } from '../../../lib/fixture'

const FORMATO_LABEL = {
  grupos_eliminatoria: 'Grupos + Eliminatoria',
  round_robin: 'Round Robin',
  eliminacion_directa: 'Eliminación Directa',
}

function Fila({ label, valor }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right max-w-[60%]">{valor}</span>
    </div>
  )
}

export default function Paso5Publicar({ datos }) {
  const estructura = datos.max_parejas >= 2 ? calcularEstructura(datos) : null
  const bloques = calcularBloquesPorJornada(datos.hora_inicio, datos.hora_fin, datos.duracion_partido)
  const { jornadas } = estructura
    ? calcularJornadas(estructura.total_partidos, datos.num_canchas, bloques)
    : { jornadas: 0 }

  const fmtFecha = iso => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="space-y-4">

      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <p className="text-xs font-medium text-gray-600 mb-3">Resumen general</p>
        <Fila label="Nombre" valor={datos.nombre || '—'} />
        <Fila label="Ámbito" valor={datos.ambito === 'interno' ? 'Interno' : 'Externo'} />
        <Fila label="Fecha inicio" valor={fmtFecha(datos.fecha_inicio)} />
        {datos.fecha_fin && <Fila label="Fecha fin estimada" valor={fmtFecha(datos.fecha_fin)} />}
        <Fila label="Sistema ranking" valor={{ puntos: 'Puntos', elo: 'ELO', wdl: 'Win/Loss %' }[datos.sistema_ranking]} />
        {datos.descripcion && <Fila label="Descripción" valor={datos.descripcion} />}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <p className="text-xs font-medium text-gray-600 mb-3">Formato y fixture</p>
        <Fila label="Formato" valor={FORMATO_LABEL[datos.formato]} />
        <Fila label="Parejas" valor={datos.max_parejas} />
        {datos.formato === 'grupos_eliminatoria' && (
          <>
            <Fila label="Parejas por grupo" valor={datos.tam_grupo} />
            <Fila label="Clasifican" valor={datos.pasan_por_grupo === 1 ? '1° de cada grupo' : '1° y 2° de cada grupo'} />
            <Fila label="3° y 4° lugar" valor={datos.tercer_lugar ? 'Sí' : 'No'} />
          </>
        )}
        {estructura && <Fila label="Total partidos" valor={estructura.total_partidos} />}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <p className="text-xs font-medium text-gray-600 mb-3">Turnos</p>
        <Fila label="Canchas" valor={datos.num_canchas} />
        <Fila label="Horario" valor={`${datos.hora_inicio} – ${datos.hora_fin}`} />
        <Fila label="Duración partido" valor={`${datos.duracion_partido} min`} />
        {jornadas > 0 && <Fila label="Jornadas estimadas" valor={jornadas} />}
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
        <p className="text-xs text-amber-700">
          <strong>Borrador:</strong> el torneo queda guardado sin publicar. Podés editarlo antes de abrir inscripciones.
        </p>
        <p className="text-xs text-amber-700 mt-1">
          <strong>Abrir inscripciones:</strong> los jugadores podrán anotarse de inmediato.
        </p>
      </div>
    </div>
  )
}
