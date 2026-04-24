import { useState, useMemo } from 'react'
import { Badge } from '../../components/ui/badge'
import PartidoRow from './PartidoRow'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

type Vista = 'grupo' | 'cancha' | 'hora'

const FASE_LABEL: Record<string, string> = {
  cuartos: 'Cuartos',
  semifinal: 'Semifinal',
  tercer_lugar: '3er lugar',
  final: 'Final',
  consolacion_cuartos: 'Cuartos Plata',
  consolacion_sf: 'SF Plata',
  consolacion_final: 'Final Plata',
}

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
}

function PillSelector({ vista, onChange }: { vista: Vista; onChange: (v: Vista) => void }) {
  const options: { value: Vista; label: string }[] = [
    { value: 'grupo', label: 'Por grupo' },
    { value: 'cancha', label: 'Por cancha' },
    { value: 'hora', label: 'Por hora' },
  ]
  return (
    <div className="flex gap-1.5 mb-5">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`text-[11px] font-semibold px-3.5 py-1 rounded-full border transition-colors ${
            vista === o.value
              ? 'bg-[#162844] text-[#e8c547] border-[#162844]'
              : 'bg-white border-[#dce6f0] text-[#94b0cc] hover:border-[#94b0cc] hover:text-navy'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function abbrevCat(nombre: string): string {
  if (nombre.length <= 4) return nombre
  const parts = nombre.trim().split(/\s+/)
  let result = ''
  for (const p of parts) {
    if (/^\d+$/.test(p)) result += p
    else result += p[0].toUpperCase()
  }
  return result
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-inter text-[10px] font-bold uppercase tracking-widest text-muted mb-2 mt-4 first:mt-0 pb-1 border-b border-surface-high">
      {children}
    </p>
  )
}

function PartidoRowWithBadge({ p, torneoId, isAdmin, onCargarResultado, badge }: {
  p: PartidoFixture
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
  badge?: string
}) {
  return (
    <div className="flex items-center gap-2">
      {badge && (
        <div className="hidden sm:block shrink-0">
          <Badge variant="outline" className="text-[10px] capitalize">{badge}</Badge>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <PartidoRow partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} label={badge} />
      </div>
    </div>
  )
}

// Scoreboard + flat list for desafio_puntos / desafio_sembrado categories
function DesafioSection({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  const allPartidos = categorias.flatMap(c => c.partidos ?? [])
  const sgTotal = allPartidos.filter(p => p.ganador === 1).length
  const rivalTotal = allPartidos.filter(p => p.ganador === 2).length
  const jugados = allPartidos.filter(p => !!p.ganador).length
  const rivalLabel = colegioRival ?? 'Rival'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <span className="font-inter text-xs text-muted tabular-nums">
          {jugados}/{allPartidos.length} jugados
        </span>
        <div className="flex items-center gap-1.5 rounded-lg border border-navy/10 bg-navy/[0.04] px-2.5 py-1">
          <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">Saint George</span>
          <span className="font-manrope text-base font-bold text-gold tabular-nums leading-none">{sgTotal}</span>
          <span className="text-navy/30 text-xs mx-0.5">–</span>
          <span className="font-manrope text-base font-bold text-navy tabular-nums leading-none">{rivalTotal}</span>
          <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-muted">{rivalLabel}</span>
        </div>
      </div>

      {categorias.map(cat => {
        const partidos = cat.partidos ?? []
        const isSembrado = cat.formato === 'desafio_sembrado'
        return (
          <div key={cat.nombre} className="space-y-1.5">
            {categorias.length > 1 && (
              <h3 className="font-manrope text-sm font-bold text-navy border-l-4 border-gold pl-3">{cat.nombre}</h3>
            )}
            <div className="space-y-1.5">
              {partidos.map(p => (
                <PartidoRow
                  key={p.id}
                  partido={p}
                  torneoId={torneoId}
                  isAdmin={isAdmin}
                  onCargarResultado={onCargarResultado}
                  sembradoNum={isSembrado ? p.numero : undefined}
                />
              ))}
              {partidos.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted font-inter">Sin partidos.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function VistaGrupo({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  const americanoCats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')
  const desafioCats = categorias.filter(c => c.formato === 'desafio_puntos' || c.formato === 'desafio_sembrado')

  return (
    <div className="space-y-8">
      {americanoCats.map(cat => (
        <div key={cat.nombre}>
          <h3 className="font-manrope text-base font-bold text-navy border-l-4 border-gold pl-3 mb-4">{cat.nombre}</h3>
          {(cat.grupos ?? []).map(g => (
            <div key={g.letra}>
              <SectionLabel>Grupo {g.letra}</SectionLabel>
              <div className="space-y-1">
                {g.partidos.map(p => (
                  <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} />
                ))}
              </div>
            </div>
          ))}
          {cat.faseEliminatoria.length > 0 && (
            <>
              <SectionLabel>Eliminatoria</SectionLabel>
              <div className="space-y-1">
                {cat.faseEliminatoria.map(p => (
                  <PartidoRowWithBadge key={p.id} p={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} badge={FASE_LABEL[p.fase] ?? p.fase} />
                ))}
              </div>
            </>
          )}
          {cat.consola.length > 0 && (
            <>
              <SectionLabel>🥈 Copa Plata</SectionLabel>
              <div className="space-y-1">
                {cat.consola.map(p => (
                  <PartidoRowWithBadge key={p.id} p={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} badge={FASE_LABEL[p.fase] ?? p.fase} />
                ))}
              </div>
            </>
          )}
        </div>
      ))}

      {desafioCats.length > 0 && (
        <DesafioSection
          categorias={desafioCats}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
        />
      )}
    </div>
  )
}

function VistaAgrupada({ grupos, labelPrefix, torneoId, isAdmin, onCargarResultado, catPorPartido }: {
  grupos: Map<string, PartidoFixture[]>
  labelPrefix: string
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
  catPorPartido: Map<string, string>
}) {
  const keys = [...grupos.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  return (
    <div className="space-y-6">
      {keys.map(k => (
        <div key={k}>
          <SectionLabel>{labelPrefix}{k}</SectionLabel>
          <div className="space-y-1">
            {grupos.get(k)!.map(p => {
              const catAbbrev = abbrevCat(catPorPartido.get(p.id) ?? '')
              const faseNombre = p.fase !== 'grupo' ? (FASE_LABEL[p.fase] ?? '') : ''
              const mobileLabel = faseNombre ? `${catAbbrev} · ${faseNombre}` : catAbbrev
              return (
              <div key={p.id} className="flex items-center gap-2">
                <div className="hidden sm:block shrink-0">
                  <Badge variant="outline" className="text-[10px] text-muted whitespace-nowrap min-w-[34px] justify-center" title={catPorPartido.get(p.id) ?? ''}>
                    {catAbbrev}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <PartidoRow partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} label={mobileLabel} />
                </div>
              </div>
            )
          })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FixtureTab({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival }: Props) {
  const [vista, setVista] = useState<Vista>('grupo')

  const { porCancha, porHora, catPorPartido } = useMemo(() => {
    const porCancha = new Map<string, PartidoFixture[]>()
    const porHora = new Map<string, PartidoFixture[]>()
    const catPorPartido = new Map<string, string>()

    for (const cat of categorias) {
      const todos: PartidoFixture[] = [
        ...(cat.grupos ?? []).flatMap(g => g.partidos),
        ...cat.faseEliminatoria,
        ...cat.consola,
        ...(cat.partidos ?? []),
      ]
      for (const p of todos) {
        catPorPartido.set(p.id, cat.nombre)
        if (p.cancha != null) {
          const k = String(p.cancha)
          if (!porCancha.has(k)) porCancha.set(k, [])
          porCancha.get(k)!.push(p)
        }
        if (p.turno != null) {
          if (!porHora.has(p.turno)) porHora.set(p.turno, [])
          porHora.get(p.turno)!.push(p)
        }
      }
    }
    return { porCancha, porHora, catPorPartido }
  }, [categorias])

  if (categorias.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con fixture generado.</p>
  }

  const americanoCats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')
  const sinHorario = porCancha.size === 0 && porHora.size === 0
  // Only show pill selector when multi-view is meaningful
  const showPills = americanoCats.length > 0 || !sinHorario

  return (
    <div>
      {showPills && <PillSelector vista={vista} onChange={setVista} />}

      {(vista === 'grupo' || !showPills) && (
        <VistaGrupo
          categorias={categorias}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
        />
      )}

      {showPills && vista === 'cancha' && (
        porCancha.size === 0
          ? <p className="font-inter text-sm text-muted py-2">Sin canchas asignadas en el fixture.</p>
          : <VistaAgrupada grupos={porCancha} labelPrefix="Cancha " torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catPorPartido={catPorPartido} />
      )}

      {showPills && vista === 'hora' && (
        porHora.size === 0
          ? <p className="font-inter text-sm text-muted py-2">Sin horarios asignados en el fixture.</p>
          : <VistaAgrupada grupos={porHora} labelPrefix="" torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catPorPartido={catPorPartido} />
      )}
    </div>
  )
}
