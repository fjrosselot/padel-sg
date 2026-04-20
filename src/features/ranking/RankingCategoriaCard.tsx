import { useNavigate } from 'react-router-dom'

export interface RankingEntry {
  jugador_id: string
  nombre: string
  nombre_pila: string | null
  apellido: string | null
  apodo: string | null
  foto_url: string | null
  sexo: string | null
  categoria: string
  puntos_total: number
  eventos_jugados: number
}

interface Props {
  categoria: string
  sexo: 'M' | 'F'
  entries: RankingEntry[]
  compact?: boolean
}

export default function RankingCategoriaCard({ categoria, sexo, entries, compact = false }: Props) {
  const navigate = useNavigate()
  const display = compact ? entries.slice(0, 8) : entries

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <div className={`px-4 py-3 flex items-center gap-2 ${sexo === 'M' ? 'bg-blue-50' : 'bg-pink-50'}`}>
        <span className="font-manrope text-sm font-extrabold text-navy uppercase tracking-tight">
          Cat. {categoria}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          sexo === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
        }`}>
          {sexo === 'M' ? 'Hombres' : 'Damas'}
        </span>
        <span className="ml-auto font-inter text-[10px] text-muted">{entries.length} jugadores</span>
      </div>

      {display.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted text-center">Sin datos aún.</p>
      ) : (
        <div className="divide-y divide-surface-high">
          {display.map((entry, idx) => {
            const initials = [entry.nombre_pila, entry.apellido]
              .filter(Boolean).map(n => n![0]).join('').toUpperCase() || '??'
            const displayName = entry.apellido
              ? `${entry.apellido}${entry.nombre_pila ? `, ${entry.nombre_pila}` : ''}`
              : entry.nombre

            return (
              <button
                key={entry.jugador_id}
                type="button"
                onClick={() => navigate(`/jugadores/${entry.jugador_id}`)}
                className={`w-full flex items-center gap-3 text-left hover:bg-surface transition-colors ${
                  compact ? 'px-3 py-2' : 'px-4 py-3'
                }`}
              >
                <span className={`w-5 shrink-0 font-manrope text-xs font-bold text-center ${
                  idx === 0 ? 'text-gold' : idx === 1 ? 'text-slate' : idx === 2 ? 'text-[#CD7F32]' : 'text-muted'
                }`}>
                  {idx + 1}
                </span>

                <div className={`shrink-0 rounded-full bg-navy flex items-center justify-center overflow-hidden ${
                  compact ? 'h-7 w-7' : 'h-9 w-9'
                }`}>
                  {entry.foto_url
                    ? <img src={entry.foto_url} alt={entry.nombre} className="h-full w-full object-cover" />
                    : <span className={`font-manrope font-bold text-gold ${compact ? 'text-[9px]' : 'text-xs'}`}>
                        {initials}
                      </span>
                  }
                </div>

                <span className={`flex-1 min-w-0 font-manrope font-bold text-navy truncate ${
                  compact ? 'text-xs' : 'text-sm'
                }`}>
                  {displayName}
                  {entry.apodo && !compact && (
                    <span className="font-normal text-muted"> "{entry.apodo}"</span>
                  )}
                </span>

                <span className={`shrink-0 font-manrope font-extrabold text-navy ${
                  compact ? 'text-sm' : 'text-lg'
                }`}>
                  {entry.puntos_total}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {compact && entries.length > 8 && (
        <p className="px-4 py-2 text-center font-inter text-[10px] text-muted border-t border-surface-high">
          +{entries.length - 8} más
        </p>
      )}
    </div>
  )
}
