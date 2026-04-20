import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { IS_EMERGENCY_TOKEN, setEmergencySession } from '@/lib/emergencySession'

export function EmergencyLogin() {
  const [token, setToken] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (IS_EMERGENCY_TOKEN(token)) {
      setEmergencySession()
      navigate('/dashboard')
    } else {
      setError(true)
      setToken('')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/8">
            <Shield className="h-7 w-7 text-navy" />
          </div>
          <h1 className="font-manrope text-2xl font-extrabold text-navy">Acceso de emergencia</h1>
          <p className="font-inter text-sm text-slate">Solo para el administrador del sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="token" className="font-inter text-[11px] font-semibold uppercase tracking-wider text-slate">
              Token de emergencia
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={e => { setToken(e.target.value); setError(false) }}
              placeholder="••••••••••••"
              autoFocus
              className={`h-12 w-full rounded-lg border px-4 font-inter text-sm text-navy outline-none transition-all focus:ring-2 focus:ring-gold/50 ${error ? 'border-defeat bg-defeat/5' : 'border-navy/15 bg-white'}`}
            />
            {error && (
              <p className="font-inter text-xs text-defeat">Token incorrecto.</p>
            )}
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-lg bg-navy font-inter text-sm font-bold tracking-wide text-white transition-all hover:bg-navy/90 active:scale-[0.99]"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center font-inter text-xs text-muted">
          Sesión válida solo mientras el navegador esté abierto.
        </p>
      </div>
    </div>
  )
}
