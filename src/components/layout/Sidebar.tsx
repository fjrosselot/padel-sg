import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Trophy, Medal,
  Handshake, CalendarDays, Banknote, Settings,
  UserCog, ChevronRight, LogOut, Wallet, Tag, ClipboardList,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jugadores', icon: Users, label: 'Jugadores' },
  { to: '/rankings', icon: Medal, label: 'Rankings' },
  { to: '/torneos', icon: Trophy, label: 'Torneos' },
  { to: '/amistosos', icon: Handshake, label: 'Amistosos' },
  { to: '/calendario', icon: CalendarDays, label: 'Calendario' },
  { to: '/finanzas', icon: Banknote, label: 'Pagos' },
]

const ADMIN_ITEMS = [
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/jugadores', icon: UserCog, label: 'Jugadores' },
  { to: '/admin/tesoreria', icon: Wallet, label: 'Tesorería' },
  { to: '/admin/categorias', icon: Tag, label: 'Categorías' },
  { to: '/admin/partidos', icon: ClipboardList, label: 'Partidos' },
]

function NavItem({ to, icon: Icon, label, expanded }: { to: string; icon: React.ElementType; label: string; expanded: boolean }) {
  return (
    <li className="relative group/navitem">
      <NavLink
        to={to}
        aria-label={label}
        className={({ isActive }) =>
          `flex h-9 items-center rounded-md px-2 transition-colors ${
            isActive ? 'bg-gold text-navy' : 'text-muted hover:bg-navy-mid hover:text-white'
          }`
        }
      >
        <Icon className="h-5 w-5 shrink-0" />
        {expanded && (
          <span className="ml-3 whitespace-nowrap font-inter text-sm font-medium">
            {label}
          </span>
        )}
      </NavLink>
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-navy-mid px-2.5 py-1 font-inter text-xs font-semibold text-white opacity-0 transition-opacity group-hover/navitem:opacity-100">
        {label}
      </span>
    </li>
  )
}

export function Sidebar() {
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [expanded, setExpanded] = useState(true)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className={`hidden h-full flex-col bg-navy transition-all duration-200 md:flex ${expanded ? 'w-56' : 'w-12'}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex h-14 w-full items-center justify-center px-2 hover:bg-navy-mid transition-colors"
        aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}
      >
        <ChevronRight className={`h-5 w-5 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <ul className="flex flex-1 flex-col gap-1 px-1.5 py-2">
        {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} expanded={expanded} />)}
      </ul>

      {isAdmin && (
        <div className="border-t border-navy-mid px-1.5 py-3 space-y-0.5">
          {expanded && (
            <p className="px-2 pb-1 font-inter text-[9px] font-bold uppercase tracking-widest text-muted/50">
              Admin
            </p>
          )}
          {expanded ? (
            <ul className="flex flex-col gap-0.5">
              {ADMIN_ITEMS.map(item => <NavItem key={item.to} {...item} expanded={expanded} />)}
            </ul>
          ) : (
            <div className="relative group/navitem">
              <NavLink
                to="/admin/jugadores"
                aria-label="Admin"
                className={({ isActive }) =>
                  `flex h-9 items-center rounded-md px-2 transition-colors ${
                    isActive ? 'bg-gold text-navy' : 'text-muted hover:bg-navy-mid hover:text-white'
                  }`
                }
              >
                <Settings className="h-5 w-5 shrink-0" />
              </NavLink>
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-navy-mid px-2.5 py-1 font-inter text-xs font-semibold text-white opacity-0 transition-opacity group-hover/navitem:opacity-100">
                Admin
              </span>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-white/10 px-2 py-2 space-y-1">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-full items-center rounded-md px-2 text-muted hover:bg-red-900/40 hover:text-red-300 transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {expanded && (
            <span className="ml-3 font-inter text-sm font-medium">Cerrar sesión</span>
          )}
        </button>

        <div className={`flex items-center px-2 py-1 ${expanded ? 'justify-between' : 'justify-center'}`}>
          {expanded && <span className="font-inter text-[10px] text-white/30">versión</span>}
          <span className="font-inter text-xs font-bold text-gold">v{__APP_VERSION__}</span>
        </div>
      </div>
    </nav>
  )
}
