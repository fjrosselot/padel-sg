import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { padelApi } from '../../lib/padelApi'
import RankingCategoriaCard, { type RankingEntry } from './RankingCategoriaCard'

const CATS_HOMBRES = ['3a', '4a', '5a', 'Open']
const CATS_MUJERES = ['B', 'C', 'D', 'Open']

type Filtro = 'todas' | string

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-1.5 rounded-full font-inter text-xs font-semibold transition-colors focus:outline-none ${
        active
          ? 'bg-navy text-gold'
          : 'bg-white border border-navy/20 text-slate hover:border-navy/40 hover:text-navy'
      }`}
    >
      {label}
    </button>
  )
}

export default function RankingPage() {
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ranking-categoria'],
    queryFn: async () => {
      const [rankingData, jugadoresData] = await Promise.all([
        padelApi.get<RankingEntry[]>(
          'ranking_categoria?select=jugador_id,nombre,nombre_pila,apellido,apodo,foto_url,sexo,categoria,puntos_total,eventos_jugados'
        ),
        padelApi.get<{ id: string; nombre: string; nombre_pila: string | null; apellido: string | null; apodo: string | null; foto_url: string | null; sexo: string | null; categoria: string | null }[]>(
          'jugadores?select=id,nombre,nombre_pila,apellido,apodo,foto_url,sexo,categoria&estado_cuenta=eq.activo&categoria=not.is.null'
        ),
      ])

      const ranked = new Set((rankingData ?? []).map(r => r.jugador_id))
      const ceroEntries = (jugadoresData ?? [])
        .filter(j => !ranked.has(j.id))
        .map(j => ({
          jugador_id: j.id,
          nombre: j.nombre,
          nombre_pila: j.nombre_pila,
          apellido: j.apellido,
          apodo: j.apodo,
          foto_url: j.foto_url,
          sexo: j.sexo,
          categoria: j.categoria!,
          puntos_total: 0,
          eventos_jugados: 0,
        }))

      return [...(rankingData ?? []), ...ceroEntries] as RankingEntry[]
    },
  })

  // Key: `${categoria}_${sexo}` to handle shared names like "Open"
  const byKey = useMemo(() => {
    const map = new Map<string, { cat: string; sexo: 'M' | 'F'; entries: RankingEntry[] }>()
    for (const e of entries) {
      const sexo = (e.sexo as 'M' | 'F') ?? 'M'
      const key = `${e.categoria}_${sexo}`
      if (!map.has(key)) map.set(key, { cat: e.categoria, sexo, entries: [] })
      map.get(key)!.entries.push(e)
    }
    for (const v of map.values()) {
      v.entries.sort((a, b) => b.puntos_total - a.puntos_total)
    }
    return map
  }, [entries])

  const hombres = CATS_HOMBRES
    .map(c => ({ key: `${c}_M`, cat: c, sexo: 'M' as const }))
    .filter(x => byKey.has(x.key))

  const mujeres = CATS_MUJERES
    .map(c => ({ key: `${c}_F`, cat: c, sexo: 'F' as const }))
    .filter(x => byKey.has(x.key))

  const todasCats = [...hombres, ...mujeres]

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando ranking…</div>

  const catData = filtro !== 'todas' ? byKey.get(filtro) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy uppercase tracking-tight">Ranking</h1>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterPill label="Todas" active={filtro === 'todas'} onClick={() => setFiltro('todas')} />
          {hombres.length > 0 && (
            <>
              <div className="w-px bg-navy/10 shrink-0" />
              <span className="shrink-0 font-inter text-[10px] font-bold uppercase tracking-widest text-muted">Hombres</span>
              {hombres.map(x => (
                <FilterPill
                  key={x.key}
                  label={x.cat}
                  active={filtro === x.key}
                  onClick={() => setFiltro(filtro === x.key ? 'todas' : x.key)}
                />
              ))}
            </>
          )}
          {mujeres.length > 0 && (
            <>
              <div className="w-px bg-navy/10 shrink-0" />
              <span className="shrink-0 font-inter text-[10px] font-bold uppercase tracking-widest text-muted">Damas</span>
              {mujeres.map(x => (
                <FilterPill
                  key={x.key}
                  label={x.cat}
                  active={filtro === x.key}
                  onClick={() => setFiltro(filtro === x.key ? 'todas' : x.key)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">Sin puntos de ranking registrados aún.</p>
        </div>
      ) : filtro === 'todas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {todasCats.map(({ key, cat, sexo }) => (
            <RankingCategoriaCard
              key={key}
              categoria={cat}
              sexo={sexo}
              entries={byKey.get(key)?.entries ?? []}
              compact
              onSelect={() => setFiltro(key)}
            />
          ))}
        </div>
      ) : catData ? (
        <RankingCategoriaCard
          categoria={catData.cat}
          sexo={catData.sexo}
          entries={catData.entries}
          compact={false}
        />
      ) : (
        <div className="rounded-xl bg-white shadow-card p-8 text-center">
          <p className="font-inter text-sm text-muted">Sin datos para esta categoría.</p>
        </div>
      )}
    </div>
  )
}
