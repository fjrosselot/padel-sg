import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

interface PartidaAbierta {
  id: string
  jugador_id: string
  rol_buscado: 'busco_companero' | 'busco_rivales' | 'abierto' | null
  fecha: string | null
  lugar: string | null
  categoria: string | null
  jugador: { nombre_pila: string | null; apellido: string | null } | null
}

const ROL_LABEL: Record<string, string> = {
  busco_companero: 'Busca compañero',
  busco_rivales: 'Busca rivales',
  abierto: 'Partido abierto',
}

function fmtFecha(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
}

export function AmistososAbiertos() {
  const navigate = useNavigate()
  const { data: user } = useUser()

  const { data: partidas = [], isLoading } = useQuery({
    queryKey: ['amistosos-abiertos', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('partidas_abiertas')
        .select('id, jugador_id, rol_buscado, fecha, lugar, categoria, jugador:jugadores(nombre_pila, apellido)')
        .eq('estado', 'abierta')
        .neq('jugador_id', user!.id)
        .order('fecha', { ascending: true })
        .limit(5)

      if (error) throw error
      return (data ?? []) as unknown as PartidaAbierta[]
    },
  })

  if (isLoading) return null

  if (partidas.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-card p-4 text-center">
        <p className="font-inter text-xs font-bold uppercase tracking-wider text-muted mb-1">Amistosos abiertos</p>
        <p className="font-inter text-sm text-muted">Sin partidas abiertas ahora.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <div className="divide-y divide-navy/5">
        {partidas.map(p => {
          const jugador = p.jugador
          const nombre = jugador
            ? [jugador.nombre_pila, jugador.apellido].filter(Boolean).join(' ')
            : '—'
          const rolLabel = p.rol_buscado ? (ROL_LABEL[p.rol_buscado] ?? p.rol_buscado) : 'Partido abierto'

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate('/amistosos')}
              className="w-full text-left flex items-stretch hover:bg-surface transition-colors"
            >
              <div className="w-1 shrink-0 bg-gold/60" />
              <div className="flex-1 px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-manrope text-sm font-bold text-navy leading-tight">{nombre}</p>
                  {p.categoria && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 bg-navy/8 font-inter text-[10px] font-medium text-navy">
                      {p.categoria}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-inter text-[10px] text-muted">{rolLabel}</span>
                  {p.fecha && (
                    <>
                      <span className="text-muted/40">·</span>
                      <span className="font-inter text-[10px] text-muted">{fmtFecha(p.fecha)}</span>
                    </>
                  )}
                  {p.lugar && (
                    <>
                      <span className="text-muted/40">·</span>
                      <span className="font-inter text-[10px] text-muted truncate">{p.lugar}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center pr-3 shrink-0">
                <span className="font-inter text-[11px] font-semibold text-navy">Unirme →</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
