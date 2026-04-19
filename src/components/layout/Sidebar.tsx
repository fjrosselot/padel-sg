import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Trophy, Grid3x3,
  Layers, Handshake, Calendar, Wallet, Settings,
  UserCog, Timer, ChevronRight,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { useUser } from '@/hooks/useUser'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jugadores', icon: Users, label: 'Jugadores' },
  { to: '/rankings', icon: Trophy, label: 'Rankings' },
  { to: '/torneos', icon: Grid3x3, label: 'Torneos' },
  { to: '/ligas', icon: Layers, label: 'Ligas' },
  { to: '/amistosos', icon: Handshake, label: 'Amistosos' },
  { to: '/calendario', icon: Calendar, label: 'Calendario' },
  { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
]

const ADMIN_ITEMS = [
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/jugadores', icon: UserCog, label: 'Jugadores' },
  { to: '/admin/temporadas', icon: Timer, label: 'Temporadas' },
]

function NavItem({ to, icon: Icon, label, expanded }: { to: string; icon: React.ElementType; label: string; expanded: boolean }) {
  return (
    <li>
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
    </li>
  )
}

export function Sidebar() {
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'
  const [expanded, setExpanded] = useState(false)

  return (
    <nav className={`hidden flex-col bg-navy transition-all duration-200 md:flex ${expanded ? 'w-56' : 'w-12'}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex h-14 w-full items-center px-1.5 hover:bg-navy-mid transition-colors"
        aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}
      >
        {expanded ? (
          <>
            <BrandLogo variant="compact" className="shrink-0" />
            <span className="ml-2 font-manrope text-sm font-bold text-gold flex-1 text-left">Pádel SG</span>
            <ChevronRight className="h-4 w-4 text-muted rotate-180 shrink-0" />
          </>
        ) : (
          <BrandLogo variant="compact" className="shrink-0" />
        )}
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
          )}
        </div>
      )}
    </nav>
  )
}
