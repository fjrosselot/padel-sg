import { FASE_ORDEN, FASE_LABEL } from '../../lib/bracketGen'
import { formatearScore } from '../../lib/resultado'

function nombrePar(p) {
  if (!p?.p1j1 && !p?.p2j1) return null
  const n = j => j?.apodo || j?.nombre?.split(' ')[0] || '?'
  return (j1, j2) => `${n(j1)} / ${n(j2)}`
}

function MatchBox({ partido, onCargar, puedeCargarlo }) {
  if (!partido) return (
    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-3 min-w-[180px]">
      <p className="text-xs text-gray-300 text-center">Pendiente</p>
    </div>
  )

  const n = j => j?.apodo || j?.nombre?.split(' ')[0] || '?'
  const p1 = `${n(partido.p1j1)} / ${n(partido.p1j2)}`
  const p2 = `${n(partido.p2j1)} / ${n(partido.p2j2)}`
  const jugado = partido.estado === 'jugado'
  const score  = formatearScore(partido.detalle_sets)

  return (
    <div
      onClick={() => puedeCargarlo && onCargar(partido)}
      className={`bg-white rounded-xl border border-gray-200 p-3 min-w-[180px] shadow-sm
        ${puedeCargarlo && !jugado ? 'cursor-pointer hover:border-blue-300 hover:shadow' : ''}
        transition`}>
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between gap-2 text-xs
          ${jugado && partido.ganador === 1 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
          <span className="truncate">{p1}</span>
          {jugado && <span className="font-mono shrink-0">{partido.sets_pareja1}</span>}
        </div>
        <div className="h-px bg-gray-100" />
        <div className={`flex items-center justify-between gap-2 text-xs
          ${jugado && partido.ganador === 2 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
          <span className="truncate">{p2}</span>
          {jugado && <span className="font-mono shrink-0">{partido.sets_pareja2}</span>}
        </div>
      </div>
      {jugado && score && (
        <p className="text-xs text-gray-400 font-mono mt-1.5 text-center">{score}</p>
      )}
      {!jugado && puedeCargarlo && (
        <p className="text-xs text-blue-400 text-center mt-1.5">Cargar resultado →</p>
      )}
    </div>
  )
}

export default function BracketVisual({ partidos, onCargar, puedeCargarlo }) {
  if (!partidos.length) return (
    <div className="text-center text-gray-400 text-sm py-8">
      Aún no se generó el bracket eliminatorio.
    </div>
  )

  // Agrupar por fase en el orden correcto
  const porFase = {}
  for (const p of partidos) {
    if (!porFase[p.fase]) porFase[p.fase] = []
    porFase[p.fase].push(p)
  }

  // Ordenar cada fase por posicion_bracket
  for (const fase of Object.keys(porFase)) {
    porFase[fase].sort((a, b) => {
      const posA = a.posicion_bracket ?? ''
      const posB = b.posicion_bracket ?? ''
      return posA.localeCompare(posB)
    })
  }

  const fasesPresentes = FASE_ORDEN.filter(f => porFase[f])

  return (
    <div className="space-y-4">
      {fasesPresentes.map(fase => (
        <div key={fase}>
          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">
            {FASE_LABEL[fase] ?? fase}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {porFase[fase].map(p => (
              <MatchBox
                key={p.id}
                partido={p}
                onCargar={onCargar}
                puedeCargarlo={puedeCargarlo(p)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
