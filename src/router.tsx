import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

function lazyWithReload<T extends { default: React.ComponentType<unknown> }>(
  factory: () => Promise<T>
): React.LazyExoticComponent<T['default']> {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload()
      return new Promise<T>(() => {})
    })
  )
}
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginForm } from '@/features/auth/LoginForm'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { PendingApproval } from '@/features/auth/PendingApproval'
import { ResetPassword } from '@/features/auth/ResetPassword'
import { EmergencyLogin } from '@/features/auth/EmergencyLogin'
const SetupEmailPage = lazyWithReload(() => import('@/features/auth/SetupEmailPage'))

const PendingUsers = lazyWithReload(() => import('./features/admin/PendingUsers').then(m => ({ default: m.PendingUsers })))
const AdminTemporadas = lazyWithReload(() => import('./features/admin/AdminTemporadas'))
const AdminJugadores = lazyWithReload(() => import('./features/admin/AdminJugadores'))
const TorneosList = lazyWithReload(() => import('./features/torneos/TorneosList'))
const TorneoDetalle = lazyWithReload(() => import('./features/torneos/TorneoDetalle'))
const Dashboard = lazyWithReload(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })))
const AmistososPage = lazyWithReload(() => import('./features/amistosos/AmistososPage'))
const JugadoresPage = lazyWithReload(() => import('./features/jugadores/JugadoresPage'))
const JugadorDetalle = lazyWithReload(() => import('./features/jugadores/JugadorDetalle'))
const JugadorPartidos = lazyWithReload(() => import('./features/jugadores/JugadorPartidos'))
const FinanzasPage = lazyWithReload(() => import('./features/finanzas/FinanzasPage'))
const MasPage = lazyWithReload(() => import('./features/mas/MasPage'))
const CalendarioPage = lazyWithReload(() => import('./features/calendario/CalendarioPage'))
const RankingPage = lazyWithReload(() => import('./features/ranking/RankingPage'))
const PerfilPage = lazyWithReload(() => import('./features/perfil/PerfilPage'))
const TesoreriaAdmin = lazyWithReload(() => import('./features/tesoreria/TesoreriaAdmin'))
const AdminCategorias = lazyWithReload(() => import('./features/admin/AdminCategorias'))
const AdminPartidos = lazyWithReload(() => import('./features/admin/AdminPartidos'))
const AdminNovedades = lazyWithReload(() => import('./features/admin/AdminNovedades'))

const ColorCodingMockup = lazyWithReload(() => import('./features/mockups/ColorCodingMockup'))
const DashboardMockup = lazyWithReload(() => import('./features/mockups/DashboardMockup'))
const CalendarioMockup = lazyWithReload(() => import('./features/mockups/CalendarioMockup'))
const TorneoDetalleMockup = lazyWithReload(() => import('./features/mockups/TorneoDetalleMockup'))
const ParejasMockup = lazyWithReload(() => import('./features/mockups/ParejasMockup'))
const LandingsMockup = lazyWithReload(() => import('./features/mockups/LandingsMockup'))
const JugadorDetalleMockup = lazyWithReload(() => import('./features/mockups/JugadorDetalleMockup'))
const MockupsIndex = lazyWithReload(() => import('./features/mockups/MockupsIndex'))
const AsadosDashboardMockup = lazyWithReload(() => import('./features/mockups/AsadosDashboardMockup'))
const AsadosCortesListMockup = lazyWithReload(() => import('./features/mockups/AsadosCortesListMockup'))
const AsadosWizardMenuMockup  = lazyWithReload(() => import('./features/mockups/AsadosWizardMenuMockup'))
const AsadosWizardConfigMockup  = lazyWithReload(() => import('./features/mockups/AsadosWizardConfigMockup'))
const AsadosListaComprasMockup  = lazyWithReload(() => import('./features/mockups/AsadosListaComprasMockup'))
const AsadosRecetaDetalleMockup = lazyWithReload(() => import('./features/mockups/AsadosRecetaDetalleMockup'))

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
  { path: '/mockup/padel-sg/jugador-detalle', element: <Suspense fallback={fallback}><JugadorDetalleMockup /></Suspense> },
  { path: '/mockup/app-asados/dashboard', element: <Suspense fallback={fallback}><AsadosDashboardMockup /></Suspense> },
  { path: '/mockup/app-asados/cortes', element: <Suspense fallback={fallback}><AsadosCortesListMockup /></Suspense> },
  { path: '/mockup/app-asados/wizard-config', element: <Suspense fallback={fallback}><AsadosWizardConfigMockup /></Suspense> },
  { path: '/mockup/app-asados/lista-compras', element: <Suspense fallback={fallback}><AsadosListaComprasMockup /></Suspense> },
  { path: '/mockup/app-asados/wizard-menu', element: <Suspense fallback={fallback}><AsadosWizardMenuMockup /></Suspense> },
  { path: '/mockup/app-asados/receta-detalle', element: <Suspense fallback={fallback}><AsadosRecetaDetalleMockup /></Suspense> },
  { path: '/login', element: <LoginForm /> },
  { path: '/registro', element: <RegisterForm /> },
  { path: '/pendiente', element: <PendingApproval /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/configurar-acceso', element: <Suspense fallback={null}><SetupEmailPage /></Suspense> },
  { path: '/emergencia', element: <EmergencyLogin /> },
  {
    path: '/',
    element: isMockupHub ? (
      <Navigate to="/mockup" replace />
    ) : (
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
      { path: 'admin/categorias', element: <AdminCategorias /> },
      { path: 'admin/partidos', element: <AdminPartidos /> },
      { path: 'admin/novedades', element: <AdminNovedades /> },
      { path: 'torneos', element: <TorneosList /> },
      { path: 'torneos/:id', element: <TorneoDetalle /> },
      { path: 'jugadores', element: <JugadoresPage /> },
      { path: 'jugadores/:id', element: <JugadorDetalle /> },
      { path: 'jugadores/:id/partidos', element: <JugadorPartidos /> },
      { path: 'rankings', element: <RankingPage /> },
      { path: 'amistosos', element: <AmistososPage /> },
      { path: 'calendario', element: <CalendarioPage /> },
      { path: 'finanzas', element: <FinanzasPage /> },
      { path: 'mas', element: <MasPage /> },
      { path: 'perfil', element: <PerfilPage /> },
    ],
  },
])
