import { Bell, ChevronDown } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useAppStore } from '@/stores/appStore'
import { useTemporadas } from '@/hooks/useTemporada'
import { Button } from '@/components/ui/button'

export function TopBar() {
  const { data: user } = useUser()
  const { temporadaId, setTemporadaId } = useAppStore()
  const { data: temporadas = [] } = useTemporadas()

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface bg-white px-4">
      <div />
      <select
        value={temporadaId ?? ''}
        onChange={(e) => setTemporadaId(e.target.value || null)}
        className="rounded-full border border-navy/20 bg-transparent px-3 py-1 font-inter text-sm font-medium text-navy focus:outline-none"
      >
        <option value="">Temporada</option>
        {temporadas.map((t) => (
          <option key={t.id} value={t.id}>{t.nombre}</option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-manrope text-xs font-bold text-gold">
            {initials}
          </div>
          <span className="hidden font-inter text-sm text-slate lg:block">
            {user?.nombre ?? ''}
          </span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </div>
      </div>
    </header>
  )
}
