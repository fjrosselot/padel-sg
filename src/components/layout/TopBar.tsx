import { ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'
import { BrandLogo } from '@/components/brand/BrandLogo'

export function TopBar() {
  const { data: user } = useUser()
  const navigate = useNavigate()

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface bg-white px-4">
      <div className="flex items-center gap-2">
        <BrandLogo variant="compact" />
        <span className="font-manrope text-sm font-bold text-navy">Pádel SG</span>
      </div>
      <button
        type="button"
        onClick={() => navigate('/perfil')}
        className="flex items-center gap-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-gold/50"
        aria-label="Ver mis datos"
      >
        <div
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-manrope text-xs font-bold text-gold"
        >
          {initials}
        </div>
        <span className="font-inter text-sm text-slate">Mis datos</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
    </header>
  )
}
