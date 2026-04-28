// MOCKUP — App Asados · Historial de asados
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Users, TrendingUp, TrendingDown, Minus as MinusIcon } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',
  card:   '#FFFFFF',
  ink:    '#1C1A17',
  ember:  '#C4541A',
  muted:  '#8B7E74',
  soft:   '#FFF0E8',
  border: '#EDE8E3',
}

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CL') }

type Tipo = 'amigos' | 'familiar' | 'colegio' | 'oficina'

const TIPO_CFG: Record<Tipo, { label: string; color: string; soft: string }> = {
  amigos:   { label: 'Amigos',   color: '#C4541A', soft: '#FFF0E8' },
  familiar: { label: 'Familiar', color: '#7C6A15', soft: '#FDF8E7' },
  colegio:  { label: 'Colegio',  color: '#1E5FA8', soft: '#EEF4FB' },
  oficina:  { label: 'Oficina',  color: '#5A6B82', soft: '#F0F4F8' },
}

type Asado = {
  id: string
  nombre: string
  tipo: Tipo
  fecha: string          // display
  adultos: number
  ninos: number
  total: number
  observacion?: string
  cortes?: string[]
  tendencia?: 'subio' | 'bajo' | 'igual'   // vs asado anterior del mismo tipo
}

const HISTORIAL: Asado[] = [
  {
    id: '8',
    nombre: 'Asado padres 4°B',
    tipo: 'colegio',
    fecha: '15 mar 2026',
    adultos: 15, ninos: 8,
    total: 185000,
    tendencia: 'igual',
    cortes: ['Costillar', 'Longaniza', 'Curacaribs', 'Provoleta'],
    observacion: 'Faltó longaniza para el picoteo inicial. Costillar quedó perfecto.',
  },
  {
    id: '7',
    nombre: 'Asado Pádel Nov',
    tipo: 'amigos',
    fecha: '8 nov 2025',
    adultos: 24, ninos: 3,
    total: 298000,
    tendencia: 'subio',
    cortes: ['Entraña trenzada', 'Malaya pizza', 'Costillar', 'Longaniza'],
    observacion: 'Sobró malaya. Reducir a 2 kg la próxima vez.',
  },
  {
    id: '6',
    nombre: 'Asado Techos',
    tipo: 'familiar',
    fecha: '4 oct 2025',
    adultos: 6, ninos: 5,
    total: 178000,
    tendencia: 'bajo',
    cortes: ['Costillar', 'Lomo vetado', 'Hamburguesas'],
    observacion: 'Hamburguesas para los niños — excelente idea.',
  },
  {
    id: '5',
    nombre: 'Asado Oficina',
    tipo: 'oficina',
    fecha: '18 sep 2025',
    adultos: 22, ninos: 0,
    total: 208000,
    tendencia: 'igual',
    cortes: ['Entraña americana', 'Costillar', 'Chistorra', 'Queso parrillero'],
    observacion: 'Todo salió bien. Entraña americana muy valorada.',
  },
  {
    id: '4',
    nombre: 'Asado 2D',
    tipo: 'amigos',
    fecha: '23 ago 2025',
    adultos: 9, ninos: 0,
    total: 115000,
    tendencia: 'bajo',
    cortes: ['Palanca', 'Longaniza', 'Provoleta'],
  },
  {
    id: '3',
    nombre: 'Asado Toby',
    tipo: 'oficina',
    fecha: '12 jul 2025',
    adultos: 8, ninos: 0,
    total: 92000,
    tendencia: 'bajo',
    cortes: ['Costillar', 'Longaniza'],
    observacion: 'Grupo chico, todo justo.',
  },
  {
    id: '2',
    nombre: 'Asado Pádel Abr',
    tipo: 'amigos',
    fecha: '5 abr 2025',
    adultos: 19, ninos: 0,
    total: 215000,
    cortes: ['Punta de ganso', 'Costillar', 'Curacaribs', 'Champiñones rellenos'],
  },
  {
    id: '1',
    nombre: 'Asado 1D',
    tipo: 'amigos',
    fecha: '14 feb 2025',
    adultos: 22, ninos: 3,
    total: 282000,
    cortes: ['Sobrecostilla Wagyu', 'Entraña trenzada', 'Malaya normal', 'Longaniza'],
    observacion: 'Wagyu fue un hit. El corte premium valió la pena.',
  },
]

type FiltroTipo = 'todos' | Tipo
const FILTROS: { id: FiltroTipo; label: string }[] = [
  { id: 'todos',   label: 'Todos'    },
  { id: 'amigos',  label: 'Amigos'   },
  { id: 'familiar',label: 'Familiar' },
  { id: 'colegio', label: 'Colegio'  },
  { id: 'oficina', label: 'Oficina'  },
]

export default function AsadosHistorialMockup() {
  const [filtro,    setFiltro]    = useState<FiltroTipo>('todos')
  const [expandido, setExpandido] = useState<string | null>(null)

  const lista = filtro === 'todos' ? HISTORIAL : HISTORIAL.filter(a => a.tipo === filtro)

  const totalPersonas = HISTORIAL.reduce((s, a) => s + a.adultos + a.ninos, 0)
  const totalGastado  = HISTORIAL.reduce((s, a) => s + a.total, 0)
  const promPorPersona = Math.round(totalGastado / totalPersonas)

  return (
    <div className="min-h-screen pb-8" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <div>
            <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>Historial</h1>
          </div>
        </div>

        <div className="px-4 space-y-4 mt-4">

          {/* Stats strip */}
          <div className="rounded-xl px-4 py-3 flex items-center gap-4"
            style={{ background: C.ink }}>
            <div className="flex-1">
              <p className="font-inter text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Asados registrados
              </p>
              <p className="font-manrope text-[22px] font-bold text-white leading-tight">
                {HISTORIAL.length}
              </p>
            </div>
            <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex-1">
              <p className="font-inter text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Promedio / persona
              </p>
              <p className="font-manrope text-[22px] font-bold leading-tight" style={{ color: C.ember }}>
                {fmt(promPorPersona)}
              </p>
            </div>
            <div className="w-px self-stretch" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex-1">
              <p className="font-inter text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Total gastado
              </p>
              <p className="font-manrope text-[15px] font-bold text-white leading-tight">
                {fmt(totalGastado)}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {FILTROS.map(f => (
              <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
                className="shrink-0 font-inter text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: filtro === f.id ? C.ink  : C.card,
                  color:      filtro === f.id ? '#FFF' : C.muted,
                  boxShadow:  filtro === f.id ? 'none' : '0 1px 3px rgba(28,26,23,0.07)',
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {lista.map(asado => {
              const cfg      = TIPO_CFG[asado.tipo]
              const expanded = expandido === asado.id
              const total    = asado.adultos + asado.ninos
              const ppp      = Math.round(asado.total / (asado.adultos + asado.ninos * 0.5))

              return (
                <div key={asado.id} className="rounded-xl overflow-hidden"
                  style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>

                  {/* Main row */}
                  <button type="button"
                    onClick={() => setExpandido(expanded ? null : asado.id)}
                    className="w-full flex items-stretch text-left">
                    {/* Color accent bar */}
                    <div className="w-1 shrink-0 self-stretch" style={{ background: cfg.color }} />

                    <div className="flex-1 px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-manrope text-[14px] font-bold" style={{ color: C.ink }}>
                              {asado.nombre}
                            </p>
                            <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{ background: cfg.soft, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                              {asado.fecha}
                            </p>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" style={{ color: C.muted }} />
                              <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                                {total}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-manrope text-[15px] font-bold" style={{ color: C.ink }}>
                            {fmt(asado.total)}
                          </p>
                          <div className="flex items-center justify-end gap-1">
                            {asado.tendencia === 'subio' && (
                              <TrendingUp className="h-3 w-3" style={{ color: C.ember }} />
                            )}
                            {asado.tendencia === 'bajo' && (
                              <TrendingDown className="h-3 w-3" style={{ color: '#166534' }} />
                            )}
                            {asado.tendencia === 'igual' && (
                              <MinusIcon className="h-3 w-3" style={{ color: C.muted }} />
                            )}
                            <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                              {fmt(ppp)}/persona
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center pr-3">
                      {expanded
                        ? <ChevronUp   className="h-4 w-4 shrink-0" style={{ color: C.muted }} />
                        : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: C.muted }} />}
                    </div>
                  </button>

                  {/* Detalle expandible */}
                  {expanded && (
                    <div className="px-4 pb-3 border-t" style={{ borderColor: C.border }}>
                      {asado.cortes && asado.cortes.length > 0 && (
                        <div className="mt-3">
                          <p className="font-inter text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                            style={{ color: C.muted }}>
                            Cortes y recetas
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {asado.cortes.map(c => (
                              <span key={c}
                                className="font-inter text-[11px] font-medium px-2 py-0.5 rounded-full"
                                style={{ background: C.soft, color: C.ember }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {asado.observacion && (
                        <div className="mt-3 rounded-lg px-3 py-2"
                          style={{ background: C.bg }}>
                          <p className="font-inter text-[10px] font-semibold uppercase tracking-widest mb-1"
                            style={{ color: C.muted }}>
                            Observaciones
                          </p>
                          <p className="font-inter text-[12px] leading-relaxed" style={{ color: C.ink }}>
                            {asado.observacion}
                          </p>
                        </div>
                      )}
                      <button type="button"
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg font-inter text-[12px] font-semibold"
                        style={{ background: C.border, color: C.muted }}>
                        Ver detalle completo
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {lista.length === 0 && (
            <div className="text-center py-12">
              <p className="font-manrope text-[15px] font-bold" style={{ color: C.muted }}>
                Sin asados de este tipo aún
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
