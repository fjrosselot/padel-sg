import { Navigate } from 'react-router-dom'
import { useUser } from '../../hooks/useUser'

export default function PerfilPage() {
  const { data: user, isLoading } = useUser()
  if (isLoading) return <div className="p-6 font-inter text-sm text-muted">Cargando…</div>
  if (!user?.id) return <Navigate to="/login" replace />
  return <Navigate to={`/jugadores/${user.id}`} replace />
}
