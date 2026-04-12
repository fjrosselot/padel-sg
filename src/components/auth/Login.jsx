import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Logo SVG: capas apiladas (marca St. George)
function Logo({ dark = false }) {
  const color = dark ? '#ffffff' : '#071b3b'
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 20" fill={color} className="w-7 h-6 shrink-0">
          <rect x="0"  y="0"   width="24" height="5"  rx="1.5"/>
          <rect x="2"  y="7.5" width="20" height="5"  rx="1.5"/>
          <rect x="5"  y="15"  width="14" height="5"  rx="1.5"/>
        </svg>
        <span
          className="font-headline font-black text-xl italic tracking-tighter leading-none"
          style={{ color }}
        >
          ST. GEORGE
        </span>
      </div>
      <span className="font-headline font-bold text-[0.625rem] tracking-[0.3em] uppercase ml-9 text-primary-container">
        ELITE PADEL
      </span>
    </div>
  )
}

// Icono Material Symbol inline
function MSymbol({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined select-none ${className}`}>
      {name}
    </span>
  )
}

// Panel izquierdo (solo desktop): cancha con overlay editorial
function PanelVisual() {
  return (
    <section className="hidden lg:flex lg:w-3/5 relative overflow-hidden items-end p-20 bg-inverse-surface">
      {/* Fondo con degradado de marca como fallback */}
      <div className="absolute inset-0 editorial-gradient opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-inverse-surface/60 to-transparent" />

      {/* Contenido editorial */}
      <div className="relative z-10 space-y-4">
        <Logo dark />
        <h1 className="text-white font-headline font-extrabold text-7xl tracking-tight leading-tight uppercase">
          DOMINA<br/>LA PISTA
        </h1>
        <div className="w-24 h-1.5 bg-primary-container rounded-full" />
      </div>

      {/* Decoración ambiental */}
      <div className="absolute top-0 right-0 w-80 h-80 editorial-gradient opacity-10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
    </section>
  )
}

export default function Login() {
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await signIn(form.email.trim(), form.password)
    if (error) {
      setError('Email o contraseña incorrectos.')
      setCargando(false)
      return
    }
    navigate('/')
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!form.email.trim()) {
      setError('Ingresa tu email para restablecer la contraseña.')
      return
    }
    setCargando(true)
    const { error } = await resetPassword(form.email.trim())
    setCargando(false)
    if (error) setError('No se pudo enviar el email de recuperación.')
    else setResetEnviado(true)
  }

  return (
    <main className="flex min-h-screen font-body">
      {/* Panel visual izquierdo (desktop) */}
      <PanelVisual />

      {/* Panel de formulario: derecha en desktop, pantalla completa en mobile */}
      <section className="w-full lg:w-2/5 flex flex-col justify-center bg-surface-container-lowest px-8 sm:px-14 lg:px-20 py-12 shadow-ambient-md z-20">
        <div className="max-w-md w-full mx-auto space-y-10">

          {/* Branding mobile (solo visible en < lg) */}
          <div className="lg:hidden">
            <Logo dark={false} />
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h2 className="font-headline font-bold text-3xl uppercase tracking-wide text-on-surface">
              Iniciar sesión
            </h2>
            <p className="text-outline font-medium text-sm">
              Introduce tus credenciales para acceder al club.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Campo email */}
            <div className="space-y-1">
              <label htmlFor="email" className="label-editorial">
                Email
              </label>
              <div className="relative">
                <MSymbol
                  name="alternate_email"
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant text-xl pointer-events-none"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className="input-underline w-full pl-8 py-3 text-sm font-medium text-on-surface placeholder:text-outline-variant"
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="label-editorial">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={cargando}
                  className="text-[0.625rem] font-semibold text-primary hover:text-primary-container transition-colors uppercase tracking-wider disabled:opacity-50"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <MSymbol
                  name="lock_open"
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-outline-variant text-xl pointer-events-none"
                />
                <input
                  id="password"
                  name="password"
                  type={mostrarPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-underline w-full pl-8 pr-10 py-3 text-sm font-medium text-on-surface placeholder:text-outline-variant"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarPass(v => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
                  aria-label={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <MSymbol name={mostrarPass ? 'visibility_off' : 'visibility'} className="text-xl" />
                </button>
              </div>
            </div>

            {/* Mensajes de feedback */}
            {error && (
              <p className="text-sm text-error font-medium text-center" role="alert">{error}</p>
            )}
            {resetEnviado && (
              <p className="text-sm text-tertiary font-medium text-center">
                Te enviamos un email para restablecer tu contraseña.
              </p>
            )}

            {/* CTA principal */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full editorial-gradient text-on-primary font-headline font-bold py-4 rounded-xl shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-60 disabled:scale-100"
            >
              {cargando ? 'Ingresando…' : 'INICIAR SESIÓN'}
            </button>
          </form>

          {/* Link de registro */}
          <p className="text-center text-sm font-medium text-outline">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-primary font-bold hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>

        {/* Footer meta */}
        <footer className="mt-auto pt-10 flex justify-between items-center text-[10px] font-label font-bold uppercase tracking-widest text-outline-variant">
          <span>© 2025 ST. GEORGE ELITE PADEL</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Términos</a>
          </div>
        </footer>
      </section>

      {/* Decoración ambiental */}
      <div className="fixed top-0 right-0 w-64 h-64 editorial-gradient opacity-5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-primary opacity-5 rounded-full blur-[150px] -ml-48 -mb-48 pointer-events-none" />
    </main>
  )
}
