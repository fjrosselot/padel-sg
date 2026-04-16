import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Trophy, Grid3x3,
  Layers, Handshake, Calendar, Wallet, Settings,
  UserCog, Timer,
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

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
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
        <span className="ml-3 hidden whitespace-nowrap font-inter text-sm font-medium group-hover:block">
          {label}
        </span>
      </NavLink>
    </li>
  )
}

export function Sidebar() {
  const { data: user } = useUser()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  return (
    <nav className="group hidden w-12 flex-col bg-navy transition-all duration-200 hover:w-56 md:flex">
      <div className="flex h-14 items-center justify-center px-1.5 group-hover:justify-start group-hover:px-4">
        <BrandLogo variant="compact" className="shrink-0" />
        <span className="ml-2 hidden font-manrope text-sm font-bold text-gold group-hover:block">
          Pádel SG
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-1 px-1.5 py-2">
        {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
      </ul>

      {isAdmin && (
        <div className="border-t border-navy-mid px-1.5 py-3 space-y-0.5">
          <p className="hidden px-2 pb-1 font-inter text-[9px] font-bold uppercase tracking-widest text-muted/50 group-hover:block">
            Admin
          </p>
          {/* Icono colapsado: solo Settings */}
          <div className="group-hover:hidden">
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
          </div>
          {/* Items expandidos */}
          <ul className="hidden group-hover:flex flex-col gap-0.5">
            {ADMIN_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
          </ul>
        </div>
      )}
    </nav>
  )
}
