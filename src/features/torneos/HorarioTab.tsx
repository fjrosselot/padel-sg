import PartidoRow from './PartidoRow'
import { buildCatColorMap } from './catColors'
import { useUser } from '../../hooks/useUser'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

interface MatchEntry {
  partido: PartidoFixture
  catNombre: string
}

function isMiPartido(p: PartidoFixture, uid: string): boolean {
  return [p.pareja1?.jugador1_id, p.pareja1?.jugador2_id, p.pareja2?.jugador1_id, p.pareja2?.jugador2_id]
    .includes(uid)
}

function Legend({ catNames, catColorMap }: { catNames: string[]; catColorMap: Map<string, { bg: string; dot: string }> }) {
  return (
    <div className="flex flex-wrap gap-3 items-center mb-4 font-inter text-[12px] text-muted">
      {catNames.map(name => (
        <div key={name} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: catColorMap.get(name)?.dot ?? '#64748b' }} />
          {name}
        </div>
      ))}
      <div className="w-px h-4 bg-navy/10" />
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#e8c547]" />
        Copa Oro
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#94b0cc]" />
        Copa Plata
      </div>
    </div>
  )
}

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  soloMis?: boolean
}

export default function HorarioTab({ categorias, torneoId, isAdmin, onCargarResultado, soloMis = false }: Props) {
  const { data: user } = useUser()

  const allEntries: MatchEntry[] = []
  for (const cat of categorias) {
    const allPartidos: PartidoFixture[] = [
      ...(cat.grupos ?? []).flatMap(g => g.partidos),
      ...cat.faseEliminatoria,
      ...cat.consola,
      ...(cat.partidos ?? []),
    ]
    for (const p of allPartidos) {
      if (p.turno != null && p.cancha != null) {
        allEntries.push({ partido: p, catNombre: cat.nombre })
      }
    }
  }

  const entries = soloMis && user?.id
    ? allEntries.filter(e => isMiPartido(e.partido, user.id))
    : allEntries

  if (allEntries.length === 0) {
    return (
      <p className="font-inter text-sm text-muted py-4">
        No hay horarios asignados. Se generan al crear el fixture con hora de inicio configurada.
      </p>
    )
  }

  const courts = [...new Set(entries.map(e => e.partido.cancha!))].sort((a, b) => a - b)
  const times = [...new Set(entries.map(e => e.partido.turno!))].sort()

  const lookup = new Map<string, MatchEntry>()
  for (const e of entries) {
    lookup.set(`${e.partido.cancha}|${e.partido.turno}`, e)
  }

  const catNames = [...new Set(categorias.map(c => c.nombre))]
  const catColorMap = buildCatColorMap(catNames.map(nombre => ({ nombre })))

  return (
    <div>
      <Legend catNames={catNames} catColorMap={catColorMap} />

      {entries.length === 0 ? (
        <p className="font-inter text-sm text-muted py-2">No tienes partidos con horario asignado.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <table className="border-collapse bg-white w-full" style={{ minWidth: times.length * 200 + 72, tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th
                    className="text-left px-3 py-2"
                    style={{ background: '#f8fafc', width: 72, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}
                  >
                    <span className="font-inter text-[10px] font-bold uppercase tracking-[0.1em] text-[#94b0cc]">Cancha</span>
                  </th>
                  {times.map(t => (
                    <th
                      key={t}
                      className="text-center px-3 py-2 whitespace-nowrap"
                      style={{ background: '#f8fafc', width: 200, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}
                    >
                      <span className="font-manrope text-[13px] font-bold text-[#162844]">{t}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((court) => (
                  <tr key={court}>
                    <td
                      className="text-center align-middle font-manrope text-[12px] font-bold text-[#162844] whitespace-nowrap"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '0 10px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      C{court}
                    </td>
                    {times.map(t => {
                      const entry = lookup.get(`${court}|${t}`)
                      return (
                        <td key={t} style={{ padding: 4, border: '1px solid #e8eef4', height: 1 }}>
                          {entry ? (
                            <PartidoRow
                              partido={entry.partido}
                              torneoId={torneoId}
                              isAdmin={isAdmin}
                              onCargarResultado={onCargarResultado}
                              catNombre={entry.catNombre}
                              className="h-full"
                              headerBg={catColorMap.get(entry.catNombre)?.bg}
                            />
                          ) : (
                            <div
                              className="rounded-md flex items-center justify-center text-[#cbd5e1] text-[11px]"
                              style={{ minHeight: 58, background: '#f8fafc' }}
                            >
                              —
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-inter text-[10px] text-muted mt-2 text-right">← desliza para ver más →</p>
        </>
      )}
    </div>
  )
}
