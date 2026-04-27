import { useNavigate } from 'react-router-dom'
import { User, Shield, ChevronRight, LogOut, TrendingUp, Banknote, UserCog, Tag, ClipboardList, Megaphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUser } from '../../hooks/useUser'

interface LinkItem {
  icon: React.ElementType
  label: string
  desc: string
  to: string
}

const NAV_LINKS: LinkItem[] = [
  { icon: User, label: 'Mi perfil', desc: 'Datos personales y contraseña', to: '/perfil' },
  { icon: TrendingUp, label: 'Ranking', desc: 'Tabla de posiciones por categoría', to: '/rankings' },
]

const ADMIN_LINKS: LinkItem[] = [
  { icon: Banknote, label: 'Tesorería', desc: 'Cobros e historial de pagos', to: '/admin/tesoreria' },
  { icon: Shield, label: 'Admin usuarios', desc: 'Aprobar y gestionar cuentas', to: '/admin/usuarios' },
  { icon: UserCog, label: 'Admin jugadores', desc: 'Editar datos de jugadores', to: '/admin/jugadores' },
  { icon: Tag, label: 'Categorías', desc: 'Colores y configuración', to: '/admin/categorias' },
  { icon: ClipboardList, label: 'Partidos', desc: 'Gestión de partidos', to: '/admin/partidos' },
  { icon: Megaphone, label: 'Novedades', desc: 'Publicar anuncios en el dashboard', to: '/admin/novedades' },
]

function LinkGroup({ items }: { items: LinkItem[] }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      {items.map((item, idx) => {
        const Icon = item.icon
        return (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors text-left focus:outline-none focus:bg-surface ${
              idx !== items.length - 1 ? 'border-b border-surface-high' : ''
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
  )
}

export default function MasPage() {
  const { data: user } = useUser()
  const navigate = useNavigate()
  const isAdmin = user?.rol === 'superadmin' || user?.rol === 'admin_torneo'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-4">
      <h1 className="font-manrope text-2xl font-bold text-navy">Más</h1>

      <LinkGroup items={NAV_LINKS} />

      {isAdmin && (
        <div className="space-y-2">
          <p className="px-1 font-inter text-[10px] font-bold uppercase tracking-widest text-muted/60">Admin</p>
          <LinkGroup items={ADMIN_LINKS} />
        </div>
      )}

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
