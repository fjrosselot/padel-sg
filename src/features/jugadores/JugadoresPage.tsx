import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Jugador } from '../../lib/supabase'

type JugadorItem = Pick<Jugador, 'id' | 'nombre' | 'apodo' | 'categoria' | 'elo' | 'foto_url' | 'lado_preferido' | 'sexo'>

const LADO_LABEL: Record<string, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
}

export default function JugadoresPage() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data: jugadores, isLoading } = useQuery({
    queryKey: ['jugadores-directorio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('jugadores')
        .select('id, nombre, apodo, categoria, elo, foto_url, lado_preferido, sexo')
        .eq('estado_cuenta', 'activo')
        .order('nombre', { ascending: true })
      if (error) throw error
      return data as JugadorItem[]
    },
  })

  const filtrados = jugadores?.filter(j => {
    const q = search.toLowerCase()
    return (
      j.nombre.toLowerCase().includes(q) ||
      (j.apodo?.toLowerCase().includes(q) ?? false) ||
      (j.categoria?.toLowerCase().includes(q) ?? false)
    )
  }) ?? []

  if (isLoading) return <div className="p-6 text-muted">Cargando jugadores…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Jugadores</h1>
        <span className="ml-auto font-inter text-xs text-muted">{jugadores?.length ?? 0} activos</span>
      </div>

      <input
        type="search"
        placeholder="Buscar por nombre, apodo o categoría…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2.5 font-inter text-sm text-navy placeholder-slate focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />

      {filtrados.length === 0 && (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">
            {search ? 'Sin resultados para esa búsqueda.' : 'Sin jugadores activos.'}
          </p>
        </div>
      )}

      {filtrados.length > 0 && (
        <div className="rounded-xl bg-white shadow-card overflow-hidden">
          {filtrados.map((jugador, idx) => (
            <button
              key={jugador.id}
              type="button"
              onClick={() => navigate(`/jugadores/${jugador.id}`)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface transition-colors focus:outline-none focus:bg-surface ${
                idx !== filtrados.length - 1 ? 'border-b border-surface-high' : ''
              }`}
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-navy flex items-center justify-center overflow-hidden">
                {jugador.foto_url
                  ? <img src={jugador.foto_url} alt={jugador.nombre} className="h-full w-full object-cover" />
                  : <span className="font-manrope text-xs font-bold text-gold">
                      {jugador.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                    </span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-manrope text-sm font-bold text-navy truncate">
                  {jugador.apodo ? `${jugador.nombre} "${jugador.apodo}"` : jugador.nombre}
                </p>
                <p className="font-inter text-xs text-muted">
                  {[jugador.categoria, jugador.lado_preferido ? LADO_LABEL[jugador.lado_preferido] : null]
                    .filter(Boolean).join(' · ')}
                </p>
              </div>

              <span className="font-manrope text-sm font-bold text-navy shrink-0 mr-1">{jugador.elo}</span>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
