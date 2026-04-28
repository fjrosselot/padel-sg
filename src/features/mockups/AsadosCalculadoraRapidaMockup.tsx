// MOCKUP — App Asados · Calculadora rápida
import { useState } from 'react'
import { Minus, Plus, Copy, Check } from 'lucide-react'

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
function fmtKg(kg: number) {
  const v = Math.ceil(kg * 2) / 2
  return `${v.toFixed(v % 1 === 0 ? 0 : 1)} kg`
}

type Perfil = 'express' | 'estandar' | 'copeton'

const PERFIL_CFG: Record<Perfil, { label: string; desc: string; gAdulto: number; gNino: number }> = {
  express:  { label: 'Express',  desc: '~250 g/p', gAdulto: 250, gNino: 150 },
  estandar: { label: 'Estándar', desc: '~350 g/p', gAdulto: 350, gNino: 200 },
  copeton:  { label: 'Copetón',  desc: '~450 g/p', gAdulto: 450, gNino: 250 },
}

type Corte = {
  id: string
  nombre: string
  categoria: 'vacuno' | 'embutido' | 'pollo' | 'otro'
  fraccion: number   // fracción del total proteínico (suma = 1 cuando todos seleccionados)
  precioKg: number
  sel: boolean
}

const CORTES_BASE: Corte[] = [
  { id: 'costillar',    nombre: 'Costillar',        categoria: 'vacuno',   fraccion: 0.35, precioKg: 6500,  sel: true  },
  { id: 'entrana',      nombre: 'Entraña',           categoria: 'vacuno',   fraccion: 0.25, precioKg: 14200, sel: true  },
  { id: 'lomo',         nombre: 'Lomo vetado',       categoria: 'vacuno',   fraccion: 0.20, precioKg: 13500, sel: false },
  { id: 'palanca',      nombre: 'Palanca',           categoria: 'vacuno',   fraccion: 0.20, precioKg: 9200,  sel: false },
  { id: 'longaniza',    nombre: 'Longaniza',         categoria: 'embutido', fraccion: 0.15, precioKg: 7000,  sel: true  },
  { id: 'curacaribs',   nombre: 'Curacaribs (mix)',  categoria: 'embutido', fraccion: 0.15, precioKg: 8500,  sel: false },
  { id: 'provoleta',    nombre: 'Provoleta',         categoria: 'otro',     fraccion: 0.05, precioKg: 12000, sel: false },
  { id: 'pollo',        nombre: 'Pollo / Trutros',   categoria: 'pollo',    fraccion: 0.20, precioKg: 4800,  sel: false },
]

const CAT_COLOR: Record<string, string> = {
  vacuno:   '#C4541A',
  embutido: '#7C6A15',
  pollo:    '#1E5FA8',
  otro:     '#5A6B82',
}

export default function AsadosCalculadoraRapidaMockup() {
  const [adultos, setAdultos] = useState(15)
  const [ninos,   setNinos]   = useState(8)
  const [perfil,  setPerfil]  = useState<Perfil>('estandar')
  const [cortes,  setCortes]  = useState<Corte[]>(CORTES_BASE)
  const [copied,  setCopied]  = useState(false)

  function toggle(id: string) {
    setCortes(p => p.map(c => c.id === id ? { ...c, sel: !c.sel } : c))
  }

  const selCortes   = cortes.filter(c => c.sel)
  const cfg         = PERFIL_CFG[perfil]
  const totalG      = adultos * cfg.gAdulto + ninos * cfg.gNino    // total grams proteína
  const totalFrac   = selCortes.reduce((s, c) => s + c.fraccion, 0) || 1

  // Distribute totalG across selected cuts proportionally
  const resultados = selCortes.map(c => {
    const kg = (totalG * (c.fraccion / totalFrac)) / 1000
    const costoEst = kg * c.precioKg
    return { ...c, kg, costoEst }
  })

  const totalKg   = resultados.reduce((s, r) => s + r.kg, 0)
  const totalCost = resultados.reduce((s, r) => s + r.costoEst, 0)
  const totalPersonas = adultos + ninos

  return (
    <div className="min-h-screen pb-8" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="px-4 pt-8 pb-4">
          <h1 className="font-manrope text-xl font-bold" style={{ color: C.ink }}>Calculadora rápida</h1>
          <p className="font-inter text-[12px] mt-0.5" style={{ color: C.muted }}>
            ¿Cuánta carne necesito? Sin wizard completo.
          </p>
        </div>

        <div className="px-4 space-y-4">

          {/* Personas */}
          <div className="rounded-xl overflow-hidden"
            style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
            {[
              { label: 'Adultos', value: adultos, set: setAdultos },
              { label: 'Niños',   value: ninos,   set: setNinos   },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
                style={{ borderColor: C.border }}>
                <p className="font-manrope text-[14px] font-bold" style={{ color: C.ink }}>{row.label}</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => row.set(v => Math.max(0, v - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: C.border }}>
                    <Minus className="h-3.5 w-3.5" style={{ color: C.muted }} />
                  </button>
                  <span className="font-manrope text-[20px] font-bold w-8 text-center" style={{ color: C.ink }}>
                    {row.value}
                  </span>
                  <button type="button" onClick={() => row.set(v => v + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: C.ember }}>
                    <Plus className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Perfil */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Perfil del asado
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(PERFIL_CFG) as [Perfil, typeof PERFIL_CFG[Perfil]][]).map(([id, p]) => (
                <button key={id} type="button" onClick={() => setPerfil(id)}
                  className="py-3 px-2 rounded-xl text-center transition-colors"
                  style={{
                    background: perfil === id ? C.ink  : C.card,
                    border:     perfil === id ? 'none' : `1.5px solid ${C.border}`,
                    boxShadow:  perfil === id ? 'none' : '0 1px 3px rgba(28,26,23,0.06)',
                  }}>
                  <p className="font-manrope text-[13px] font-bold"
                    style={{ color: perfil === id ? '#FFF' : C.ink }}>
                    {p.label}
                  </p>
                  <p className="font-inter text-[10px]"
                    style={{ color: perfil === id ? 'rgba(255,255,255,0.5)' : C.muted }}>
                    {p.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Selección de cortes */}
          <div>
            <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: C.muted }}>
              Cortes a incluir
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cortes.map(c => (
                <button key={c.id} type="button" onClick={() => toggle(c.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-inter text-[11px] font-semibold transition-colors"
                  style={{
                    background: c.sel ? CAT_COLOR[c.categoria] + '22' : C.card,
                    color:      c.sel ? CAT_COLOR[c.categoria] : C.muted,
                    border:     `1.5px solid ${c.sel ? CAT_COLOR[c.categoria] : C.border}`,
                  }}>
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Resultados */}
          {resultados.length > 0 && (
            <div>
              <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: C.muted }}>
                Resultado — {totalPersonas} personas
              </p>
              <div className="rounded-xl overflow-hidden"
                style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
                {resultados.map((r, i) => (
                  <div key={r.id} className={`flex items-center px-4 py-3 ${i > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: C.border }}>
                    <div className="w-2 h-2 rounded-full mr-3 shrink-0"
                      style={{ background: CAT_COLOR[r.categoria] }} />
                    <p className="flex-1 font-manrope text-[13px] font-bold" style={{ color: C.ink }}>
                      {r.nombre}
                    </p>
                    <div className="text-right">
                      <p className="font-manrope text-[14px] font-bold" style={{ color: C.ink }}>
                        {fmtKg(r.kg)}
                      </p>
                      <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                        ~{fmt(r.costoEst)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div className="flex items-center justify-between px-4 py-3 border-t"
                  style={{ borderColor: C.border, background: C.soft }}>
                  <div>
                    <p className="font-inter text-[11px] font-semibold" style={{ color: C.ember }}>
                      Total proteína
                    </p>
                    <p className="font-inter text-[10px]" style={{ color: C.muted }}>
                      ~{fmt(Math.round(totalCost / totalPersonas))}/persona
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-manrope text-[20px] font-bold" style={{ color: C.ember }}>
                      {fmtKg(totalKg)}
                    </p>
                    <p className="font-inter text-[11px]" style={{ color: C.muted }}>
                      ~{fmt(totalCost)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {resultados.length === 0 && (
            <div className="text-center py-8 rounded-xl" style={{ background: C.card }}>
              <p className="font-inter text-[13px]" style={{ color: C.muted }}>
                Selecciona al menos un corte para ver el resultado
              </p>
            </div>
          )}

          {/* Copy para carnicería */}
          {resultados.length > 0 && (
            <button type="button"
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-manrope text-[14px] font-bold transition-all"
              style={{ background: copied ? '#22C55E' : C.ink, color: '#FFF' }}>
              {copied
                ? <><Check className="h-4 w-4" /> ¡Copiado!</>
                : <><Copy  className="h-4 w-4" /> Copiar para la carnicería</>}
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
