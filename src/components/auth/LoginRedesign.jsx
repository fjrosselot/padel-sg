import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginRedesign() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Visual Section: Left Side (Desktop) */}
      <section className="hidden lg:flex lg:w-3/5 relative overflow-hidden items-end p-20">
        <div className="absolute inset-0 z-0">
          <img
            alt="Padel Court"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3sPoT1snxddu4dlZoCEr8EKL5RgPMiIyVyZUYKS3wlK2kPa1FglWGaagmMjvSTzcsyrEw8Kfmxp7UPiljQYmrpt9LjDv84LOjbH4X-mkPPLB-wvcdK4o67-OuFB6j8R8h_lKX13UVCrSgxtgdD8T_ym-Wr96ChXc8N0_k_hHE-NWbsQ4MCHvCxRA4xre1cR_nCqy1V0bDq-YtLzH8kgjUM_dRuiGKNsuyYafkCSZBwvHOgW-OUnehjRnbJPQTSf51GboMkqTS_Kw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/40 to-transparent"></div>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col">
            <span className="text-white font-headline font-black text-6xl italic tracking-tighter leading-none">
              ST. GEORGE
            </span>
            <span className="text-primary-container font-headline font-bold text-lg tracking-[0.3em] ml-1">
              ELITE PADEL
            </span>
          </div>
          <h1 className="text-white font-headline font-extrabold text-7xl tracking-tight leading-tight uppercase">
            DOMINA<br />LA PISTA
          </h1>
          <div className="w-24 h-1.5 bg-primary-container rounded-full"></div>
        </div>
      </section>

      {/* Form Section: Right Side (Desktop) / Full Screen (Mobile) */}
      <section className="w-full lg:w-2/5 flex flex-col justify-center bg-surface-container-lowest px-8 sm:px-16 lg:px-24 py-12 shadow-2xl z-20">
        <div className="max-w-md w-full mx-auto space-y-10">
          {/* Mobile Branding */}
          <div className="lg:hidden flex flex-col mb-8">
            <span className="text-on-background font-headline font-black text-3xl italic tracking-tighter">
              ST. GEORGE
            </span>
            <span className="text-primary font-headline font-bold text-xs tracking-widest uppercase">
              Elite Padel
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-on-surface font-headline font-bold text-3xl uppercase tracking-wide">
              Acceso Administrador
            </h2>
            <p className="text-outline font-medium">
              Introduce tus credenciales para gestionar el club.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                className="block text-xs font-label font-semibold text-on-surface-variant tracking-widest uppercase"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant text-xl">
                  alternate_email
                </span>
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-surface-container-highest pl-8 py-3 font-medium text-on-surface placeholder:text-outline-variant transition-all input-focus-ring"
                  id="email"
                  name="email"
                  placeholder="admin@stgeorgepadel.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label
                  className="block text-xs font-label font-semibold text-on-surface-variant tracking-widest uppercase"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  className="text-xs font-semibold text-primary hover:text-primary-container transition-colors uppercase tracking-wider"
                  to="/reset-password"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant text-xl">
                  lock_open
                </span>
                <input
                  className="w-full bg-transparent border-0 border-b-2 border-surface-container-highest pl-8 py-3 font-medium text-on-surface placeholder:text-outline-variant transition-all input-focus-ring"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="w-full editorial-gradient text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={cargando}
            >
              {cargando ? 'Iniciando sesión...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-container-highest"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-label font-semibold bg-surface-container-lowest px-4 text-outline-variant">
              O entrar con
            </div>
          </div>

          {/* Social Login (placeholder - no implementado) */}
          <div className="grid grid-cols-2 gap-4">
            <button
              className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-surface-container-high hover:bg-surface-container-low transition-colors group"
              type="button"
              disabled
              title="Próximamente"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Google
              </span>
            </button>
            <button
              className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-surface-container-high hover:bg-surface-container-low transition-colors group"
              type="button"
              disabled
              title="Próximamente"
            >
              <svg className="w-5 h-5 fill-on-background" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05 1.61-3.46 1.61-1.43 0-1.85-.88-3.59-.88-1.76 0-2.25.85-3.56.88-1.38.03-2.61-.79-3.66-2.26-2.14-3.03-1.64-7.79 1.12-10.33 1.36-1.25 2.97-1.95 4.51-1.95 1.6 0 2.51.87 3.96.87 1.39 0 2.06-.87 3.94-.87 1.25 0 2.53.53 3.53 1.48-2.6 1.48-2.18 5.22.42 6.5-1 2.37-2.3 4.02-3.27 4.95zM15.52 1.17c0 1.95-1.57 3.51-3.48 3.51-.23 0-.46-.02-.68-.07.05-1.95 1.61-3.55 3.48-3.55.25 0 .49.03.68.11z"></path>
              </svg>
              <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Apple
              </span>
            </button>
          </div>

          <div className="pt-8 text-center">
            <p className="text-sm font-medium text-outline">
              ¿No tienes acceso?{' '}
              <a className="text-primary font-bold hover:underline" href="#">
                Contacta con Soporte
              </a>
            </p>
          </div>
        </div>

        {/* Footer Meta */}
        <footer className="mt-auto pt-10 flex justify-between items-center text-[10px] font-label font-bold uppercase tracking-widest text-outline-variant">
          <span>© 2024 ST. GEORGE ELITE PADEL</span>
          <div className="flex gap-4">
            <a className="hover:text-primary transition-colors" href="#">
              Privacidad
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Términos
            </a>
          </div>
        </footer>
      </section>

      {/* Decoration Layer */}
      <div className="fixed top-0 right-0 w-64 h-64 editorial-gradient opacity-5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary opacity-5 rounded-full blur-[150px] -ml-48 -mb-48 pointer-events-none"></div>
    </main>
  )
}
