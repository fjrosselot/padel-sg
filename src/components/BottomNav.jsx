import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/',           label: 'Inicio',    icon: 'home' },
  { to: '/calendario', label: 'Agenda',    icon: 'calendar_month' },
  { to: '/torneos',    label: 'Torneos',   icon: 'emoji_events' },
  { to: '/jugadores',  label: 'Jugadores', icon: 'group' },
  { to: '/ranking',    label: 'Ranking',   icon: 'bar_chart' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-3 pb-6 pt-3 bg-surface-container-lowest rounded-t-3xl shadow-[0_-10px_40px_rgba(7,27,59,0.08)]">
      {ITEMS.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to === '/'}>
          {({ isActive }) => (
            <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 ease-out
              ${isActive
                ? 'bg-primary-container text-white scale-110 shadow-lg shadow-primary-container/30'
                : 'text-on-surface/40 hover:text-on-surface/70 active:scale-90'
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{
                  fontVariationSettings: isActive
                    ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                }}
              >
                {icon}
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1 font-label">{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
