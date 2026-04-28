// MOCKUP — App Asados · Panel de cobros
import { useState } from 'react'
import { ChevronLeft, MessageCircle, Check, CheckCircle2, Clock, Minus, Gift, AlertCircle } from 'lucide-react'

const C = {
  bg:         '#FAF8F5',
  card:       '#FFFFFF',
  ink:        '#1C1A17',
  ember:      '#C4541A',
  muted:      '#8B7E74',
  soft:       '#FFF0E8',
  border:     '#EDE8E3',
  green:      '#166534',
  greenSoft:  '#DCFCE7',
  yellow:     '#854D0E',
  yellowSoft: '#FEF9C3',
}

function fmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CL') }

type Estado = 'pagado' | 'pendiente' | 'parcial' | 'invitado'
type MedioPago = 'transferencia' | 'efectivo'

type Participante = {
  id: string
  nombre: string
  adultos: number
  adolescentes?: number
  ninos?: number
  estado: Estado
  medio_pago?: MedioPago
}

const ASADO = {
  nombre: 'Asado padres 4°B',
  fecha: '15 mar 2026',
  tipo: 'Colegio',
  total_real: 185000,
  cobro_adulto: 10000,
  cobro_nino: 5000,
}

const INIT: Participante[] = [
  { id: '1', nombre: 'Juan Pérez',     adultos: 1,               estado: 'pagado',   medio_pago: 'transferencia' },
  { id: '2', nombre: 'María López',    adultos: 1, ninos: 2,     estado: 'pendiente' },
  { id: '3', nombre: 'Pedro Soto',     adultos: 1,               estado: 'pagado',   medio_pago: 'efectivo' },
  { id: '4', nombre: 'Ana González',   adultos: 1, adolescentes: 1, ninos: 1, estado: 'parcial' },
  { id: '5', nombre: 'Carlos Ruiz',    adultos: 1,               estado: 'pendiente' },
  { id: '6', nombre: 'Sandra Torres',  adultos: 1, ninos: 1,     estado: 'pagado',   medio_pago: 'transferencia' },
  { id: '7', nombre: 'Luis Morales',   adultos: 2,               estado: 'pendiente' },
  { id: '8', nombre: 'Carla Fuentes',  adultos: 1, ninos: 1,     estado: 'invitado' },
  { id: '9', nombre: 'Diego Castro',   adultos: 1, ninos: 2,     estado: 'pagado',   medio_pago: 'efectivo' },
]

function cobro(p: Participante): number {
  if (p.estado === 'invitado') return 0
  return (p.adultos + (p.adolescentes ?? 0)) * ASADO.cobro_adulto +
         (p.ninos ?? 0) * ASADO.cobro_nino
}

const STATE_CFG: Record<Estado, { bg: string; color: string; Icon: React.ElementType; label: string }> = {
  pagado:   { bg: '#DCFCE7', color: '#166534', Icon: CheckCircle2, label: 'Pagado'   },
  pendiente:{ bg: '#FFF0E8', color: '#C4541A', Icon: Clock,        label: 'Pendiente'},
  parcial:  { bg: '#FEF9C3', color: '#854D0E', Icon: AlertCircle,  label: 'Parcial'  },
  invitado: { bg: '#EDE8E3', color: '#8B7E74', Icon: Gift,         label: 'Invitado' },
}

export default function AsadosCobrosListMockup() {
  const [partes, setPartes]       = useState<Participante[]>(INIT)
  const [waSent, setWaSent]       = useState(false)

  function toggle(id: string) {
    setPartes(prev => prev.map(p => {
      if (p.id !== id || p.estado === 'invitado') return p
      const next: Estado =
        p.estado === 'pendiente' ? 'pagado'   :
        p.estado === 'pagado'    ? 'pendiente' :
        p.estado === 'parcial'   ? 'pagado'   : p.estado
      return { ...p, estado: next, medio_pago: next === 'pagado' ? (p.medio_pago ?? 'transferencia') : undefined }
    }))
  }

  const totalACobrar   = partes.reduce((s, p) => s + cobro(p), 0)
  const totalRecaudado = partes.reduce((s, p) => {
    if (p.estado === 'pagado')  return s + cobro(p)
    if (p.estado === 'parcial') return s + cobro(p) * 0.5
    return s
  }, 0)
  const pendienteCount = partes.filter(p => p.estado === 'pendiente').length
  const parcialCount   = partes.filter(p => p.estado === 'parcial').length
  const subsidio       = Math.max(0, ASADO.total_real - totalACobrar)
  const progreso       = totalACobrar > 0 ? totalRecaudado / totalACobrar : 0

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg }}>
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
                Cobros
              </h1>
              <span className="shrink-0 font-inter text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: C.soft, color: C.ember }}>
                {ASADO.tipo}
              </span>
            </div>
            <p className="font-inter text-[11px] mt-0.5" style={{ color: C.muted }}>
              {ASADO.nombre} · {ASADO.fecha}
            </p>
          </div>
        </div>

        <div className="px-4 space-y-4 mt-4">

          {/* Summary card oscura */}
          <div className="rounded-2xl p-4" style={{ background: C.ink }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-inter text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Costo real del asado
                </p>
                <p className="font-manrope text-[26px] font-bold text-white leading-none">
                  {fmt(ASADO.total_real)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <p className="font-inter text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Adulto
                  </p>
                  <p className="font-manrope text-[15px] font-bold" style={{ color: C.ember }}>
                    {fmt(ASADO.cobro_adulto)}
                  </p>
                </div>
                <div>
                  <p className="font-inter text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Niño
                  </p>
                  <p className="font-manrope text-[15px] font-bold" style={{ color: C.ember }}>
                    {fmt(ASADO.cobro_nino)}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="font-manrope text-[13px] font-bold" style={{ color: '#4ADE80' }}>
                  {Math.round(progreso * 100)}% recaudado
                </p>
                <p className="font-inter text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {fmt(totalRecaudado)} / {fmt(totalACobrar)}
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(progreso * 100)}%`, background: '#4ADE80' }} />
              </div>
            </div>

            {/* mini stats */}
            <div className="flex gap-2">
              {pendienteCount > 0 && (
                <div className="flex-1 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(196,84,26,0.25)' }}>
                  <p className="font-inter text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.5)' }}>Pendiente</p>
                  <p className="font-manrope text-[13px] font-bold text-white">
                    {pendienteCount} persona{pendienteCount > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {parcialCount > 0 && (
                <div className="flex-1 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(133,77,14,0.35)' }}>
                  <p className="font-inter text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.5)' }}>Parcial</p>
                  <p className="font-manrope text-[13px] font-bold text-white">
                    {parcialCount} persona{parcialCount > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {subsidio > 0 && (
                <div className="flex-1 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <p className="font-inter text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.45)' }}>Mi subsidio</p>
                  <p className="font-manrope text-[13px] font-bold text-white">{fmt(subsidio)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Participant list */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Participantes
            </p>
            <div className="rounded-xl overflow-hidden"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {partes.map((p, i) => {
                const monto    = cobro(p)
                const cfg      = STATE_CFG[p.estado]
                const Icon     = cfg.Icon
                const isInvite = p.estado === 'invitado'
                const partes2: string[] = []
                if (p.adultos > 0) partes2.push(`${p.adultos} adulto${p.adultos > 1 ? 's' : ''}`)
                if ((p.adolescentes ?? 0) > 0) partes2.push(`${p.adolescentes} adol.`)
                if ((p.ninos ?? 0) > 0) partes2.push(`${p.ninos} niño${p.ninos! > 1 ? 's' : ''}`)

                return (
                  <div key={p.id} className={`flex items-center px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: C.border }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                        {p.nombre}
                      </p>
                      <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                        {partes2.join(' · ')}
                      </p>
                    </div>
                    <p className="font-manrope text-[13px] font-bold mr-3"
                      style={{ color: isInvite ? C.muted : C.ink }}>
                      {isInvite ? '—' : fmt(monto)}
                    </p>
                    <button type="button" onClick={() => toggle(p.id)} disabled={isInvite}
                      className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg font-inter text-[10px] font-semibold transition-colors"
                      style={{ background: cfg.bg, color: cfg.color, cursor: isInvite ? 'default' : 'pointer' }}>
                      <Icon className="h-3 w-3" />
                      <span>{cfg.label}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="font-inter text-[10px] text-center" style={{ color: C.border }}>
            Toca el estado de cada persona para actualizarlo
          </p>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-4">
          <button type="button"
            onClick={() => { setWaSent(true); setTimeout(() => setWaSent(false), 2000) }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-manrope text-[14px] font-bold transition-all"
            style={{ background: waSent ? '#22C55E' : C.ink, color: '#FFF' }}>
            {waSent
              ? <><Check className="h-4 w-4" /> ¡Copiado al portapapeles!</>
              : <><MessageCircle className="h-4 w-4" /> Compartir resumen por WhatsApp</>}
          </button>
        </div>
      </div>
    </div>
  )
}
