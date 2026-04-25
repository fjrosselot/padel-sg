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

const ColorCodingMockup = lazy(() => import('./features/mockups/ColorCodingMockup'))
const DashboardMockup = lazy(() => import('./features/mockups/DashboardMockup'))
const CalendarioMockup = lazy(() => import('./features/mockups/CalendarioMockup'))
const TorneoDetalleMockup = lazy(() => import('./features/mockups/TorneoDetalleMockup'))
const ParejasMockup = lazy(() => import('./features/mockups/ParejasMockup'))
const LandingsMockup = lazy(() => import('./features/mockups/LandingsMockup'))
const MockupsIndex = lazy(() => import('./features/mockups/MockupsIndex'))

const isMockupHub = import.meta.env.VITE_MOCKUP_HUB === 'true'

const fallback = (
  <div className="flex h-full items-center justify-center text-muted">Cargando…</div>
)

export const router = createBrowserRouter([
  { path: '/mockup', element: <Suspense fallback={fallback}><MockupsIndex /></Suspense> },
  { path: '/mockup/padel-sg/color-coding', element: <Suspense fallback={fallback}><ColorCodingMockup /></Suspense> },
  { path: '/mockup/padel-sg/dashboard', element: <Suspense fallback={fallback}><DashboardMockup /></Suspense> },
  { path: '/mockup/padel-sg/calendario', element: <Suspense fallback={fallback}><CalendarioMockup /></Suspense> },
  { path: '/mockup/padel-sg/torneo-detalle', element: <Suspense fallback={fallback}><TorneoDetalleMockup /></Suspense> },
  { path: '/mockup/padel-sg/parejas', element: <Suspense fallback={fallback}><ParejasMockup /></Suspense> },
  { path: '/mockup/padel-sg/landings', element: <Suspense fallback={fallback}><LandingsMockup /></Suspense> },
  ...(isMockupHub ? [{ path: '/', element: <Navigate to="/mockup" replace /> }] : []),
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
