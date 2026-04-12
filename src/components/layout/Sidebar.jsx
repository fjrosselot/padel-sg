import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard', icon: 'dashboard' },
  { to: '/torneos',    label: 'Torneos',   icon: 'emoji_events' },
  { to: '/ligas',      label: 'Ligas',     icon: 'workspace_premium' },
  { to: '/jugadores',  label: 'Jugadores', icon: 'group' },
  { to: '/calendario', label: 'Calendario',icon: 'calendar_month' },
  { to: '/pagos',      label: 'Pagos',     icon: 'payments' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-inverse-surface shadow-xl flex flex-col p-4 z-50">
      {/* Brand Header */}
      <div className="mb-10 px-4 pt-4">
        <h1 className="text-white font-headline font-black italic tracking-tighter text-2xl">ST. GEORGE</h1>
        <p className="text-slate-400 text-[0.65rem] font-label font-bold uppercase tracking-[0.2em] mt-1">
          Elite Padel Management
        </p>
      </div>

      {/* Navegación principal */}
      <nav className="flex-grow space-y-1">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive
                    ? 'bg-primary-container text-white shadow-lg shadow-primary-container/40 backdrop-blur-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1'
                  }`}
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="font-headline text-[0.75rem] font-bold uppercase tracking-widest">
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="mt-auto border-t border-white/10 pt-4 space-y-1">
        <button
          className="w-full editorial-gradient text-white py-3 px-4 rounded-xl font-headline text-[0.7rem] font-bold uppercase tracking-wider shadow-lg mb-4 hover:scale-105 transition-transform"
        >
          Nuevo Torneo
        </button>
        <a
          href="#"
          className="text-slate-400 hover:text-white flex items-center gap-3 px-4 py-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">help</span>
          <span className="font-headline text-[0.7rem] font-bold uppercase tracking-widest">Soporte</span>
        </a>
        <a
          href="#"
          className="text-slate-400 hover:text-white flex items-center gap-3 px-4 py-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="font-headline text-[0.7rem] font-bold uppercase tracking-widest">Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  )
}
