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
        <Badge variant="outline" className="text-[10px] shrink-0 capitalize">{badge}</Badge>
      )}
      <PartidoRow partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} />
    </div>
  )
}

function VistaGrupo({ categorias, torneoId, isAdmin, onCargarResultado }: Props) {
  return (
    <div className="space-y-8">
      {categorias.map(cat => (
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
    </div>
  )
}

function VistaAgrupada({ grupos, labelKey, labelPrefix, torneoId, isAdmin, onCargarResultado, catPorPartido }: {
  grupos: Map<string, PartidoFixture[]>
  labelKey: 'cancha' | 'hora'
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
            {grupos.get(k)!.map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0 text-muted">
                  {catPorPartido.get(p.id) ?? ''}
                </Badge>
                <PartidoRow partido={p} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FixtureTab({ categorias, torneoId, isAdmin, onCargarResultado }: Props) {
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

  const sinHorario = porCancha.size === 0 && porHora.size === 0

  return (
    <div>
      <PillSelector vista={vista} onChange={setVista} />

      {vista === 'grupo' && (
        <VistaGrupo categorias={categorias} torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} />
      )}

      {vista === 'cancha' && (
        porCancha.size === 0
          ? <p className="font-inter text-sm text-muted py-2">Sin canchas asignadas en el fixture.</p>
          : <VistaAgrupada grupos={porCancha} labelKey="cancha" labelPrefix="Cancha " torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catPorPartido={catPorPartido} />
      )}

      {vista === 'hora' && (
        porHora.size === 0
          ? <p className="font-inter text-sm text-muted py-2">Sin horarios asignados en el fixture.</p>
          : <VistaAgrupada grupos={porHora} labelKey="hora" labelPrefix="" torneoId={torneoId} isAdmin={isAdmin} onCargarResultado={onCargarResultado} catPorPartido={catPorPartido} />
      )}

      {sinHorario && vista !== 'grupo' && null}
    </div>
  )
}
