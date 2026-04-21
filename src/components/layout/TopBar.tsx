import { Bell, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'
import { useTemporadas } from '@/hooks/useTemporada'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const { data: user } = useUser()
  const navigate = useNavigate()
  const { data: temporadas = [] } = useTemporadas()
  const temporadaActual = temporadas[0]

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface bg-white px-4">
      <div />
      {temporadaActual && (
        <span className="rounded-full border border-navy/20 px-3 py-1 font-inter text-sm font-medium text-navy">
          {temporadaActual.nombre}
        </span>
      )}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative text-slate">
          <Bell className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-gold/50"
          aria-label="Ver perfil"
        >
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-manrope text-xs font-bold text-gold"
          >
            {initials}
          </div>
          <span className="hidden font-inter text-sm text-slate lg:block">
            {user?.nombre ?? ''}
          </span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
      </div>
    </header>
  )
}
