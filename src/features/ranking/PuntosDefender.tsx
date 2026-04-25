import { useQuery } from '@tanstack/react-query'
import { ShieldAlert } from 'lucide-react'
import { padelApi } from '@/lib/padelApi'

interface DefenderRow {
  evento_nombre: string
  evento_fecha: string
  expira_en: string
  puntos: number
  categoria: string
}

function diasHasta(fecha: string) {
  const diff = new Date(fecha).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function PuntosDefender({ jugadorId }: { jugadorId: string }) {
  const { data: rows = [] } = useQuery({
    queryKey: ['puntos-defender', jugadorId],
    queryFn: () =>
      padelApi.get<DefenderRow[]>(
        `puntos_por_defender?jugador_id=eq.${jugadorId}&select=evento_nombre,evento_fecha,expira_en,puntos,categoria&order=expira_en.asc`
      ),
    enabled: !!jugadorId,
  })

  if (rows.length === 0) return null

  const totalEnRiesgo = rows.reduce((s, r) => s + r.puntos, 0)

  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden border border-amber-200">
      <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2 bg-amber-50">
        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
        <p className="font-manrope text-sm font-bold text-navy flex-1">Puntos por defender</p>
        <span className="font-manrope text-sm font-extrabold text-amber-600">{totalEnRiesgo} pts</span>
      </div>

      <div className="divide-y divide-surface-high">
        {rows.map((r, i) => {
          const dias = diasHasta(r.expira_en)
          const urgencia = dias <= 30 ? 'text-red-500' : dias <= 60 ? 'text-amber-500' : 'text-slate'
          const expiraStr = new Date(r.expira_en).toLocaleDateString('es-CL', {
            day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
          })
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-inter text-xs font-semibold text-navy truncate">{r.evento_nombre}</p>
                <p className="font-inter text-[10px] text-muted">Cat. {r.categoria} · Expira {expiraStr}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-manrope text-sm font-extrabold text-navy">+{r.puntos}</p>
                <p className={`font-inter text-[10px] font-semibold ${urgencia}`}>
                  {dias <= 0 ? 'Expirado' : `en ${dias}d`}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
        <p className="font-inter text-[10px] text-amber-700">
          Estos puntos expiran al cumplirse 1 año desde cada evento. Participa en los mismos torneos este año para defenderlos.
        </p>
      </div>
    </div>
  )
}
