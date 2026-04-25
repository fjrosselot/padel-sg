import { useState, useMemo } from 'react'
import PartidoRow from './PartidoRow'
import { buildCatColorMap } from './catColors'
import { useUser } from '../../hooks/useUser'
import type { CategoriaFixture, PartidoFixture } from '../../lib/fixture/types'

type Vista = 'grupo' | 'cancha' | 'hora'

interface Props {
  categorias: CategoriaFixture[]
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (partido: PartidoFixture) => void
  colegioRival?: string
  soloMis?: boolean
}

function isMiPartido(p: PartidoFixture, uid: string): boolean {
  return [p.pareja1?.jugador1_id, p.pareja1?.jugador2_id, p.pareja2?.jugador1_id, p.pareja2?.jugador2_id]
    .includes(uid)
}

function filterMisPartidos(cats: CategoriaFixture[], uid: string): CategoriaFixture[] {
  return cats.map(cat => ({
    ...cat,
    grupos: (cat.grupos ?? []).map(g => ({ ...g, partidos: g.partidos.filter(p => isMiPartido(p, uid)) })).filter(g => g.partidos.length > 0),
    faseEliminatoria: cat.faseEliminatoria.filter(p => isMiPartido(p, uid)),
    consola: cat.consola.filter(p => isMiPartido(p, uid)),
    partidos: (cat.partidos ?? []).filter(p => isMiPartido(p, uid)),
  })).filter(cat =>
    (cat.grupos?.some(g => g.partidos.length > 0)) ||
    cat.faseEliminatoria.length > 0 ||
    cat.consola.length > 0 ||
    (cat.partidos ?? []).length > 0
  )
}

function FilterPill({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap flex items-center gap-1 px-4 py-1.5 rounded-full font-inter text-xs font-semibold transition-colors focus:outline-none ${
        active ? 'bg-navy text-gold' : 'bg-white border border-navy/20 text-slate hover:border-navy/40 hover:text-navy'
      }`}
    >
      {icon}{label}
    </button>
  )
}

function PillSelector({ vista, onChange }: { vista: Vista; onChange: (v: Vista) => void }) {
  const options: { value: Vista; label: string }[] = [
    { value: 'grupo', label: 'Por grupo' },
    { value: 'cancha', label: 'Por cancha' },
    { value: 'hora', label: 'Por hora' },
  ]
  return (
    <>
      {options.map(o => (
        <FilterPill key={o.value} label={o.label} active={vista === o.value} onClick={() => onChange(o.value)} />
      ))}
    </>
  )
}

function SectionLabel({ children, dot }: { children: React.ReactNode; dot?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: dot ?? '#e8c547' }} />
      <p className="font-inter text-[12px] font-bold uppercase tracking-[0.09em] text-[#162844]">
        {children}
      </p>
    </div>
  )
}

function DesafioSection({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival, catColorMap }: Props & { catColorMap: Map<string, { bg: string; dot: string }> }) {
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
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,360px))] gap-x-6 gap-y-1.5">
              {partidos.map(p => (
                <PartidoRow
                  key={p.id}
                  partido={p}
                  torneoId={torneoId}
                  isAdmin={isAdmin}
                  onCargarResultado={onCargarResultado}
                  catNombre={cat.nombre}
                  sembradoNum={isSembrado ? p.numero : undefined}
                  headerBg={catColorMap.get(cat.nombre)?.bg}
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

function VistaGrupo({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival, catColorMap }: Props & { catColorMap: Map<string, { bg: string; dot: string }> }) {
  const americanoCats = categorias.filter(c => !c.formato || c.formato === 'americano_grupos')
  const desafioCats = categorias.filter(c => c.formato === 'desafio_puntos' || c.formato === 'desafio_sembrado')

  return (
    <div className="space-y-8">
      {americanoCats.map(cat => {
        const headerBg = catColorMap.get(cat.nombre)?.bg
        return (
          <div key={cat.nombre}>
            <h3 className="font-manrope text-base font-bold text-navy border-l-4 border-gold pl-3 mb-4">{cat.nombre}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,360px))] gap-x-6 gap-y-6">
              {(cat.grupos ?? []).map(g => (
                <div key={g.letra}>
                  <SectionLabel>Grupo {g.letra}</SectionLabel>
                  <div className="space-y-1">
                    {g.partidos.map(p => (
                      <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catNombre={cat.nombre} headerBg={headerBg} />
                    ))}
                  </div>
                </div>
              ))}

              {cat.faseEliminatoria.length > 0 && (
                <div>
                  <SectionLabel>🏆 Copa Oro</SectionLabel>
                  <div className="space-y-1">
                    {cat.faseEliminatoria.map(p => (
                      <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catNombre={cat.nombre} headerBg={headerBg} />
                    ))}
                  </div>
                </div>
              )}

              {cat.consola.length > 0 && (
                <div>
                  <SectionLabel>🥈 Copa Plata</SectionLabel>
                  <div className="space-y-1">
                    {cat.consola.map(p => (
                      <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catNombre={cat.nombre} headerBg={headerBg} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {desafioCats.length > 0 && (
        <DesafioSection
          categorias={desafioCats}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
          catColorMap={catColorMap}
        />
      )}
    </div>
  )
}

function VistaAgrupada({ grupos, labelPrefix, torneoId, isAdmin, onCargarResultado, catPorPartido, catColorMap, innerGrid = false }: {
  grupos: Map<string, PartidoFixture[]>
  labelPrefix: string
  torneoId: string
  isAdmin: boolean
  onCargarResultado: (p: PartidoFixture) => void
  catPorPartido: Map<PartidoFixture, string>
  catColorMap: Map<string, { bg: string; dot: string }>
  innerGrid?: boolean
}) {
  const keys = [...grupos.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  if (innerGrid) {
    return (
      <div className="space-y-6">
        {keys.map(k => {
          const dotColor = grupos.get(k)!.map(p => catColorMap.get(catPorPartido.get(p) ?? '')?.dot).find(Boolean)
          return (
            <div key={k}>
              <SectionLabel dot={dotColor}>{labelPrefix}{k}</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,360px))] gap-x-6 gap-y-1.5">
                {grupos.get(k)!.map(p => {
                  const catNombre = catPorPartido.get(p) ?? ''
                  return (
                    <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catNombre={catNombre} headerBg={catColorMap.get(catNombre)?.bg} />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,360px))] gap-x-6 gap-y-6">
      {keys.map(k => {
        const dotColor = grupos.get(k)!.map(p => catColorMap.get(catPorPartido.get(p) ?? '')?.dot).find(Boolean)
        return (
          <div key={k}>
            <SectionLabel dot={dotColor}>{labelPrefix}{k}</SectionLabel>
            <div className="space-y-1">
              {grupos.get(k)!.map(p => {
                const catNombre = catPorPartido.get(p) ?? ''
                return (
                  <PartidoRow key={p.id} partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catNombre={catNombre} headerBg={catColorMap.get(catNombre)?.bg} />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FixtureTab({ categorias, torneoId, isAdmin, onCargarResultado, colegioRival, soloMis = false }: Props) {
  const [vista, setVista] = useState<Vista>('grupo')
  const { data: user } = useUser()

  const catColorMap = useMemo(() => buildCatColorMap(categorias.map(c => c.nombre)), [categorias])

  const categoriasFiltradas = soloMis && user?.id ? filterMisPartidos(categorias, user.id) : categorias

  const { porCancha, porHora, catPorPartido } = useMemo(() => {
    const porCancha = new Map<string, PartidoFixture[]>()
    const porHora = new Map<string, PartidoFixture[]>()
    const catPorPartido = new Map<PartidoFixture, string>()

    for (const cat of categoriasFiltradas) {
      const todos: PartidoFixture[] = [
        ...(cat.grupos ?? []).flatMap(g => g.partidos),
        ...cat.faseEliminatoria,
        ...cat.consola,
        ...(cat.partidos ?? []),
      ]
      for (const p of todos) {
        catPorPartido.set(p, cat.nombre)
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
  }, [categoriasFiltradas])

  if (categorias.length === 0) {
    return <p className="font-inter text-sm text-muted py-4">Sin categorías con fixture generado.</p>
  }

  const americanoCats = categoriasFiltradas.filter(c => !c.formato || c.formato === 'americano_grupos')
  const sinHorario = porCancha.size === 0 && porHora.size === 0
  const showPills = americanoCats.length > 0 || !sinHorario

  return (
    <div>
      {showPills && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar mb-4">
          <PillSelector vista={vista} onChange={setVista} />
        </div>
      )}

      {(vista === 'grupo' || !showPills) && (
        <VistaGrupo
          categorias={categoriasFiltradas}
          torneoId={torneoId}
          isAdmin={isAdmin}
          onCargarResultado={onCargarResultado}
          colegioRival={colegioRival}
          catColorMap={catColorMap}
        />
      )}

      {showPills && vista === 'cancha' && (
        porCancha.size === 0
          ? <p className="font-inter text-sm text-muted py-2">Sin canchas asignadas en el fixture.</p>
          : <VistaAgrupada grupos={porCancha} labelPrefix="Cancha " torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catPorPartido={catPorPartido} catColorMap={catColorMap} />
      )}

      {showPills && vista === 'hora' && (
        porHora.size === 0
          ? <p className="font-inter text-sm text-muted py-2">Sin horarios asignados en el fixture.</p>
          : <VistaAgrupada grupos={porHora} labelPrefix="" torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catPorPartido={catPorPartido} catColorMap={catColorMap} innerGrid />
      )}
    </div>
  )
}
