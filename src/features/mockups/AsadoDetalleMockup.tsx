// MOCKUP — App Asados · Detalle de un asado registrado
import { useState } from 'react'
import { ChevronLeft, ChevronDown, ChevronUp, Users, Copy, Check, CheckCircle2, Clock } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',
  card:   '#FFFFFF',
  ink:    '#1C1A17',
  ember:  '#C4541A',
  muted:  '#8B7E74',
  soft:   '#FFF0E8',
  border: '#EDE8E3',
  green:  '#166534',
  greenSoft: '#DCFCE7',
}

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CL') }

const ASADO = {
  nombre:    'Asado Pádel Nov',
  fecha:     '8 nov 2025',
  tipo:      'Amigos',
  adultos:   24,
  ninos:     3,
  total:     298000,
  modalidad: 'Parejo',
  cobro_pp:  11500,
  total_cobrar: 310500,
  total_recaudado: 253000,
  observacion: 'Sobró malaya — reducir a 2 kg la próxima vez. Entraña trenzada fue la estrella, todos la pidieron de nuevo. Considerar 2 kg más de costillar.',
}

type LineItem = { nombre: string; cantidad: string; precio: number; badge?: 'corte' | 'receta' }

const CORTES: LineItem[] = [
  { nombre: 'Entraña trenzada', cantidad: '4.5 kg', precio: 63900, badge: 'receta' },
  { nombre: 'Malaya pizza',     cantidad: '3.0 kg',  precio: 36000, badge: 'receta' },
  { nombre: 'Costillar',        cantidad: '8.0 kg',  precio: 52000, badge: 'corte'  },
  { nombre: 'Longaniza',        cantidad: '4.0 kg',  precio: 28000, badge: 'corte'  },
]
const ACOMP: LineItem[] = [
  { nombre: 'Ensalada chilena', cantidad: '27 p',     precio: 9500 },
  { nombre: 'Pebre',           cantidad: '27 p',     precio: 4800 },
  { nombre: 'Pan amasado',     cantidad: '2 bolsas', precio: 6800 },
]
const EXTRAS: LineItem[] = [
  { nombre: 'Carbón',   cantidad: '4 bolsas', precio: 12000 },
  { nombre: 'Vino',     cantidad: '6 bot.',   precio: 48000 },
  { nombre: 'Bebidas',  cantidad: 'varias',   precio: 17000 },
]

const PARTICIPANTES_MINI = [
  { nombre: 'Juan Pérez',   estado: 'pagado'   as const },
  { nombre: 'Pedro Soto',   estado: 'pagado'   as const },
  { nombre: 'María López',  estado: 'pagado'   as const },
  { nombre: 'Luis Morales', estado: 'pendiente' as const },
  { nombre: 'Ana González', estado: 'pendiente' as const },
]

function ItemRow({ item, i }: { item: LineItem; i: number }) {
  return (
    <div className={`flex items-center px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
      style={{ borderColor: C.border }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>{item.nombre}</p>
          {item.badge && (
            <span className="font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: C.soft, color: C.ember }}>
              {item.badge}
            </span>
          )}
        </div>
        <p className="font-inter text-[11px]" style={{ color: C.muted }}>{item.cantidad}</p>
      </div>
      <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>{fmt(item.precio)}</p>
    </div>
  )
}

function SeccionToggle({
  label, subtotal, items, open, onToggle,
}: {
  label: string; subtotal: number; items: LineItem[]; open: boolean; onToggle: () => void
}) {
  return (
    <div>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
        <div className="flex items-center gap-3">
          <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
            {label}
          </p>
          <p className="font-inter text-[11px] font-semibold" style={{ color: C.ember }}>
            {fmt(subtotal)}
          </p>
        </div>
        {open
          ? <ChevronUp   className="h-4 w-4" style={{ color: C.muted }} />
          : <ChevronDown className="h-4 w-4" style={{ color: C.muted }} />}
      </button>
      {open && (
        <div className="mt-1 rounded-xl overflow-hidden"
          style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
          {items.map((it, i) => <ItemRow key={i} item={it} i={i} />)}
        </div>
      )}
    </div>
  )
}

export default function AsadoDetalleMockup() {
  const [open, setOpen] = useState<Record<string, boolean>>({ cortes: true, acomp: false, extras: false, cobros: false })
  const [copied, setCopied] = useState(false)

  function tog(s: string) { setOpen(p => ({ ...p, [s]: !p[s] })) }

  const progreso = ASADO.total_recaudado / ASADO.total_cobrar
  const pendCount = PARTICIPANTES_MINI.filter(p => p.estado === 'pendiente').length
  const pagCount  = PARTICIPANTES_MINI.filter(p => p.estado === 'pagado').length

  return (
    <div className="min-h-screen pb-8" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-manrope text-xl font-bold truncate" style={{ color: C.ink }}>
                {ASADO.nombre}
              </h1>
              <span className="shrink-0 font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: C.soft, color: C.ember }}>
                {ASADO.tipo}
              </span>
            </div>
            <p className="font-inter text-[11px]" style={{ color: C.muted }}>{ASADO.fecha}</p>
          </div>
        </div>

        <div className="px-4 space-y-3 mt-4">

          {/* Hero card */}
          <div className="rounded-2xl p-4" style={{ background: C.ink }}>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="font-inter text-[9px] font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Total</p>
                <p className="font-manrope text-[20px] font-bold text-white leading-tight">
                  {fmt(ASADO.total)}
                </p>
              </div>
              <div>
                <p className="font-inter text-[9px] font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>$/persona</p>
                <p className="font-manrope text-[20px] font-bold leading-tight" style={{ color: C.ember }}>
                  {fmt(ASADO.cobro_pp)}
                </p>
              </div>
              <div>
                <p className="font-inter text-[9px] font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Personas</p>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-white opacity-60" />
                  <p className="font-manrope text-[20px] font-bold text-white leading-tight">
                    {ASADO.adultos + ASADO.ninos}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="font-inter text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {ASADO.adultos} adultos · {ASADO.ninos} niños · Cobro {ASADO.modalidad.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Secciones de compras */}
          <SeccionToggle
            label="Cortes y recetas"
            subtotal={CORTES.reduce((s, it) => s + it.precio, 0)}
            items={CORTES}
            open={open.cortes}
            onToggle={() => tog('cortes')}
          />
          <SeccionToggle
            label="Acompañamientos"
            subtotal={ACOMP.reduce((s, it) => s + it.precio, 0)}
            items={ACOMP}
            open={open.acomp}
            onToggle={() => tog('acomp')}
          />
          <SeccionToggle
            label="Extras"
            subtotal={EXTRAS.reduce((s, it) => s + it.precio, 0)}
            items={EXTRAS}
            open={open.extras}
            onToggle={() => tog('extras')}
          />

          {/* Cobros summary */}
          <div>
            <button type="button" onClick={() => tog('cobros')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              <div className="flex items-center gap-3">
                <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
                  Cobros
                </p>
                <p className="font-inter text-[11px] font-semibold" style={{ color: C.green }}>
                  {Math.round(progreso * 100)}% recaudado
                </p>
              </div>
              {open.cobros
                ? <ChevronUp   className="h-4 w-4" style={{ color: C.muted }} />
                : <ChevronDown className="h-4 w-4" style={{ color: C.muted }} />}
            </button>
            {open.cobros && (
              <div className="mt-1 rounded-xl overflow-hidden"
                style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
                {/* mini progress */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                      {fmt(ASADO.total_recaudado)} / {fmt(ASADO.total_cobrar)}
                    </p>
                    <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                      {pagCount} pagaron · {pendCount} pendiente{pendCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round(progreso * 100)}%`, background: '#4ADE80' }} />
                  </div>
                </div>
                {PARTICIPANTES_MINI.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-t"
                    style={{ borderColor: C.border }}>
                    <p className="font-inter text-[12px]" style={{ color: C.ink }}>{p.nombre}</p>
                    <div className="flex items-center gap-1.5">
                      {p.estado === 'pagado'
                        ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: C.green }} />
                        : <Clock        className="h-3.5 w-3.5" style={{ color: C.ember }} />}
                      <span className="font-inter text-[11px] font-semibold"
                        style={{ color: p.estado === 'pagado' ? C.green : C.ember }}>
                        {p.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones */}
          {ASADO.observacion && (
            <div className="rounded-xl px-4 py-3"
              style={{ background: C.soft, border: `1px solid ${C.border}` }}>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: C.ember }}>
                Observaciones
              </p>
              <p className="font-inter text-[13px] leading-relaxed" style={{ color: C.ink }}>
                {ASADO.observacion}
              </p>
            </div>
          )}

          {/* CTA */}
          <button type="button"
            onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-manrope text-[14px] font-bold transition-all mb-4"
            style={{ background: C.ink, color: '#FFF' }}>
            {copied
              ? <><Check className="h-4 w-4" /> Plantilla copiada</>
              : <><Copy  className="h-4 w-4" /> Usar como plantilla</>}
          </button>

        </div>
      </div>
    </div>
  )
}
