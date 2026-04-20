import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// requireAdmin: ruta solo para admins
// publicOnly: ruta solo para no autenticados (login, registro)
export function ProtectedRoute({ children, requireAdmin = false, publicOnly = false }) {
  const { user, jugador, cargando } = useAuth()

  if (cargando) return <Spinner />

  // Rutas públicas (login/registro): redirigir si ya está autenticado
  if (publicOnly) {
    if (!user) return children
    if (!jugador) return <Spinner />
    if (jugador.estado_cuenta === 'pendiente') return <Navigate to="/pendiente" replace />
    return <Navigate to="/" replace />
  }

  // Rutas protegidas
  if (!user) return <Navigate to="/login" replace />
  if (!jugador) return <Spinner />

  if (jugador.estado_cuenta === 'suspendido') return <Navigate to="/suspendido" replace />
  if (jugador.estado_cuenta === 'pendiente') return <Navigate to="/pendiente" replace />
  if (requireAdmin && jugador.rol !== 'superadmin' && jugador.rol !== 'admin_torneo') return <Navigate to="/" replace />

  return children
}
