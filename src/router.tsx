import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginForm } from '@/features/auth/LoginForm'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { PendingApproval } from '@/features/auth/PendingApproval'
import { ResetPassword } from '@/features/auth/ResetPassword'
import { EmergencyLogin } from '@/features/auth/EmergencyLogin'

const PendingUsers = lazy(() => import('./features/admin/PendingUsers').then(m => ({ default: m.PendingUsers })))
const AdminTemporadas = lazy(() => import('./features/admin/AdminTemporadas'))
const AdminJugadores = lazy(() => import('./features/admin/AdminJugadores'))
const TorneosList = lazy(() => import('./features/torneos/TorneosList'))
const TorneoDetalle = lazy(() => import('./features/torneos/TorneoDetalle'))
const LigasList = lazy(() => import('./features/ligas/LigasList'))
const LigaDetalle = lazy(() => import('./features/ligas/LigaDetalle'))
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const AmistososPage = lazy(() => import('./features/amistosos/AmistososPage'))
const JugadoresPage = lazy(() => import('./features/jugadores/JugadoresPage'))
const JugadorDetalle = lazy(() => import('./features/jugadores/JugadorDetalle'))
const FinanzasPage = lazy(() => import('./features/finanzas/FinanzasPage'))
const MasPage = lazy(() => import('./features/mas/MasPage'))
const CalendarioPage = lazy(() => import('./features/calendario/CalendarioPage'))
const RankingPage = lazy(() => import('./features/ranking/RankingPage'))
const PerfilPage = lazy(() => import('./features/perfil/PerfilPage'))
const TesoreriaAdmin = lazy(() => import('./features/tesoreria/TesoreriaAdmin'))

const fallback = (
  <div className="flex h-full items-center justify-center text-muted">Cargando…</div>
)

export const router = createBrowserRouter([
  { path: '/login', element: <LoginForm /> },
  { path: '/registro', element: <RegisterForm /> },
  { path: '/pendiente', element: <PendingApproval /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/emergencia', element: <EmergencyLogin /> },
  {
    path: '/',
    element: (
      <AuthGuard>
        <Suspense fallback={fallback}>
          <AppShell />
        </Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'admin/usuarios', element: <PendingUsers /> },
      { path: 'admin/temporadas', element: <AdminTemporadas /> },
      { path: 'admin/tesoreria', element: <TesoreriaAdmin /> },
      { path: 'admin/jugadores', element: <AdminJugadores /> },
      { path: 'torneos', element: <TorneosList /> },
      { path: 'torneos/:id', element: <TorneoDetalle /> },
      { path: 'ligas', element: <LigasList /> },
      { path: 'ligas/:id', element: <LigaDetalle /> },
      { path: 'jugadores', element: <JugadoresPage /> },
      { path: 'jugadores/:id', element: <JugadorDetalle /> },
      { path: 'rankings', element: <RankingPage /> },
      { path: 'amistosos', element: <AmistososPage /> },
      { path: 'calendario', element: <CalendarioPage /> },
      { path: 'finanzas', element: <FinanzasPage /> },
      { path: 'mas', element: <MasPage /> },
      { path: 'perfil', element: <PerfilPage /> },
    ],
  },
])
