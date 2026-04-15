import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginForm } from '@/features/auth/LoginForm'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { PendingApproval } from '@/features/auth/PendingApproval'
import { ResetPassword } from '@/features/auth/ResetPassword'
import { PendingUsers } from '@/features/admin/PendingUsers'
import AdminTemporadas from './features/admin/AdminTemporadas'
import TorneosList from './features/torneos/TorneosList'
import TorneoDetalle from './features/torneos/TorneoDetalle'
import LigasList from './features/ligas/LigasList'
import LigaDetalle from './features/ligas/LigaDetalle'
import { Dashboard } from './features/dashboard/Dashboard'
import { ComingSoon } from '@/components/ComingSoon'
import { Users, Handshake, Calendar, Wallet, MoreHorizontal } from 'lucide-react'
import RankingPage from './features/ranking/RankingPage'
import PerfilPage from './features/perfil/PerfilPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginForm /> },
  { path: '/registro', element: <RegisterForm /> },
  { path: '/pendiente', element: <PendingApproval /> },
  { path: '/reset-password', element: <ResetPassword /> },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'admin/usuarios', element: <PendingUsers /> },
      { path: 'admin/temporadas', element: <AdminTemporadas /> },
      { path: 'torneos', element: <TorneosList /> },
      { path: 'torneos/:id', element: <TorneoDetalle /> },
      { path: 'ligas', element: <LigasList /> },
      { path: 'ligas/:id', element: <LigaDetalle /> },
      { path: 'jugadores', element: <ComingSoon title="Jugadores" icon={<Users className="h-8 w-8" />} /> },
      { path: 'rankings', element: <RankingPage /> },
      { path: 'amistosos', element: <ComingSoon title="Amistosos" icon={<Handshake className="h-8 w-8" />} /> },
      { path: 'calendario', element: <ComingSoon title="Calendario" icon={<Calendar className="h-8 w-8" />} /> },
      { path: 'finanzas', element: <ComingSoon title="Finanzas" icon={<Wallet className="h-8 w-8" />} /> },
      { path: 'mas', element: <ComingSoon title="Más opciones" icon={<MoreHorizontal className="h-8 w-8" />} /> },
      { path: 'perfil', element: <PerfilPage /> },
    ],
  },
])
