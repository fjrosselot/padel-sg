import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BrandLogo } from '@/components/brand/BrandLogo'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: jugador } = await supabase
      .from('jugadores')
      .select('estado_cuenta')
      .eq('id', user.id)
      .single()
    if ((jugador as unknown as Record<string, unknown>)?.estado_cuenta === 'pendiente') {
      navigate('/pendiente')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy px-4">
      {/* Faint radial glow behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(245,197,24,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
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

        {/* Card */}
        <div className="rounded-2xl border border-navy-mid bg-navy-mid/50 px-8 py-8 backdrop-blur-sm">
          <h1 className="mb-1 font-manrope text-xl font-bold text-white">
            Bienvenido
          </h1>
          <p className="mb-7 font-inter text-sm text-muted">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="font-inter text-xs font-medium uppercase tracking-widest text-muted"
                >
                  Contraseña
                </label>
                <Link
                  to="/reset-password"
                  className="font-inter text-xs text-muted transition-colors hover:text-gold"
                >
                  ¿Olvidaste la tuya?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-navy-mid bg-navy px-4 py-3 pr-11 font-inter text-sm text-white placeholder-slate transition-colors focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="••••••••"
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
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-inter text-xs text-slate">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-muted transition-colors hover:text-gold">
            Solicitar acceso
          </Link>
        </p>
      </div>
    </div>
  )
}
