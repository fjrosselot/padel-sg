import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const CURSOS = [
  'Pre-kinder','Kinder',
  '1°A','1°B','2°A','2°B','3°A','3°B','4°A','4°B',
  '5°A','5°B','6°A','6°B',
  '7°A','7°B','8°A','8°B',
  'I°A','I°B','II°A','II°B','III°A','III°B','IV°A','IV°B',
  'Otro',
]

export default function Register() {
  const { signUp } = useAuth()

  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '', telefono: '' })
  const [hijos, setHijos] = useState([])
  const [nuevoCurso, setNuevoCurso] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  function agregarHijo() {
    const c = nuevoCurso.trim()
    if (!c || hijos.includes(c)) return
    setHijos(h => [...h, c])
    setNuevoCurso('')
  }

  function quitarHijo(c) { setHijos(h => h.filter(x => x !== c)) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmar) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }

    setCargando(true)
    const { error } = await signUp({
      nombre:   form.nombre.trim(),
      email:    form.email.trim(),
      password: form.password,
      telefono: form.telefono.trim(),
      hijos:    JSON.stringify(hijos),
    })
    setCargando(false)

    if (error) {
      setError(error.message.includes('already registered')
        ? 'Este email ya tiene una cuenta registrada.'
        : 'Ocurrió un error. Intenta nuevamente.')
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800">Solicitud enviada</h2>
          <p className="mt-3 text-sm text-gray-600">
            Tu solicitud fue recibida. El administrador la revisará y te avisará cuando tu cuenta esté activa.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-2xl font-bold text-blue-700">Pádel Saint George</h1>
        <h2 className="mt-2 text-center text-lg text-gray-600">Solicitar acceso</h2>
        <p className="mt-1 text-center text-xs text-gray-400">Acceso aprobado manualmente por el admin</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input type="text" name="nombre" required value={form.nombre} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan Pérez" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" name="email" required value={form.email} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com" autoComplete="email" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono WhatsApp <span className="text-red-500">*</span>
            </label>
            <input type="tel" name="telefono" required value={form.telefono} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+56 9 1234 5678" />
          </div>

          {/* Hijos — lista dinámica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Curso(s) de tus hijos
            </label>
            {hijos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {hijos.map(h => (
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
                {CURSOS.filter(c => !hijos.includes(c)).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button type="button" onClick={agregarHijo} disabled={!nuevoCurso}
                className="rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40 transition">
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input type="password" name="password" required value={form.password} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña <span className="text-red-500">*</span>
            </label>
            <input type="password" name="confirmar" required value={form.confirmar} onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" autoComplete="new-password" />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button type="submit" disabled={cargando}
            className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition">
            {cargando ? 'Enviando solicitud…' : 'Solicitar acceso'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-blue-700 hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
