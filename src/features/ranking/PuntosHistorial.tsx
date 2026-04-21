import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PuntoRow {
  id: string
  puntos: number
  categoria: string
  fase: string | null
  created_at: string
  eventos_ranking: {
    nombre: string
    tipo: string
    fecha: string | null
  } | null
}

const TIPO_LABEL: Record<string, string> = {
  torneo: 'Torneo',
  americano: 'Americano',
  desafio: 'Desafío',
  externo: 'Externo',
}

export function PuntosHistorial({ jugadorId }: { jugadorId: string }) {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['puntos-historial', jugadorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('padel')
        .from('puntos_ranking')
        .select('id, puntos, categoria, fase, created_at, eventos_ranking(nombre, tipo, fecha)')
        .eq('jugador_id', jugadorId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(r => ({
        ...r,
        eventos_ranking: Array.isArray(r.eventos_ranking) ? r.eventos_ranking[0] ?? null : r.eventos_ranking,
      })) as PuntoRow[]
    },
    enabled: !!jugadorId,
  })

  if (isLoading) return null
  if (rows.length === 0) return (
    <div className="rounded-xl bg-white shadow-card p-6 text-center">
      <p className="font-inter text-sm text-muted">Sin puntos de ranking acumulados aún.</p>
    </div>
  )

  // Calcular acumulado corriente (cronológico)
  let acumulado = 0
  const conAcumulado = rows.map(r => {
    acumulado += r.puntos
    return { ...r, acumulado }
  }).reverse() // mostrar más reciente primero

  const totalPuntos = acumulado

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-high flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-gold" />
        <p className="font-manrope text-sm font-bold text-navy flex-1">Historial de puntos</p>
        <span className="font-manrope text-sm font-extrabold text-navy">{totalPuntos} pts</span>
      </div>

      <div className="divide-y divide-surface-high">
        {conAcumulado.map((r) => {
          const evento = r.eventos_ranking
          const fecha = (evento?.fecha ?? r.created_at)
            ? new Date(evento?.fecha ?? r.created_at).toLocaleDateString('es-CL', {
                day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago',
              })
            : '—'
          const tipo = evento?.tipo ? (TIPO_LABEL[evento.tipo] ?? evento.tipo) : '—'

          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-inter text-xs font-semibold text-navy truncate">
                  {evento?.nombre ?? 'Evento'}
                </p>
                <p className="font-inter text-[10px] text-muted">
                  {fecha} · {tipo} · Cat. {r.categoria}
                </p>
              </div>
              <span className={`shrink-0 font-manrope text-sm font-extrabold ${r.puntos >= 20 ? 'text-success' : 'text-slate'}`}>
                +{r.puntos}
              </span>
              <span className="shrink-0 w-14 text-right font-inter text-xs text-muted">
                {r.acumulado} pts
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
