import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function ResetPassword() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'request' | 'update' | 'invalid'>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update')
      }
    })
    const timer = setTimeout(() => {
      // If still in request mode after 1s, that's fine — no token in URL
    }, 1000)
    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) {
      setError('No se pudo enviar el correo. Verifica el email.')
    } else {
      setSuccess(true)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('Mínimo 8 caracteres.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(245,197,24,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div
            role="img"
            aria-label="Pádel SG"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gold font-manrope text-sm font-black text-navy"
          >
            P·SG
          </div>
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Pádel Saint George's
          </p>
        </div>

        <div className="rounded-2xl border border-navy-mid bg-navy-mid/50 px-8 py-8 backdrop-blur-sm">
          {mode === 'request' && !success && (
            <>
              <h1 className="mb-1 font-manrope text-xl font-bold text-white">
                Recuperar acceso
              </h1>
              <p className="mb-7 font-inter text-sm text-muted">
                Ingresa tu email y te enviaremos un enlace.
              </p>
              <form onSubmit={handleRequest} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block font-inter text-xs font-medium uppercase tracking-widest text-muted"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-navy-mid bg-navy px-4 py-3 font-inter text-sm text-white placeholder-slate transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    placeholder="tu@email.com"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-lg bg-gold py-3 font-manrope text-sm font-bold text-navy transition-all hover:bg-gold-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            </>
          )}

          {mode === 'request' && success && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mb-2 font-manrope text-lg font-bold text-white">Revisa tu correo</h2>
              <p className="font-inter text-sm text-muted">
                Si el email existe en el sistema, recibirás un enlace en los próximos minutos.
              </p>
            </div>
          )}

          {mode === 'update' && !success && (
            <>
              <h1 className="mb-1 font-manrope text-xl font-bold text-white">
                Nueva contraseña
              </h1>
              <p className="mb-7 font-inter text-sm text-muted">
                Elige una contraseña segura.
              </p>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block font-inter text-xs font-medium uppercase tracking-widest text-muted"
                  >
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-navy-mid bg-navy px-4 py-3 pr-11 font-inter text-sm text-white placeholder-slate transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate transition-colors hover:text-muted"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-1.5 block font-inter text-xs font-medium uppercase tracking-widest text-muted"
                  >
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full rounded-lg border border-navy-mid bg-navy px-4 py-3 font-inter text-sm text-white placeholder-slate transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    placeholder="Repite la contraseña"
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-lg border border-defeat/30 bg-defeat/10 px-4 py-3 font-inter text-sm text-defeat">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-lg bg-gold py-3 font-manrope text-sm font-bold text-navy transition-all hover:bg-gold-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </form>
            </>
          )}

          {mode === 'update' && success && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mb-2 font-manrope text-lg font-bold text-white">Contraseña actualizada</h2>
              <p className="font-inter text-sm text-muted">Redirigiendo al dashboard...</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center font-inter text-xs text-slate">
          <Link to="/login" className="text-muted transition-colors hover:text-gold">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  )
}
