import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthCard, inputCls, labelCls } from './AuthCard'

export function ResetPassword() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'request' | 'update' | 'invalid'>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const params = new URLSearchParams(window.location.search)
        if (params.has('code') || window.location.hash.includes('type=recovery')) setMode('update')
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update')
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) setError('No se pudo enviar el correo. Verifica el email.')
    else setSuccess(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres.'); return }
    setLoading(true); setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Sesión expirada. Solicita un nuevo enlace.'); setLoading(false); setMode('request'); return
    }
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) setError(err.message || 'No se pudo actualizar la contraseña.')
    else { setSuccess(true); setTimeout(() => navigate('/dashboard'), 2000) }
  }

  return (
    <AuthCard>
      {mode === 'request' && !success && (
        <>
          <h1 className="font-manrope text-xl font-bold text-navy mb-1">Recuperar acceso</h1>
          <p className="font-inter text-sm text-muted mb-6">Ingresa tu email y te enviaremos un enlace.</p>
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input id="email" type="email" autoComplete="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={`${inputCls} pl-10`} />
              </div>
            </div>
            {error && <p className="font-inter text-xs text-defeat">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gold py-3 font-inter text-sm font-bold text-navy transition-all hover:bg-gold/90 active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        </>
      )}

      {mode === 'request' && success && (
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-victory/10">
            <CheckCircle2 className="h-6 w-6 text-victory" />
          </div>
          <h2 className="font-manrope text-lg font-bold text-navy">Revisa tu correo</h2>
          <p className="font-inter text-sm text-muted">Si el email existe, recibirás un enlace en los próximos minutos.</p>
        </div>
      )}

      {mode === 'update' && !success && (
        <>
          <h1 className="font-manrope text-xl font-bold text-navy mb-1">Nueva contraseña</h1>
          <p className="font-inter text-sm text-muted mb-6">Elige una contraseña segura.</p>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="password" className={labelCls}>Nueva contraseña</label>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm" className={labelCls}>Confirmar contraseña</label>
              <input id="confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password" required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                className={inputCls} />
            </div>
            {error && <p className="font-inter text-xs text-defeat">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-gold py-3 font-inter text-sm font-bold text-navy transition-all hover:bg-gold/90 active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        </>
      )}

      {mode === 'update' && success && (
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-victory/10">
            <CheckCircle2 className="h-6 w-6 text-victory" />
          </div>
          <h2 className="font-manrope text-lg font-bold text-navy">Contraseña actualizada</h2>
          <p className="font-inter text-sm text-muted">Redirigiendo al dashboard…</p>
        </div>
      )}

      <p className="mt-6 text-center font-inter text-xs text-muted">
        <Link to="/login" className="hover:text-navy transition-colors">← Volver al inicio</Link>
      </p>
    </AuthCard>
  )
}
