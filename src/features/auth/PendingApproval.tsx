import { Link, useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AuthCard } from './AuthCard'

export function PendingApproval() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <AuthCard>
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
          <Clock className="h-6 w-6 text-gold" />
        </div>

        <div>
          <h1 className="font-manrope text-xl font-bold text-navy mb-2">Solicitud recibida</h1>
          <p className="font-inter text-sm leading-relaxed text-muted">
            Tu solicitud de acceso está siendo revisada. Recibirás un email cuando el administrador apruebe tu cuenta.
          </p>
        </div>

        <div className="rounded-lg border border-gold/20 bg-gold/8 px-4 py-3 text-left">
          <p className="font-inter text-xs text-slate">
            ¿Tienes preguntas? Contacta al administrador de la rama pádel.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Link to="/login" className="font-inter text-xs text-muted transition-colors hover:text-navy">
          Volver al inicio
        </Link>
        <span className="text-navy/20">·</span>
        <button type="button" onClick={handleSignOut}
          className="font-inter text-xs text-muted transition-colors hover:text-defeat">
          Cerrar sesión
        </button>
      </div>
    </AuthCard>
  )
}
