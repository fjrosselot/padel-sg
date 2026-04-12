import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Trophy, Grid3x3,
  Layers, Handshake, Calendar, Wallet, Settings,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'

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

export function Sidebar() {
  return (
    <nav className="group hidden w-12 flex-col bg-navy transition-all duration-200 hover:w-56 md:flex">
      <div className="flex h-14 items-center justify-center px-1.5 group-hover:justify-start group-hover:px-4">
        <BrandLogo variant="compact" className="shrink-0" />
        <span className="ml-2 hidden font-manrope text-sm font-bold text-gold group-hover:block">
          Pádel SG
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-1 px-1.5 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                `flex h-9 items-center rounded-md px-2 transition-colors ${
                  isActive
                    ? 'bg-gold text-navy'
                    : 'text-muted hover:bg-navy-mid hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="ml-3 hidden whitespace-nowrap font-inter text-sm font-medium group-hover:block">
                {label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="border-t border-navy-mid px-1.5 py-3">
        <NavLink
          to="/admin/usuarios"
          aria-label="Admin"
          className={({ isActive }) =>
            `flex h-9 items-center rounded-md px-2 transition-colors ${
              isActive ? 'bg-gold text-navy' : 'text-muted hover:bg-navy-mid hover:text-white'
            }`
          }
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="ml-3 hidden font-inter text-sm font-medium group-hover:block">Admin</span>
        </NavLink>
      </div>
    </nav>
  )
}
