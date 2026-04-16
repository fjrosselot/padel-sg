import { useNavigate } from 'react-router-dom'
import { User, Users, Calendar, Shield, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'

interface LinkItem {
  icon: React.ElementType
  label: string
  desc: string
  to: string
  adminOnly?: boolean
}

const LINKS: LinkItem[] = [
  { icon: User, label: 'Mi perfil', desc: 'Datos personales y contraseña', to: '/perfil' },
  { icon: Calendar, label: 'Calendario', desc: 'Torneos y ligas programados', to: '/calendario' },
  { icon: Shield, label: 'Admin usuarios', desc: 'Aprobar y gestionar cuentas', to: '/admin/usuarios', adminOnly: true },
  { icon: Users, label: 'Admin jugadores', desc: 'Editar datos de jugadores', to: '/admin/jugadores', adminOnly: true },
  { icon: Users, label: 'Admin temporadas', desc: 'Configuración de temporadas', to: '/admin/temporadas', adminOnly: true },
]

export default function MasPage() {
  const { data: user } = useUser()
  const navigate = useNavigate()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const visibles = LINKS.filter(l => !l.adminOnly || isAdmin)

  return (
    <div className="space-y-4">
      <h1 className="font-manrope text-2xl font-bold text-navy">Más</h1>

      <div className="rounded-xl bg-white shadow-card overflow-hidden">
        {visibles.map((item, idx) => {
          const Icon = item.icon
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors text-left focus:outline-none focus:bg-surface ${
                idx !== visibles.length - 1 ? 'border-b border-surface-high' : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-manrope text-sm font-bold text-navy">{item.label}</p>
                <p className="font-inter text-xs text-muted">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white shadow-card hover:bg-defeat/5 transition-colors text-left focus:outline-none"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-defeat/10">
          <LogOut className="h-4 w-4 text-defeat" />
        </div>
        <div className="flex-1">
          <p className="font-manrope text-sm font-bold text-defeat">Cerrar sesión</p>
          <p className="font-inter text-xs text-muted">{user?.email}</p>
        </div>
      </button>

      <p className="text-center font-inter text-xs text-slate">Pádel Saint George's · v{__APP_VERSION__}</p>
    </div>
  )
}
