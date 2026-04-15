import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function PendingApproval() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div
            role="img"
            aria-label="Pádel SG"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gold font-manrope text-sm font-black text-navy"
          >
            P·SG
          </div>
        </div>

        <div className="rounded-2xl border border-navy-mid bg-navy-mid/50 px-8 py-8 backdrop-blur-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="mb-2 font-manrope text-xl font-bold text-white">
            Solicitud recibida
          </h1>
          <p className="mb-6 font-inter text-sm leading-relaxed text-muted">
            Tu solicitud de acceso está siendo revisada. Recibirás un email cuando el administrador apruebe tu cuenta.
          </p>

          <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 text-left">
            <p className="font-inter text-xs text-muted">
              ¿Tienes preguntas? Contacta al administrador de la rama pádel.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            to="/login"
            className="font-inter text-xs text-slate transition-colors hover:text-muted"
          >
            Volver al inicio
          </Link>
          <span className="text-navy-mid">·</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="font-inter text-xs text-muted transition-colors hover:text-defeat"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
