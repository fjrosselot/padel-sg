import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { checkEmergencyCredentials, setEmergencySession } from '@/lib/emergencySession'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

export function EmergencyLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!checkEmergencyCredentials(email.trim(), password)) {
      setError(true)
      return
    }
    setLoading(true)
    // Autenticar con Supabase real para que RLS funcione
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (authError) {
      setEmergencySession()
    }
    queryClient.clear()
    navigate('/dashboard')
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
          {error && (
            <div className="rounded-lg border border-defeat/20 bg-defeat/8 px-3.5 py-3">
              <p className="font-inter text-[13px] font-semibold text-defeat">Credenciales incorrectas.</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-inter text-[11px] font-semibold uppercase tracking-wider text-slate">
              Email
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-lg border border-navy/15 bg-white px-3.5 focus-within:ring-2 focus-within:ring-gold/50">
              <Mail className="h-[18px] w-[18px] shrink-0 text-muted" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(false) }}
                placeholder="admin@email.com"
                autoComplete="email"
                className="flex-1 border-none bg-transparent font-inter text-sm text-navy outline-none placeholder:text-muted"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-inter text-[11px] font-semibold uppercase tracking-wider text-slate">
              Contraseña
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-lg border border-navy/15 bg-white px-3.5 focus-within:ring-2 focus-within:ring-gold/50">
              <Lock className="h-[18px] w-[18px] shrink-0 text-muted" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="flex-1 border-none bg-transparent font-inter text-sm text-navy outline-none placeholder:text-muted"
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="text-muted hover:text-slate transition-colors">
                {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-navy font-inter text-sm font-bold tracking-wide text-white transition-all hover:bg-navy/90 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center font-inter text-xs text-muted">
          Sesión válida solo mientras el navegador esté abierto.
        </p>
      </div>
    </div>
  )
}
