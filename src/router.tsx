import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { LoginForm } from '@/features/auth/LoginForm'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { PendingApproval } from '@/features/auth/PendingApproval'
import { PendingUsers } from '@/features/admin/PendingUsers'
import TorneosList from './features/torneos/TorneosList'
import TorneoDetalle from './features/torneos/TorneoDetalle'
import LigasList from './features/ligas/LigasList'
import LigaDetalle from './features/ligas/LigaDetalle'
import { Dashboard } from './features/dashboard/Dashboard'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginForm /> },
  { path: '/registro', element: <RegisterForm /> },
  { path: '/pendiente', element: <PendingApproval /> },
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
      { path: 'torneos', element: <TorneosList /> },
      { path: 'torneos/:id', element: <TorneoDetalle /> },
      { path: 'ligas', element: <LigasList /> },
      { path: 'ligas/:id', element: <LigaDetalle /> },
    ],
  },
])
