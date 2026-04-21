import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, Handshake, CalendarDays, MoreHorizontal } from 'lucide-react'

const BOTTOM_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/jugadores', icon: Users, label: 'Jugadores' },
  { to: '/torneos', icon: Trophy, label: 'Torneos' },
  { to: '/amistosos', icon: Handshake, label: 'Amistosos' },
  { to: '/calendario', icon: CalendarDays, label: 'Calendario' },
  { to: '/mas', icon: MoreHorizontal, label: 'Más' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex bg-white shadow-modal md:hidden">
      {BOTTOM_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 font-inter text-[10px] transition-colors ${
              isActive ? 'text-gold' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {isActive && <span className="mt-0.5 h-1 w-1 rounded-full bg-gold" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
