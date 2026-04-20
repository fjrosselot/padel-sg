import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
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
      const { data: temps } = await supabase
        .schema('padel')
        .from('temporadas')
        .select('id')
        .order('anio', { ascending: false })
        .limit(1)
      const temporadaId = temps?.[0]?.id
      if (!temporadaId) return []

      const { data, error } = await supabase
        .schema('padel')
        .from('ranking_categoria')
        .select('jugador_id, nombre, nombre_pila, apellido, apodo, foto_url, sexo, categoria, temporada_id, puntos_total, eventos_jugados')
        .eq('temporada_id', temporadaId)
      if (error) throw error
      return (data ?? []) as RankingEntry[]
    },
  })

  const byCategoria = useMemo(() => {
    const map = new Map<string, { sexo: 'M' | 'F'; entries: RankingEntry[] }>()
    for (const e of entries) {
      if (!map.has(e.categoria)) {
        map.set(e.categoria, { sexo: CATS_MUJERES.includes(e.categoria) ? 'F' : 'M', entries: [] })
      }
      map.get(e.categoria)!.entries.push(e)
    }
    for (const v of map.values()) {
      v.entries.sort((a, b) => b.puntos_total - a.puntos_total)
    }
    return map
  }, [entries])

  const hombresConDatos = CATS_HOMBRES.filter(c => byCategoria.has(c))
  const mujeresConDatos = CATS_MUJERES.filter(c => byCategoria.has(c))

  const todasCats = [
    ...CATS_HOMBRES.filter(c => byCategoria.has(c)).map(c => ({ cat: c, sexo: 'M' as const })),
    ...CATS_MUJERES.filter(c => byCategoria.has(c)).map(c => ({ cat: c, sexo: 'F' as const })),
  ]

  if (isLoading) return <div className="p-6 text-muted font-inter text-sm">Cargando ranking…</div>

  const catData = filtro !== 'todas' ? byCategoria.get(filtro) : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy uppercase tracking-tight">Ranking</h1>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterPill label="Todas" active={filtro === 'todas'} onClick={() => setFiltro('todas')} />
          {hombresConDatos.length > 0 && (
            <>
              <div className="w-px bg-navy/10 shrink-0" />
              {hombresConDatos.map(c => (
                <FilterPill key={c} label={`H: ${c}`} active={filtro === c} onClick={() => setFiltro(filtro === c ? 'todas' : c)} />
              ))}
            </>
          )}
          {mujeresConDatos.length > 0 && (
            <>
              <div className="w-px bg-navy/10 shrink-0" />
              {mujeresConDatos.map(c => (
                <FilterPill key={c} label={`M: ${c}`} active={filtro === c} onClick={() => setFiltro(filtro === c ? 'todas' : c)} />
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
          {todasCats.map(({ cat, sexo }) => (
            <RankingCategoriaCard
              key={cat}
              categoria={cat}
              sexo={sexo}
              entries={byCategoria.get(cat)?.entries ?? []}
              compact
            />
          ))}
        </div>
      ) : catData ? (
        <RankingCategoriaCard
          categoria={filtro}
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
