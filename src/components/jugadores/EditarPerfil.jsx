import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import NivelDots, { NIVELES_HOMBRE, NIVELES_MUJER } from './NivelDots'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const BLOQUES = [
  { key: 'manana', label: 'Mañana', sub: '7-12'  },
  { key: 'tarde',  label: 'Tarde',  sub: '12-18' },
  { key: 'noche',  label: 'Noche',  sub: '18-23' },
]
const INTERESES_OPTS = [
  { key: 'torneos',   label: 'Torneos'   },
  { key: 'amistosos', label: 'Amistosos' },
  { key: 'clases',    label: 'Clases'    },
  { key: 'mixto',     label: 'Mixto'     },
]
const CURSOS = [
  'Pre-kinder','Kinder',
  '1°A','1°B','2°A','2°B','3°A','3°B','4°A','4°B',
  '5°A','5°B','6°A','6°B',
  '7°A','7°B','8°A','8°B',
  'I°A','I°B','II°A','II°B','III°A','III°B','IV°A','IV°B',
  'Otro',
]

function parseJson(val, fallback = []) {
  try { return JSON.parse(val || JSON.stringify(fallback)) } catch { return fallback }
}

export default function EditarPerfil() {
  const { user, recargarJugador } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', apodo: '', telefono: '',
    nivel: '', lado_preferido: '', intereses: [],
    hijos: [],
  })
  const [nuevoCurso, setNuevoCurso] = useState('')
  const [disponSelected, setDisponSelected] = useState(new Set())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      const [{ data: j }, { data: d }] = await Promise.all([
        supabase.from('jugadores').select('*').eq('id', user.id).single(),
        supabase.from('disponibilidad').select('dia_semana, bloque').eq('jugador_id', user.id),
      ])
      if (j) {
        setForm({
          nombre:         j.nombre ?? '',
          apodo:          j.apodo ?? '',
          telefono:       j.telefono ?? '',
          nivel:          j.nivel ?? '',
          lado_preferido: j.lado_preferido ?? '',
          intereses:      parseJson(j.intereses, []),
          hijos:          parseJson(j.hijos, []),
        })
      }
      if (d) setDisponSelected(new Set(d.map(r => `${r.dia_semana}-${r.bloque}`)))
      setCargando(false)
    }
    if (user?.id) cargar()
  }, [user?.id])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setError('')
  }

  function toggleInteres(key) {
    setForm(f => {
      const s = new Set(f.intereses)
      s.has(key) ? s.delete(key) : s.add(key)
      return { ...f, intereses: [...s] }
    })
  }

  function agregarHijo() {
    const curso = nuevoCurso.trim()
    if (!curso || form.hijos.includes(curso)) return
    setForm(f => ({ ...f, hijos: [...f.hijos, curso] }))
    setNuevoCurso('')
  }

  function quitarHijo(curso) {
    setForm(f => ({ ...f, hijos: f.hijos.filter(h => h !== curso) }))
  }

  function toggleDispon(dia, bloque) {
    setDisponSelected(prev => {
      const next = new Set(prev)
      const key = `${dia}-${bloque}`
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    setGuardando(true)
    setError('')

    const { error: errPerfil } = await supabase
      .from('jugadores')
      .update({
        nombre:         form.nombre.trim(),
        apodo:          form.apodo.trim() || null,
        telefono:       form.telefono.trim() || null,
        nivel:          form.nivel || null,
        lado_preferido: form.lado_preferido || null,
        intereses:      JSON.stringify(form.intereses),
        hijos:          JSON.stringify(form.hijos),
      })
      .eq('id', user.id)

    if (errPerfil) { setError('Error al guardar el perfil.'); setGuardando(false); return }

    await supabase.from('disponibilidad').delete().eq('jugador_id', user.id)
    if (disponSelected.size > 0) {
      const rows = [...disponSelected].map(key => {
        const [dia, bloque] = key.split('-')
        return { jugador_id: user.id, dia_semana: Number(dia), bloque, deporte_id: 'padel' }
      })
      await supabase.from('disponibilidad').insert(rows)
    }

    await recargarJugador()
    setGuardando(false)
    navigate('/perfil')
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Datos personales */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-700">Datos personales</h3>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text" name="nombre" value={form.nombre} onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Apodo (opcional)</label>
          <input
            type="text" name="apodo" value={form.apodo} onChange={handleChange}
            placeholder="Como te conocen en la cancha"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono WhatsApp</label>
          <input
            type="tel" name="telefono" value={form.telefono} onChange={handleChange}
            placeholder="+56 9 1234 5678"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Hijos */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Curso(s) de tus hijos
          </label>
          {form.hijos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.hijos.map(h => (
                <span key={h} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                  {h}
                  <button type="button" onClick={() => quitarHijo(h)} className="text-blue-400 hover:text-blue-600">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select
              value={nuevoCurso}
              onChange={e => setNuevoCurso(e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar curso…</option>
              {CURSOS.filter(c => !form.hijos.includes(c)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={agregarHijo}
              disabled={!nuevoCurso}
              className="rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 transition"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Perfil de pádel */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-5">
        <h3 className="font-semibold text-gray-700">Perfil de pádel</h3>

        {/* Nivel */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Categoría / Nivel
          </label>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Hombres</p>
              <div className="flex gap-2 flex-wrap">
                {NIVELES_HOMBRE.map(({ key }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, nivel: f.nivel === key ? '' : key }))}
                    className={`rounded-xl px-3 py-2 text-sm border transition
                      ${form.nivel === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <NivelDots nivel={key} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Mujeres</p>
              <div className="flex gap-2 flex-wrap">
                {NIVELES_MUJER.map(({ key }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, nivel: f.nivel === key ? '' : key }))}
                    className={`rounded-xl px-3 py-2 text-sm border transition
                      ${form.nivel === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <NivelDots nivel={key} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lado preferido */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Lado preferido</label>
          <div className="flex gap-2">
            {[['drive','Drive'],['reves','Revés'],['ambos','Ambos']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm(f => ({ ...f, lado_preferido: f.lado_preferido === val ? '' : val }))}
                className={`flex-1 rounded-xl px-3 py-2 text-sm border transition
                  ${form.lado_preferido === val ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Intereses */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Me interesa</label>
          <div className="flex gap-2 flex-wrap">
            {INTERESES_OPTS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleInteres(key)}
                className={`rounded-xl px-3 py-2 text-sm border transition
                  ${form.intereses.includes(key) ? 'border-blue-500 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-1">Disponibilidad horaria</h3>
        <p className="text-xs text-gray-400 mb-4">Toca los bloques en los que normalmente puedes jugar</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="w-16 pb-2 text-left text-gray-400 font-normal" />
                {BLOQUES.map(b => (
                  <th key={b.key} className="pb-2 text-center text-gray-500 font-medium px-1">
                    <div>{b.label}</div>
                    <div className="text-gray-400 font-normal">{b.sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS.map((dia, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2 text-gray-500">{dia}</td>
                  {BLOQUES.map(b => {
                    const activo = disponSelected.has(`${i}-${b.key}`)
                    return (
                      <td key={b.key} className="py-1 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggleDispon(i, b.key)}
                          className={`w-10 h-8 rounded-lg transition ${activo ? 'bg-green-400 hover:bg-green-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex gap-3 pb-6">
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
