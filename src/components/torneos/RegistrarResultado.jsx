import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { calcularResultado, validarSets } from '../../lib/resultado'

function SetInput({ label, g1, g2, onChange, maxG = 99 }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <input
        type="number" min="0" max={maxG} value={g1}
        onChange={e => onChange('g1', e.target.value)}
        className="w-14 text-center rounded-xl border border-gray-300 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-gray-300 font-bold">–</span>
      <input
        type="number" min="0" max={maxG} value={g2}
        onChange={e => onChange('g2', e.target.value)}
        className="w-14 text-center rounded-xl border border-gray-300 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function nombrePareja(p) {
  if (!p) return '—'
  const n1 = p.j1?.apodo || p.j1?.nombre?.split(' ')[0] || '?'
  const n2 = p.j2?.apodo || p.j2?.nombre?.split(' ')[0] || '?'
  return `${n1} / ${n2}`
}

export default function RegistrarResultado({ partido, onClose, onGuardado }) {
  const [sets, setSets] = useState([
    { g1: '', g2: '' },
    { g1: '', g2: '' },
  ])
  const [supertb, setSupertb] = useState({ pts1: '', pts2: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')

  // Pre-cargar si ya tiene resultado
  useEffect(() => {
    if (!partido?.detalle_sets || partido.detalle_sets === '[]') return
    try {
      const d = JSON.parse(partido.detalle_sets)
      const normales = d.filter(s => !s.supertiebreak)
      const sb = d.find(s => s.supertiebreak)
      if (normales.length) setSets(normales.map(s => ({ g1: s.g1, g2: s.g2 })))
      if (sb) setSupertb({ pts1: sb.g1, pts2: sb.g2 })
    } catch { /* ignorar */ }
  }, [partido])

  function actualizarSet(idx, campo, valor) {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [campo]: valor } : s))
    setError('')
  }

  // Determinar si se juega supertiebreak (sets 1-1 con valores completos)
  const set1ok = sets[0].g1 !== '' && sets[0].g2 !== ''
  const set2ok = sets[1].g1 !== '' && sets[1].g2 !== ''
  const set1wins = set1ok && Number(sets[0].g1) > Number(sets[0].g2) ? 1 : (set1ok && Number(sets[0].g2) > Number(sets[0].g1) ? 2 : 0)
  const set2wins = set2ok && Number(sets[1].g1) > Number(sets[1].g2) ? 1 : (set2ok && Number(sets[1].g2) > Number(sets[1].g1) ? 2 : 0)
  const haySupertiebreak = set1ok && set2ok && set1wins !== 0 && set2wins !== 0 && set1wins !== set2wins

  // Preview en tiempo real
  const preview = (set1ok || set2ok) ? (() => {
    const setsValidos = sets.filter(s => s.g1 !== '' && s.g2 !== '')
    const sb = haySupertiebreak && supertb.pts1 !== '' && supertb.pts2 !== '' ? supertb : null
    return calcularResultado(setsValidos, sb)
  })() : null

  async function guardar() {
    const setsValidos = sets.filter(s => s.g1 !== '' && s.g2 !== '')
    const sb = haySupertiebreak ? supertb : null
    const err = validarSets(setsValidos, sb)
    if (err) { setError(err); return }

    const resultado = calcularResultado(setsValidos, sb)
    setGuardando(true)
    setError('')

    const { error: e } = await supabase
      .from('partidos')
      .update({
        sets_pareja1:  resultado.sets_pareja1,
        sets_pareja2:  resultado.sets_pareja2,
        games_pareja1: resultado.games_pareja1,
        games_pareja2: resultado.games_pareja2,
        ganador:       resultado.ganador,
        detalle_sets:  resultado.detalle_sets,
        estado:        'jugado',
      })
      .eq('id', partido.id)

    setGuardando(false)
    if (e) { setError(e.message); return }
    onGuardado()
  }

  const p1 = nombrePareja({ j1: partido.p1j1, j2: partido.p1j2 })
  const p2 = nombrePareja({ j1: partido.p2j1, j2: partido.p2j2 })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-5 shadow-xl">

        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto -mt-1" />

        <div>
          <p className="text-xs text-gray-400 text-center">Gr. {partido.grupo}</p>
          <p className="text-sm font-semibold text-gray-800 text-center mt-1">
            {p1} <span className="text-gray-300">vs</span> {p2}
          </p>
        </div>

        {/* Sets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 w-20" />
            <span className="text-xs text-blue-600 font-medium w-14 text-center">{p1.split(' / ')[0]}</span>
            <span className="w-4" />
            <span className="text-xs text-orange-600 font-medium w-14 text-center">{p2.split(' / ')[0]}</span>
          </div>
          <SetInput label="Set 1" g1={sets[0].g1} g2={sets[0].g2}
            onChange={(c, v) => actualizarSet(0, c, v)} />
          <SetInput label="Set 2" g1={sets[1].g1} g2={sets[1].g2}
            onChange={(c, v) => actualizarSet(1, c, v)} />
          {haySupertiebreak && (
            <SetInput label="Supertiebreak" g1={supertb.pts1} g2={supertb.pts2} maxG={99}
              onChange={(c, v) => setSupertb(prev => ({ ...prev, [c === 'g1' ? 'pts1' : 'pts2']: v }))} />
          )}
        </div>

        {/* Preview resultado */}
        {preview?.ganador && (
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-green-600">Ganador</p>
            <p className="text-sm font-bold text-green-800">
              {preview.ganador === 1 ? p1 : p2}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {preview.sets_pareja1}-{preview.sets_pareja2} en sets
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-600 text-center">{error}</p>}

        {/* Acciones */}
        <div className="flex gap-3 pb-safe">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={guardar} disabled={guardando}
            className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition">
            {guardando ? '…' : 'Guardar resultado'}
          </button>
        </div>
      </div>
    </div>
  )
}
