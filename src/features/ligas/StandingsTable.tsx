import type { StandingRow } from '../../lib/ligas/standings'

interface Props {
  ligaId: string
  standings: StandingRow[]
  jugadoresMap: Record<string, string>
}

export default function StandingsTable({ standings, jugadoresMap }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate/20">
            {['POS', 'Jugador', 'PJ', 'G', 'P', 'SF', 'SC', 'PTS'].map(h => (
              <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-muted uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => (
            <tr key={row.jugador_id} className={`border-b border-surface-high ${idx === 0 ? 'bg-gold/10' : ''}`}>
              <td className="py-3 px-2 font-bold text-navy">{idx + 1}</td>
              <td className="py-3 px-2 font-medium text-navy">
                {jugadoresMap[row.jugador_id] ?? row.jugador_id.slice(0, 8)}
              </td>
              <td className="py-3 px-2 text-slate">{row.partidos_jugados}</td>
              <td className="py-3 px-2 text-success font-semibold">{row.partidos_ganados}</td>
              <td className="py-3 px-2 text-[#BA1A1A]">{row.partidos_perdidos}</td>
              <td className="py-3 px-2 text-slate">{row.sets_favor}</td>
              <td className="py-3 px-2 text-slate">{row.sets_contra}</td>
              <td className="py-3 px-2 font-bold text-navy">{row.puntos}</td>
            </tr>
          ))}
          {standings.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-muted text-sm">
                Sin partidos jugados aún
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
