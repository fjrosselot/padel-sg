import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../hooks/useAuth'
import { useTemporada } from '../../../hooks/useTemporada'
import Paso1General from './Paso1General'
import Paso2Formato from './Paso2Formato'
import Paso3Turnos from './Paso3Turnos'
import Paso4Fixture from './Paso4Fixture'
import Paso5Publicar from './Paso5Publicar'

const PASOS = ['General', 'Formato', 'Turnos', 'Fixture', 'Publicar']

const DATOS_INICIALES = {
  // Paso 1
  nombre: '', temporada_id: '', ambito: 'interno',
  fecha_inicio: '', fecha_fin: '', descripcion: '',
  sistema_ranking: 'puntos',
  // Paso 2
  max_parejas: 8, formato: 'grupos_eliminatoria',
  tam_grupo: 4, pasan_por_grupo: 2, tercer_lugar: true,
  // Paso 3
  num_canchas: 2, hora_inicio: '09:00', hora_fin: '13:00', duracion_partido: 60,
}

export default function WizardTorneo() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { temporadaActiva } = useTemporada()

  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState({
    ...DATOS_INICIALES,
    temporada_id: temporadaActiva?.id ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function actualizar(cambios) {
    setDatos(d => ({ ...d, ...cambios }))
    setError('')
  }

  function siguiente() { setPaso(p => Math.min(p + 1, 4)) }
  function anterior() { setPaso(p => Math.max(p - 1, 0)) }

  async function publicar(estado) {
    setGuardando(true)
    setError('')

    // 1. Crear el evento en el calendario
    const { data: evento, error: errEvento } = await supabase
      .from('eventos')
      .insert({
        titulo: datos.nombre,
        tipo: 'torneo_interno',
        ambito: datos.ambito,
        descripcion: datos.descripcion || null,
        fecha_inicio: datos.fecha_inicio,
        fecha_fin: datos.fecha_fin || null,
        todo_dia: true,
        temporada_id: datos.temporada_id || null,
        inscripcion_abierta: estado === 'inscripcion',
        es_publico: false,
        creado_por: user.id,
        deporte_id: 'padel',
      })
      .select('id')
      .single()

    if (errEvento) { setError('Error al crear el evento en el calendario.'); setGuardando(false); return }

    // 2. Crear el torneo
    const wizardConfig = {
      tam_grupo: datos.tam_grupo,
      pasan_por_grupo: datos.pasan_por_grupo,
      tercer_lugar: datos.tercer_lugar,
      num_canchas: datos.num_canchas,
      hora_inicio: datos.hora_inicio,
      hora_fin: datos.hora_fin,
      duracion_partido: datos.duracion_partido,
    }

    const { data: torneo, error: errTorneo } = await supabase
      .from('torneos')
      .insert({
        nombre: datos.nombre,
        descripcion: datos.descripcion || null,
        ambito: datos.ambito,
        formato: datos.formato,
        sistema_ranking: datos.sistema_ranking,
        max_parejas: datos.max_parejas,
        inscripcion_abierta: estado === 'inscripcion',
        estado,
        temporada_id: datos.temporada_id || null,
        evento_id: evento.id,
        fecha_inicio: datos.fecha_inicio,
        fecha_fin: datos.fecha_fin || null,
        wizard_config: wizardConfig,
        deporte_id: 'padel',
      })
      .select('id')
      .single()

    if (errTorneo) { setError('Error al crear el torneo.'); setGuardando(false); return }

    // 3. Vincular evento ↔ torneo
    await supabase.from('eventos').update({ torneo_id: torneo.id }).eq('id', evento.id)

    setGuardando(false)
    navigate(`/torneos/${torneo.id}`)
  }

  const PasoActual = [Paso1General, Paso2Formato, Paso3Turnos, Paso4Fixture, Paso5Publicar][paso]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center gap-1 mb-2">
          {PASOS.map((nombre, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition
                ${i < paso ? 'bg-blue-700 text-white' : i === paso ? 'bg-blue-700 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'}`}>
                {i < paso ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === paso ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                {nombre}
              </span>
            </div>
          ))}
          {PASOS.slice(0, -1).map((_, i) => (
            <div key={`line-${i}`} className={`h-0.5 flex-1 -mx-1 -mt-5 ${i < paso ? 'bg-blue-700' : 'bg-gray-200'}`}
              style={{ display: 'none' }} />
          ))}
        </div>
        <div className="flex rounded-full h-1.5 bg-gray-200 overflow-hidden mt-1">
          <div className="bg-blue-700 transition-all" style={{ width: `${(paso / 4) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">Paso {paso + 1} de 5 — {PASOS[paso]}</p>
      </div>

      {/* Paso actual */}
      <PasoActual datos={datos} onChange={actualizar} />

      {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}

      {/* Navegación */}
      {paso < 4 && (
        <div className="flex gap-3 mt-6">
          {paso > 0 && (
            <button onClick={anterior}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              ← Atrás
            </button>
          )}
          <button onClick={siguiente}
            className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition">
            Siguiente →
          </button>
        </div>
      )}

      {paso === 4 && (
        <div className="flex gap-3 mt-6">
          <button onClick={anterior}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            ← Atrás
          </button>
          <button onClick={() => publicar('borrador')} disabled={guardando}
            className="flex-1 rounded-xl border border-blue-300 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition">
            {guardando ? '…' : 'Guardar borrador'}
          </button>
          <button onClick={() => publicar('inscripcion')} disabled={guardando}
            className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition">
            {guardando ? '…' : 'Abrir inscripciones'}
          </button>
        </div>
      )}
    </div>
  )
}
