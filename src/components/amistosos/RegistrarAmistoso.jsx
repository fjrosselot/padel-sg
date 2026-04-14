import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTemporada } from '../../hooks/useTemporada'
import { calcularResultado, validarSets } from '../../lib/resultado'

function SetInput({ label, g1, g2, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <input type="number" min="0" max="99" value={g1}
        onChange={e => onChange('g1', e.target.value)}
        className="w-14 text-center rounded-xl border border-gray-300 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <span className="text-gray-300 font-bold">–</span>
      <input type="number" min="0" max="99" value={g2}
        onChange={e => onChange('g2', e.target.value)}
        className="w-14 text-center rounded-xl border border-gray-300 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

export default function RegistrarAmistoso() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { temporadas, temporadaActiva } = useTemporada()

  const [jugadores, setJugadores]       = useState([])
  const [p1j1, setP1j1]                 = useState(user?.id ?? '')
  const [p1j2, setP1j2]                 = useState('')
  const [p2j1, setP2j1]                 = useState('')
  const [p2j2, setP2j2]                 = useState('')
  const [temporadaId, setTemporadaId]   = useState(temporadaActiva?.id ?? '')
  const [fecha, setFecha]               = useState(new Date().toISOString().split('T')[0])
  const [sets, setSets]                 = useState([{ g1: '', g2: '' }, { g1: '', g2: '' }])
  const [supertb, setSupertb]           = useState({ pts1: '', pts2: '' })
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    supabase.from('jugadores').select('id, nombre, apodo').eq('estado_cuenta', 'activo').order('nombre')
      .then(({ data }) => setJugadores(data ?? []))
  }, [])

  function actualizarSet(idx, campo, valor) {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [campo]: valor } : s))
    setError('')
  }

  const set1ok = sets[0].g1 !== '' && sets[0].g2 !== ''
  const set2ok = sets[1].g1 !== '' && sets[1].g2 !== ''
  const s1w = set1ok ? (Number(sets[0].g1) > Number(sets[0].g2) ? 1 : 2) : 0
  const s2w = set2ok ? (Number(sets[1].g1) > Number(sets[1].g2) ? 1 : 2) : 0
  const haySupertiebreak = set1ok && set2ok && s1w !== 0 && s2w !== 0 && s1w !== s2w

  async function guardar() {
    if (!p1j1 || !p1j2 || !p2j1 || !p2j2) { setError('Seleccioná los 4 jugadores.'); return }
    if (new Set([p1j1, p1j2, p2j1, p2j2]).size < 4) { setError('Los 4 jugadores deben ser distintos.'); return }
    const setsValidos = sets.filter(s => s.g1 !== '' && s.g2 !== '')
    const sb = haySupertiebreak ? supertb : null
    const err = validarSets(setsValidos, sb)
    if (err) { setError(err); return }

    const resultado = calcularResultado(setsValidos, sb)
    setGuardando(true)
    setError('')

    const { error: e } = await supabase.from('partidos').insert({
      tipo:          'amistoso',
      pareja1_j1:    p1j1,
      pareja1_j2:    p1j2,
      pareja2_j1:    p2j1,
      pareja2_j2:    p2j2,
      fecha,
      sets_pareja1:  resultado.sets_pareja1,
      sets_pareja2:  resultado.sets_pareja2,
      games_pareja1: resultado.games_pareja1,
      games_pareja2: resultado.games_pareja2,
      ganador:       resultado.ganador,
      detalle_sets:  resultado.detalle_sets,
      estado:        'jugado',
      deporte_id:    'padel',
    })

    setGuardando(false)
    if (e) { setError(e.message); return }
    navigate('/amistosos')
  }

  const JugadorSelect = ({ value, onChange, exclude = [] }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Seleccionar…</option>
      {jugadores.filter(j => !exclude.includes(j.id) || j.id === value).map(j => (
        <option key={j.id} value={j.id}>{j.nombre}{j.apodo ? ` (${j.apodo})` : ''}</option>
      ))}
    </select>
  )

  return (
    <div className="px-4 py-5 pb-24 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm">←</button>
        <h1 className="text-lg font-bold text-gray-800">Registrar amistoso</h1>
      </div>

      {/* Parejas */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-3">
        <p className="text-xs font-medium text-gray-600">Pareja 1</p>
        <JugadorSelect value={p1j1} onChange={setP1j1} exclude={[p1j2, p2j1, p2j2]} />
        <JugadorSelect value={p1j2} onChange={setP1j2} exclude={[p1j1, p2j1, p2j2]} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-3">
        <p className="text-xs font-medium text-gray-600">Pareja 2</p>
        <JugadorSelect value={p2j1} onChange={setP2j1} exclude={[p1j1, p1j2, p2j2]} />
        <JugadorSelect value={p2j2} onChange={setP2j2} exclude={[p1j1, p1j2, p2j1]} />
      </div>

      {/* Fecha */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Score */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-3">
        <p className="text-xs font-medium text-gray-600">Resultado</p>
        <SetInput label="Set 1" g1={sets[0].g1} g2={sets[0].g2} onChange={(c, v) => actualizarSet(0, c, v)} />
        <SetInput label="Set 2" g1={sets[1].g1} g2={sets[1].g2} onChange={(c, v) => actualizarSet(1, c, v)} />
        {haySupertiebreak && (
          <SetInput label="Supertiebreak" g1={supertb.pts1} g2={supertb.pts2}
            onChange={(c, v) => setSupertb(prev => ({ ...prev, [c === 'g1' ? 'pts1' : 'pts2']: v }))} />
        )}
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button onClick={guardar} disabled={guardando}
        className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition">
        {guardando ? '…' : 'Guardar partido'}
      </button>
    </div>
  )
}
