import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [tokenValido, setTokenValido] = useState(null)

  useEffect(() => {
    // Supabase procesa automáticamente el hash del URL al cargar
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenValido(true)
      }
    })
    // Si no hay token, redirigir
    const timer = setTimeout(() => {
      if (tokenValido === null) setTokenValido(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [tokenValido])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setCargando(false)
    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
    } else {
      setExito(true)
      setTimeout(() => navigate('/'), 2500)
    }
  }

  if (tokenValido === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
          <p className="text-red-600 font-medium">Enlace inválido o expirado.</p>
          <button onClick={() => navigate('/login')}
            className="mt-4 text-sm text-blue-600 hover:underline">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-2xl font-bold text-blue-700">Pádel Saint George</h1>
        <h2 className="mt-2 text-center text-lg text-gray-600">Nueva contraseña</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        {exito ? (
          <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-100">
            <p className="text-green-700 font-medium">Contraseña actualizada.</p>
            <p className="text-sm text-green-600 mt-1">Redirigiendo…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={mostrar ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setMostrar(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {mostrar ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input
                type={mostrar ? 'text' : 'password'}
                required
                value={confirmar}
                onChange={e => { setConfirmar(e.target.value); setError('') }}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
            >
              {cargando ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
