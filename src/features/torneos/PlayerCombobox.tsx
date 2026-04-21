import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { padelApi } from '../../lib/padelApi'
import { ChevronDown } from 'lucide-react'

export interface JugadorOption {
  id: string
  nombre: string
  apodo: string | null
  sexo: 'M' | 'F' | null
}

interface Props {
  players: JugadorOption[] | undefined
  value: string
  onChange: (id: string) => void
  placeholder?: string
  excludeId?: string
  suggestedIds?: string[]
  className?: string
}

export function PlayerCombobox({
  players = [],
  value,
  onChange,
  placeholder = '— elige jugador —',
  excludeId,
  suggestedIds = [],
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const available = players.filter(p => p.id !== excludeId)
  const selected = available.find(p => p.id === value) ?? players.find(p => p.id === value)

  const term = search.toLowerCase()
  const filtered = search
    ? available.filter(p =>
        p.nombre.toLowerCase().includes(term) || p.apodo?.toLowerCase().includes(term)
      )
    : available

  const suggested = suggestedIds
    .map(id => available.find(p => p.id === id))
    .filter((p): p is JugadorOption => !!p)
    .slice(0, 5)

  const rest = search
    ? filtered
    : filtered.filter(p => !suggestedIds.includes(p.id))

  function select(id: string) {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  function displayName(p: JugadorOption) {
    return p.apodo ? `${p.nombre} (${p.apodo})` : p.nombre
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 font-inter text-sm text-left flex items-center justify-between gap-2 focus:border-gold focus:outline-none transition-colors"
      >
        <span className={selected ? 'text-navy truncate' : 'text-navy/40'}>
          {selected ? displayName(selected) : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-xl border border-navy/10 bg-white shadow-[0_4px_20px_rgba(13,27,42,0.12)] overflow-hidden">
          <div className="px-3 py-2 border-b border-navy/5">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setOpen(false)}
              placeholder="Buscar jugador..."
              className="w-full text-sm text-navy bg-transparent outline-none placeholder:text-muted/50"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {!search && suggested.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
                  Parejas anteriores
                </p>
                {suggested.map(p => (
                  <OptionRow key={p.id} player={p} selected={p.id === value} onSelect={select} />
                ))}
                {rest.length > 0 && <div className="mx-3 border-t border-navy/5 my-1" />}
              </>
            )}

            {rest.map(p => (
              <OptionRow key={p.id} player={p} selected={p.id === value} onSelect={select} />
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted text-center">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OptionRow({
  player,
  selected,
  onSelect,
}: {
  player: JugadorOption
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(player.id)}
      className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gold/5 ${
        selected ? 'bg-gold/10 font-semibold text-navy' : 'text-navy'
      }`}
    >
      {player.nombre}
      {player.apodo && <span className="ml-1 text-xs text-muted">({player.apodo})</span>}
    </button>
  )
}

export function usePastCompaneros(jugadorId: string | undefined) {
  return useQuery({
    queryKey: ['past-companeros', jugadorId],
    queryFn: async () => {
      if (!jugadorId) return []
      const rows = await padelApi.get<{ jugador1_id: string; jugador2_id: string }[]>(
        `inscripciones?select=jugador1_id,jugador2_id&or=(jugador1_id.eq.${jugadorId},jugador2_id.eq.${jugadorId})&estado=eq.confirmada`
      )
      const ids = rows.map(r => (r.jugador1_id === jugadorId ? r.jugador2_id : r.jugador1_id))
      return [...new Set(ids)].slice(0, 6)
    },
    enabled: !!jugadorId,
    staleTime: 60_000,
  })
}
