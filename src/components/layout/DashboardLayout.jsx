import { Sidebar } from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

function TopBar() {
  const { isAdmin, user, jugador } = useAuth()

  return (
    <header className="flex justify-between items-center w-full px-8 py-4 bg-surface-container-lowest shadow-sm sticky top-0 z-40">
      {/* Título de página */}
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-xl font-black tracking-tighter text-on-surface uppercase">
          Dashboard
        </h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <div className="relative group">
          <span className="material-symbols-outlined text-slate-500 group-hover:text-primary cursor-pointer transition-colors">
            notifications
          </span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
        </div>

        {/* Settings */}
        <span className="material-symbols-outlined text-slate-500 hover:text-primary cursor-pointer transition-colors">
          settings
        </span>

        {/* Perfil */}
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
          <div className="text-right">
            <p className="text-xs font-bold font-headline uppercase tracking-wider text-on-surface">
              {jugador?.nombre?.split(' ')[0] || 'Usuario'}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">
              {isAdmin ? 'Administrador' : 'Jugador'}
            </p>
          </div>
          <Link to="/perfil">
            <img
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-container/20"
              src={jugador?.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(jugador?.nombre || 'U')}&background=144bdb&color=fff`}
              alt="Avatar"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="ml-64 flex-grow flex flex-col min-h-screen">
        <TopBar />
        <section className="p-8 flex-grow">
          {children}
        </section>
        {/* Footer */}
        <footer className="p-8 border-t border-outline-variant/10 text-center">
          <p className="text-[10px] font-headline font-bold text-slate-400 uppercase tracking-[0.2em]">
            © 2024 ST. GEORGE Elite Padel Management • Todos los derechos reservados
          </p>
        </footer>
      </main>
    </div>
  )
}
