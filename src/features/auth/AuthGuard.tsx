import { Navigate } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.estado_cuenta === 'pendiente') return <Navigate to="/pendiente" replace />
  if (user.estado_cuenta === 'suspendido' || user.estado_cuenta === 'inactivo') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
