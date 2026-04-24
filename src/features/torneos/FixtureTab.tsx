import { useState, useMemo } from 'react'
import PartidoRow from './PartidoRow'
import { catBgColor } from './catColors'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

type Vista = 'grupo' | 'cancha' | 'hora'

const FASE_LABEL: Record<string, string> = {
  cuartos: '🏆 Cuartos',
  semifinal: '🏆 Semifinal',
  tercer_lugar: '🏆 3er lugar',
  final: '🏆 Final',
  consolacion_cuartos: '🥈 Cuartos',
  consolacion_sf: '🥈 Semifinal',
  consolacion_final: '🥈 Final',
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
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2.5 h-2.5 rounded-sm bg-[#e8c547] shrink-0" />
      <p className="font-inter text-[12px] font-bold uppercase tracking-[0.09em] text-[#162844]">
        {children}
      </p>
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

          {/* All sections in one auto-fill grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,360px))] gap-x-6 gap-y-6">
            {(cat.grupos ?? []).map(g => (
              <div key={g.letra}>
                <SectionLabel>Grupo {g.letra}</SectionLabel>
                <div className="space-y-1">
                  {g.partidos.map(p => (
                    <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} headerBg={catBgColor(cat.nombre) || undefined} />
                  ))}
                </div>
              </div>
            ))}

            {cat.faseEliminatoria.length > 0 && (
              <div>
                <SectionLabel>🏆 Copa Oro</SectionLabel>
                <div className="space-y-1">
                  {cat.faseEliminatoria.map(p => (
                    <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} label={FASE_LABEL[p.fase] ?? p.fase} headerBg={catBgColor(cat.nombre) || undefined} />
                  ))}
                </div>
              </div>
            )}

            {cat.consola.length > 0 && (
              <div>
                <SectionLabel>🥈 Copa Plata</SectionLabel>
                <div className="space-y-1">
                  {cat.consola.map(p => (
                    <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} label={FASE_LABEL[p.fase] ?? p.fase} headerBg={catBgColor(cat.nombre) || undefined} />
                  ))}
                </div>
              </div>
            )}
          </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,360px))] gap-x-6 gap-y-6">
      {keys.map(k => (
        <div key={k}>
          <SectionLabel>{labelPrefix}{k}</SectionLabel>
          <div className="space-y-1">
            {grupos.get(k)!.map(p => {
              const catNombre = catPorPartido.get(p.id) ?? ''
              const catAbbrev = abbrevCat(catNombre)
              const faseNombre = p.fase !== 'grupo' ? (FASE_LABEL[p.fase] ?? '') : ''
              const label = faseNombre ? `${catAbbrev} · ${faseNombre}` : catAbbrev
              return (
                <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} label={label} headerBg={catBgColor(catNombre) || undefined} />
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
    for (const arr of porCancha.values()) {
      arr.sort((a, b) => (a.turno ?? '').localeCompare(b.turno ?? ''))
    }
    for (const arr of porHora.values()) {
      arr.sort((a, b) => (a.cancha ?? 0) - (b.cancha ?? 0))
    }

    return { porCancha, porHora, catPorPartido }
  }, [categorias])

  if (categorias.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con fixture generado.</p>
  }

  const americanoCats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')
  const sinHorario = porCancha.size === 0 && porHora.size === 0
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
