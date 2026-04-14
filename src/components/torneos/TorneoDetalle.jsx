import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatearScore } from '../../lib/resultado'
import { calcularStandings, obtenerClasificados } from '../../lib/standings'
import { generarPrimeraRonda, generarSiguienteRonda, generarTercerLugar } from '../../lib/bracketGen'
import RegistrarResultado from './RegistrarResultado'
import TablaGrupo from './TablaGrupo'
import BracketVisual from './BracketVisual'

const ESTADO_CFG = {
  borrador:    { label: 'Borrador',       bg: 'bg-gray-100',   text: 'text-gray-600' },
  inscripcion: { label: 'Inscripciones',  bg: 'bg-green-100',  text: 'text-green-700' },
  en_curso:    { label: 'En curso',       bg: 'bg-blue-100',   text: 'text-blue-700' },
  finalizado:  { label: 'Finalizado',     bg: 'bg-purple-100', text: 'text-purple-700' },
  cancelado:   { label: 'Cancelado',      bg: 'bg-red-100',    text: 'text-red-700' },
}
const FORMATO_LABEL = {
  grupos_eliminatoria: 'Grupos + Eliminatoria',
  round_robin: 'Round Robin',
  eliminacion_directa: 'Eliminación Directa',
}

// ── Formulario inscripción ────────────────────────────────────────────────────
function FormInscripcion({ torneoId, miId, onInscritos }) {
  const [jugadores, setJugadores] = useState([])
  const [companeroId, setCompaneroId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('jugadores').select('id,nombre,apodo').eq('estado_cuenta','activo').neq('id',miId).order('nombre')
      .then(({ data }) => setJugadores(data ?? []))
  }, [miId])

  async function inscribir() {
    if (!companeroId) { setError('Seleccioná un compañero'); return }
    setGuardando(true); setError('')
    const { error: e } = await supabase.from('inscripciones').insert({ torneo_id: torneoId, jugador1_id: miId, jugador2_id: companeroId })
    setGuardando(false)
    if (e) { setError(e.message); return }
    onInscritos()
  }

  return (
    <div className="bg-green-50 rounded-2xl p-4 border border-green-100 space-y-3">
      <p className="text-xs font-medium text-green-800">Anotate con tu compañero</p>
      <select value={companeroId} onChange={e => setCompaneroId(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Seleccionar compañero…</option>
        {jugadores.map(j => <option key={j.id} value={j.id}>{j.nombre}{j.apodo ? ` (${j.apodo})` : ''}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button onClick={inscribir} disabled={guardando}
        className="w-full rounded-xl bg-green-600 text-white text-sm font-semibold py-2.5 hover:bg-green-700 disabled:opacity-50 transition">
        {guardando ? '…' : 'Confirmar inscripción'}
      </button>
    </div>
  )
}

// ── Card inscripción ──────────────────────────────────────────────────────────
function InscripcionCard({ ins, miId, isAdmin, onRetirar, onCambiarEstado }) {
  const esPropia = ins.jugador1_id === miId || ins.jugador2_id === miId
  const cfg = { confirmada: { label:'Confirmada', bg:'bg-green-100', text:'text-green-700' }, pendiente: { label:'Pendiente', bg:'bg-yellow-100', text:'text-yellow-700' }, rechazada: { label:'Rechazada', bg:'bg-red-100', text:'text-red-600' } }[ins.estado] ?? { label: ins.estado, bg:'bg-gray-100', text:'text-gray-600' }
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">
          <span className="font-medium">{ins.j1?.nombre ?? '—'}</span>
          <span className="text-gray-400"> · </span>
          <span className="font-medium">{ins.j2?.nombre ?? '—'}</span>
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
      {isAdmin && ins.estado === 'pendiente' && (
        <div className="flex gap-1">
          <button onClick={() => onCambiarEstado(ins.id,'confirmada')} className="text-xs text-green-600 hover:text-green-800 font-medium px-1">✓</button>
          <button onClick={() => onCambiarEstado(ins.id,'rechazada')}  className="text-xs text-red-500 hover:text-red-700 font-medium px-1">✗</button>
        </div>
      )}
      {esPropia && ins.estado !== 'rechazada' && (
        <button onClick={() => onRetirar(ins.id)} className="text-xs text-gray-400 hover:text-red-500 transition">retirarse</button>
      )}
    </div>
  )
}

// ── Fixture de grupos ─────────────────────────────────────────────────────────
function FixtureGrupos({ partidos, miId, isAdmin, onCargar }) {
  const porGrupo = partidos.reduce((acc, p) => { if (!acc[p.grupo]) acc[p.grupo] = []; acc[p.grupo].push(p); return acc }, {})
  const n = j => j?.apodo || j?.nombre?.split(' ')[0] || '?'

  return (
    <div className="space-y-3">
      {Object.keys(porGrupo).length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-8">Aún no se generó el fixture.</div>
      ) : Object.entries(porGrupo).map(([grupo, pts]) => (
        <div key={grupo} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-100 bg-blue-50">
            <p className="text-xs font-semibold text-blue-700">Grupo {grupo}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {pts.map(p => {
              const p1 = `${n(p.p1j1)} / ${n(p.p1j2)}`
              const p2 = `${n(p.p2j1)} / ${n(p.p2j2)}`
              const jugado = p.estado === 'jugado'
              const score  = formatearScore(p.detalle_sets)
              const puede  = !p.resultado_bloqueado && (isAdmin || [p.pareja1_j1,p.pareja1_j2,p.pareja2_j1,p.pareja2_j2].includes(miId))
              return (
                <div key={p.id} onClick={() => puede && onCargar(p)}
                  className={`px-5 py-3 ${puede ? 'cursor-pointer hover:bg-gray-50' : ''} transition`}>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className={`truncate ${jugado && p.ganador===1 ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{p1}</p>
                      <p className={`truncate ${jugado && p.ganador===2 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{p2}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {jugado ? (
                        <>
                          <p className="text-xs font-mono text-gray-600">{score}</p>
                          <p className="text-xs text-green-600 font-medium">{p.sets_pareja1}-{p.sets_pareja2}</p>
                        </>
                      ) : (
                        <span className="text-xs text-gray-300">{puede ? 'Cargar →' : 'Pendiente'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TorneoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const miId = user?.id

  const [torneo, setTorneo]               = useState(null)
  const [inscripciones, setInscripciones] = useState([])
  const [partidos, setPartidos]           = useState([])      // grupos
  const [bracket, setBracket]             = useState([])      // eliminatoria
  const [cargando, setCargando]           = useState(true)
  const [sorteando, setSorteando]         = useState(false)
  const [procesando, setProcesando]       = useState(false)
  const [error, setError]                 = useState('')
  const [tab, setTab]                     = useState('inscripciones')
  const [modalPartido, setModalPartido]   = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const joinJugadores = `*, p1j1:pareja1_j1(id,nombre,apodo), p1j2:pareja1_j2(id,nombre,apodo), p2j1:pareja2_j1(id,nombre,apodo), p2j2:pareja2_j2(id,nombre,apodo)`
    const [{ data: t }, { data: ins }, { data: pts }, { data: bkt }] = await Promise.all([
      supabase.from('torneos').select('*, temporadas(nombre)').eq('id', id).single(),
      supabase.from('inscripciones').select('*, j1:jugador1_id(id,nombre,apodo), j2:jugador2_id(id,nombre,apodo)').eq('torneo_id', id).order('created_at'),
      supabase.from('partidos').select(joinJugadores).eq('torneo_id', id).eq('fase', 'grupo').order('grupo'),
      supabase.from('partidos').select(joinJugadores).eq('torneo_id', id).neq('fase', 'grupo').order('posicion_bracket'),
    ])
    setTorneo(t)
    setInscripciones(ins ?? [])
    setPartidos(pts ?? [])
    setBracket(bkt ?? [])
    setCargando(false)
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  // ── Lógica derivada ───────────────────────────────────────────────────────
  const standings = useMemo(() => calcularStandings(partidos), [partidos])

  const todosGruposCompletos = partidos.length > 0 && partidos.every(p => p.estado === 'jugado')

  const faseActualBracket = useMemo(() => {
    if (!bracket.length) return null
    const fases = ['octavos','cuartos','semifinal','final']
    for (let i = fases.length - 1; i >= 0; i--) {
      const matchesFase = bracket.filter(b => b.fase === fases[i])
      if (matchesFase.length > 0 && matchesFase.some(m => m.estado !== 'jugado')) return fases[i]
    }
    return null
  }, [bracket])

  const sigRondaLista = useMemo(() => {
    if (!faseActualBracket) return false
    const matchesFase = bracket.filter(b => b.fase === faseActualBracket)
    return matchesFase.length > 0 && matchesFase.every(m => m.estado === 'jugado')
  }, [bracket, faseActualBracket])

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function cambiarEstadoTorneo(nuevoEstado) {
    await supabase.from('torneos').update({ estado: nuevoEstado, inscripcion_abierta: nuevoEstado === 'inscripcion' }).eq('id', id)
    await cargar()
  }

  async function cambiarEstadoIns(insId, estado) {
    await supabase.from('inscripciones').update({ estado }).eq('id', insId)
    await cargar()
  }

  async function retirar(insId) {
    if (!confirm('¿Retirarte de este torneo?')) return
    await supabase.from('inscripciones').delete().eq('id', insId)
    await cargar()
  }

  async function sortearGrupos() {
    if (!confirm('¿Sortear grupos? Se generarán todos los partidos de fase de grupos.')) return
    setSorteando(true); setError('')
    const { error: e } = await supabase.rpc('sortear_grupos', { p_torneo_id: id })
    setSorteando(false)
    if (e) { setError('Error en el sorteo: ' + e.message); return }
    await cargar(); setTab('fixture')
  }

  async function avanzarBracket() {
    if (!confirm('¿Generar el cuadro eliminatorio con los clasificados?')) return
    setProcesando(true); setError('')
    const wizardConfig = torneo.wizard_config ?? {}
    const clasificados = obtenerClasificados(standings, wizardConfig.pasan_por_grupo ?? 2)
    const matchesBracket = generarPrimeraRonda(clasificados, id)
    if (!matchesBracket.length) { setError('No hay suficientes clasificados.'); setProcesando(false); return }
    const { error: e } = await supabase.from('partidos').insert(matchesBracket)
    setProcesando(false)
    if (e) { setError('Error al generar bracket: ' + e.message); return }
    await cargar(); setTab('bracket')
  }

  async function siguienteRonda() {
    setProcesando(true); setError('')
    const matchesFase = bracket.filter(b => b.fase === faseActualBracket)
    const wizardConfig = torneo.wizard_config ?? {}

    let nuevosMatches = generarSiguienteRonda(matchesFase, id)

    // Tercer lugar al generar la final
    if (faseActualBracket === 'semifinal' && wizardConfig.tercer_lugar) {
      nuevosMatches = [...nuevosMatches, ...generarTercerLugar(matchesFase, id)]
    }

    if (!nuevosMatches.length) { setError('No se pudo generar la siguiente ronda.'); setProcesando(false); return }
    const { error: e } = await supabase.from('partidos').insert(nuevosMatches)
    setProcesando(false)
    if (e) { setError('Error: ' + e.message); return }
    await cargar()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (cargando) return <div className="text-center text-gray-400 text-sm py-16">Cargando…</div>
  if (!torneo)  return <div className="text-center text-gray-400 text-sm py-16">Torneo no encontrado.</div>

  const cfg         = ESTADO_CFG[torneo.estado] ?? ESTADO_CFG.borrador
  const confirmadas = inscripciones.filter(i => i.estado === 'confirmada').length
  const yaInscrito  = inscripciones.some(i => i.jugador1_id === miId || i.jugador2_id === miId)
  const lleno       = torneo.max_parejas && confirmadas >= torneo.max_parejas

  const fmtFecha = iso => { if (!iso) return ''; const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}` }

  const hayBracket = bracket.length > 0
  const tieneGrupos = torneo.formato !== 'eliminacion_directa'

  const TABS = [
    { key: 'inscripciones', label: 'Parejas' },
    ...(tieneGrupos && partidos.length ? [{ key: 'fixture', label: 'Fixture' }] : []),
    ...(tieneGrupos && partidos.length ? [{ key: 'posiciones', label: 'Posiciones' }] : []),
    ...(hayBracket ? [{ key: 'bracket', label: 'Bracket' }] : []),
  ]

  return (
    <div className="px-4 py-5 pb-28 space-y-4">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/torneos')} className="text-blue-600 text-sm mt-0.5">←</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-800 truncate">{torneo.nombre}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {FORMATO_LABEL[torneo.formato]} · {torneo.max_parejas} parejas
            {torneo.temporadas?.nombre ? ` · ${torneo.temporadas.nombre}` : ''}
          </p>
          {torneo.fecha_inicio && (
            <p className="text-xs text-gray-400">{fmtFecha(torneo.fecha_inicio)}{torneo.fecha_fin ? ` → ${fmtFecha(torneo.fecha_fin)}` : ''}</p>
          )}
        </div>
      </div>

      {/* Controles admin */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-2">Administrar</p>
          <div className="flex gap-2 flex-wrap">
            {torneo.estado === 'borrador' && (
              <button onClick={() => cambiarEstadoTorneo('inscripcion')}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition font-medium">
                Abrir inscripciones
              </button>
            )}
            {torneo.estado === 'inscripcion' && (
              <>
                <button onClick={sortearGrupos} disabled={sorteando || confirmadas < 2}
                  className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition font-medium">
                  {sorteando ? 'Sorteando…' : `Sortear grupos (${confirmadas} parejas)`}
                </button>
                <button onClick={() => cambiarEstadoTorneo('borrador')}
                  className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition font-medium">
                  Cerrar inscripciones
                </button>
              </>
            )}
            {torneo.estado === 'en_curso' && tieneGrupos && todosGruposCompletos && !hayBracket && (
              <button onClick={avanzarBracket} disabled={procesando}
                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium">
                {procesando ? '…' : 'Avanzar al bracket →'}
              </button>
            )}
            {torneo.estado === 'en_curso' && hayBracket && sigRondaLista && faseActualBracket !== 'final' && (
              <button onClick={siguienteRonda} disabled={procesando}
                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium">
                {procesando ? '…' : 'Generar siguiente ronda →'}
              </button>
            )}
            {torneo.estado === 'en_curso' && (
              <button onClick={() => cambiarEstadoTorneo('finalizado')}
                className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition font-medium">
                Marcar finalizado
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {/* Inscribirse */}
      {torneo.inscripcion_abierta && !yaInscrito && !lleno && (
        <FormInscripcion torneoId={id} miId={miId} onInscritos={cargar} />
      )}
      {torneo.inscripcion_abierta && lleno && !yaInscrito && (
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 text-sm text-yellow-800 text-center">
          Torneo lleno ({torneo.max_parejas}/{torneo.max_parejas} parejas).
        </div>
      )}

      {/* Tabs */}
      {TABS.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition
                ${tab === t.key ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab: Parejas */}
      {tab === 'inscripciones' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">Inscripciones</p>
            <span className="text-xs text-gray-400">{confirmadas}/{torneo.max_parejas ?? '∞'} parejas</span>
          </div>
          <div className="px-5 py-2">
            {inscripciones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aún no hay inscripciones.</p>
            ) : inscripciones.map(ins => (
              <InscripcionCard key={ins.id} ins={ins} miId={miId} isAdmin={isAdmin}
                onRetirar={retirar} onCambiarEstado={cambiarEstadoIns} />
            ))}
          </div>
        </div>
      )}

      {/* Tab: Fixture de grupos */}
      {tab === 'fixture' && (
        <FixtureGrupos partidos={partidos} miId={miId} isAdmin={isAdmin} onCargar={setModalPartido} />
      )}

      {/* Tab: Posiciones */}
      {tab === 'posiciones' && (
        <div className="space-y-3">
          {Object.entries(standings).length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">Aún no hay resultados para mostrar posiciones.</div>
          ) : Object.entries(standings).map(([letra, tabla]) => (
            <TablaGrupo key={letra} letra={letra} tabla={tabla} />
          ))}
        </div>
      )}

      {/* Tab: Bracket */}
      {tab === 'bracket' && (
        <BracketVisual
          partidos={bracket}
          onCargar={setModalPartido}
          puedeCargarlo={p => !p.resultado_bloqueado && (isAdmin || [p.pareja1_j1,p.pareja1_j2,p.pareja2_j1,p.pareja2_j2].includes(miId))}
        />
      )}

      {/* Modal resultado */}
      {modalPartido && (
        <RegistrarResultado
          partido={modalPartido}
          onClose={() => setModalPartido(null)}
          onGuardado={() => { setModalPartido(null); cargar() }}
        />
      )}
    </div>
  )
}
