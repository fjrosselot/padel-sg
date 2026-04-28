// MOCKUP — App Asados · Wizard paso 1: Configuración del evento
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, Calendar, Users } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',
  card:   '#FFFFFF',
  ink:    '#1C1A17',
  ember:  '#C4541A',
  muted:  '#8B7E74',
  soft:   '#FFF0E8',
  border: '#EDE8E3',
}

const TIPOS = [
  { id: 'amigos',   label: 'Amigos' },
  { id: 'familiar', label: 'Familiar' },
  { id: 'colegio',  label: 'Colegio' },
  { id: 'oficina',  label: 'Oficina' },
  { id: 'otro',     label: 'Otro' },
]

const MODALIDADES = [
  { id: 'parejo',       label: 'Parejo',       desc: 'Todos pagan igual' },
  { id: 'diferenciado', label: 'Diferenciado', desc: 'Adulto / niño' },
  { id: 'por_familia',  label: 'Por familia',  desc: 'Prorrateo familiar' },
  { id: 'invitacion',   label: 'Invitación',   desc: 'Pancho pone todo' },
  { id: 'mixto',        label: 'Mixto',        desc: 'Combinación' },
]

const ASISTENTES = [
  { id: 'adultos',       label: 'Adultos',       pond: '×1.0' },
  { id: 'adolescentes',  label: 'Adolescentes',  pond: '×1.0' },
  { id: 'ninos',         label: 'Niños',         pond: '×0.5' },
  { id: 'bebes',         label: 'Bebés',         pond: '×0' },
]

function ContadorRow({
  label, pond, value, onChange, isLast,
}: {
  label: string; pond: string; value: number; onChange: (v: number) => void; isLast: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${!isLast ? 'border-b' : ''}`}
      style={{ borderColor: C.border }}>
      <div className="flex items-center gap-2">
        <p className="font-manrope text-[14px] font-bold" style={{ color: C.ink }}>{label}</p>
        <span className="font-inter text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: C.border, color: C.muted }}>
          {pond}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ background: value === 0 ? C.border : '#F5F3F0' }}>
          <Minus className="h-3.5 w-3.5" style={{ color: value === 0 ? C.border : C.muted }} />
        </button>
        <span className="font-manrope text-[16px] font-bold w-6 text-center" style={{ color: C.ink }}>
          {value}
        </span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: C.ember }}>
          <Plus className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </div>
  )
}

export default function AsadosWizardConfigMockup() {
  const [nombre,   setNombre]   = useState('Asado padres 4°B')
  const [fecha,    setFecha]    = useState('2026-05-15')
  const [tipo,     setTipo]     = useState('colegio')
  const [cobro,    setCobro]    = useState('diferenciado')
  const [personas, setPersonas] = useState({ adultos: 15, adolescentes: 0, ninos: 8, bebes: 0 })

  const ponderado =
    personas.adultos * 1 +
    personas.adolescentes * 1 +
    personas.ninos * 0.5 +
    personas.bebes * 0

  const total = personas.adultos + personas.adolescentes + personas.ninos + personas.bebes
  const valido = nombre.trim().length > 0 && total > 0

  const fechaLabel = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="min-h-screen pb-32" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-8 pb-3">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: C.card, boxShadow: '0 1px 3px rgba(28,26,23,0.1)' }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.muted }} />
          </button>
          <div className="flex-1">
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              Paso 1 de 4
            </p>
            <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>Nuevo asado</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 mb-6">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full" style={{ width: '25%', background: C.ember }} />
          </div>
        </div>

        <div className="px-4 space-y-5">

          {/* Nombre */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Nombre
            </p>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Asado cumple Trini"
              className="w-full rounded-xl px-4 py-3 font-manrope text-[15px] font-bold focus:outline-none"
              style={{
                background: C.card,
                color: C.ink,
                border: `2px solid ${nombre.trim() ? C.ember : C.border}`,
                boxShadow: '0 1px 4px rgba(28,26,23,0.07)',
              }}
            />
          </div>

          {/* Fecha + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            {/* Fecha */}
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: C.muted }}>
                Fecha
              </p>
              <div className="rounded-xl px-3 py-3 flex items-center gap-2"
                style={{
                  background: C.card,
                  border: `2px solid ${fecha ? C.ember : C.border}`,
                  boxShadow: '0 1px 4px rgba(28,26,23,0.07)',
                }}>
                <Calendar className="h-4 w-4 shrink-0" style={{ color: C.ember }} />
                <div className="min-w-0">
                  <p className="font-manrope text-[12px] font-bold truncate" style={{ color: C.ink }}>
                    {fecha
                      ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
                      : 'Elegir'}
                  </p>
                  {fecha && (
                    <p className="font-inter text-[10px]" style={{ color: C.muted }}>
                      {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long' })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tipo */}
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: C.muted }}>
                Tipo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS.map(t => (
                  <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                    className="font-inter text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: tipo === t.id ? C.ink : C.card,
                      color:      tipo === t.id ? '#FFF' : C.muted,
                      boxShadow:  tipo === t.id ? 'none' : '0 1px 3px rgba(28,26,23,0.07)',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Asistentes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: C.muted }}>
                Asistentes
              </p>
              {total > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" style={{ color: C.ember }} />
                  <span className="font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                    {total} personas
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-xl px-4"
              style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
              {ASISTENTES.map((a, i) => (
                <ContadorRow
                  key={a.id}
                  label={a.label}
                  pond={a.pond}
                  value={personas[a.id as keyof typeof personas]}
                  onChange={v => setPersonas(p => ({ ...p, [a.id]: v }))}
                  isLast={i === ASISTENTES.length - 1}
                />
              ))}
            </div>

            {/* Total ponderado */}
            {total > 0 && (
              <div className="mt-2 rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: C.soft }}>
                <p className="font-inter text-[12px] font-semibold" style={{ color: C.ember }}>
                  Total ponderado (para cobros)
                </p>
                <p className="font-manrope text-[18px] font-bold" style={{ color: C.ember }}>
                  {ponderado.toFixed(1)}
                </p>
              </div>
            )}
          </div>

          {/* Modalidad de cobro */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Modalidad de cobro
            </p>
            <div className="space-y-2">
              {MODALIDADES.map(m => {
                const active = cobro === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setCobro(m.id)}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-colors text-left"
                    style={{
                      background:  active ? C.soft : C.card,
                      border:      `2px solid ${active ? C.ember : C.border}`,
                      boxShadow:   active ? 'none' : '0 1px 3px rgba(28,26,23,0.05)',
                    }}>
                    <p className="font-manrope text-[14px] font-bold" style={{ color: active ? C.ember : C.ink }}>
                      {m.label}
                    </p>
                    <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                      {m.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0"
        style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            {total > 0 && (
              <>
                <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                  {total} personas · ponderado {ponderado.toFixed(1)}
                </p>
                <p className="font-manrope text-[13px] font-semibold" style={{ color: C.ink }}>
                  {TIPOS.find(t => t.id === tipo)?.label} · {fechaLabel}
                </p>
              </>
            )}
          </div>
          <button type="button"
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-manrope text-[13px] font-bold text-white"
            style={{ background: valido ? C.ember : C.border }}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
