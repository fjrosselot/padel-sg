// TEMP MOCKUP — delete after design review

const CATS = [
  { nombre: '4a Masculino', color: '#dbeafe', accent: '#93c5fd', text: '#1d4ed8' },
  { nombre: '3a Mixto',     color: '#ede9fe', accent: '#c4b5fd', text: '#6d28d9' },
  { nombre: 'Open',         color: '#fef3c7', accent: '#fcd34d', text: '#b45309' },
]

interface MockPartido {
  turno: string
  cancha: number
  label: string
  p1: string
  p2: string
  resultado: string | null
  ganador: 1 | 2 | null
  catIdx: number
}

const PARTIDOS: MockPartido[] = [
  { turno: '09:00', cancha: 1, label: 'P-3',     p1: 'Rosselot / García', p2: 'Müller / Díaz',   resultado: '6-3  6-4', ganador: 1,    catIdx: 0 },
  { turno: '10:30', cancha: 2, label: '🏆 SF-1', p1: 'López / Vega',     p2: 'Torres / Ruiz',   resultado: null,       ganador: null, catIdx: 1 },
  { turno: '11:00', cancha: 3, label: 'P-1',     p1: 'Soto / Bravo',     p2: 'Herrera / Ponce', resultado: null,       ganador: null, catIdx: 2 },
]

function dotColor(p: MockPartido) {
  return p.ganador ? '#16a34a' : p.resultado === null && !p.ganador ? '#e8c547' : '#cbd5e1'
}

function Players({ partido }: { partido: MockPartido }) {
  const sets = partido.resultado?.trim().split(/\s+/) ?? []
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        {partido.p1.split(' / ').map((n, i) => (
          <p key={i} className={`font-inter text-[12px] truncate leading-snug ${
            !partido.ganador ? 'text-[#334155]'
            : partido.ganador === 1 ? 'font-semibold text-[#162844]' : 'text-[#94a3b8]'
          }`}>{n}</p>
        ))}
      </div>
      <div className="shrink-0 flex flex-col items-center gap-0.5">
        {sets.length > 0 ? sets.map((s, i) => (
          <span key={i} className="font-inter text-[10px] font-bold text-white bg-[#162844] px-1.5 py-px rounded whitespace-nowrap">{s}</span>
        )) : (
          <button type="button" className="font-inter text-[10px] font-semibold text-[#e8c547] border border-[#e8c547] rounded px-1.5 py-0.5">Cargar</button>
        )}
      </div>
      <div className="flex-1 min-w-0 text-right">
        {partido.p2.split(' / ').map((n, i) => (
          <p key={i} className={`font-inter text-[12px] truncate leading-snug ${
            !partido.ganador ? 'text-[#334155]'
            : partido.ganador === 2 ? 'font-semibold text-[#162844]' : 'text-[#94a3b8]'
          }`}>{n}</p>
        ))}
      </div>
    </div>
  )
}

// Option A: Left border accent
function CardA({ partido }: { partido: MockPartido }) {
  const cat = CATS[partido.catIdx]
  return (
    <div
      className="bg-white rounded-lg border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden"
      style={{ borderLeft: `4px solid ${cat.accent}` }}
    >
      <div className="px-3 pt-2 pb-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor(partido) }} />
          <span className="font-inter font-bold text-[11px] text-[#162844]">{partido.turno}</span>
          <span className="font-inter text-[10px] text-[#94b0cc]">· C{partido.cancha}</span>
          <span className="font-inter text-[10px] text-[#94b0cc]">· {partido.label}</span>
        </div>
        <Players partido={partido} />
      </div>
    </div>
  )
}

// Option B: Category pill badge
function CardB({ partido }: { partido: MockPartido }) {
  const cat = CATS[partido.catIdx]
  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="px-3 pt-2 pb-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor(partido) }} />
          <span className="font-inter font-bold text-[11px] text-[#162844]">{partido.turno}</span>
          <span className="font-inter text-[10px] text-[#94b0cc]">· C{partido.cancha}</span>
          <span className="font-inter text-[10px] text-[#94b0cc]">· {partido.label}</span>
          <span
            className="ml-auto font-inter text-[10px] font-semibold rounded-full px-2 py-px shrink-0"
            style={{ background: cat.color, color: cat.text }}
          >
            {cat.nombre}
          </span>
        </div>
        <Players partido={partido} />
      </div>
    </div>
  )
}

// Option C: Tinted header
function CardC({ partido }: { partido: MockPartido }) {
  const cat = CATS[partido.catIdx]
  return (
    <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-3 pt-2 pb-1.5" style={{ background: cat.color }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor(partido) }} />
          <span className="font-inter font-bold text-[11px] text-[#162844]">{partido.turno}</span>
          <span className="font-inter text-[10px] text-[#94b0cc]">· C{partido.cancha}</span>
          <span className="font-inter text-[10px] text-[#94b0cc]">· {partido.label}</span>
          <span className="font-inter text-[10px] ml-auto" style={{ color: cat.text }}>{cat.nombre}</span>
        </div>
      </div>
      <div className="px-3 pt-1.5 pb-2.5 border-t border-[#f1f5f9]">
        <Players partido={partido} />
      </div>
    </div>
  )
}

interface SectionProps {
  label: string
  desc: string
  children: React.ReactNode
}

function Section({ label, desc, children }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_1px_6px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
        <p className="font-manrope text-[15px] font-bold text-[#162844]">{label}</p>
        <p className="font-inter text-[12px] text-[#94b0cc] mt-0.5">{desc}</p>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  )
}

export default function ColorCodingMockup() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="font-manrope text-xl font-bold text-[#162844]">Color coding — Opciones</h1>
          <p className="font-inter text-[13px] text-[#94b0cc] mt-1">3 variantes para identificar categorías en las cards</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 p-3.5 bg-white rounded-xl border border-[#e2e8f0]">
          {CATS.map(cat => (
            <div key={cat.nombre} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.accent }} />
              <span className="font-inter text-[12px] text-[#334155]">{cat.nombre}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <Section
            label="A · Borde lateral"
            desc="4px de color en el borde izquierdo. Card 100% blanca, color solo en el filo."
          >
            {PARTIDOS.map((p, i) => <CardA key={i} partido={p} />)}
          </Section>

          <Section
            label="B · Pill de categoría"
            desc="Badge redondeado con fondo pastel al final de la línea de metadata."
          >
            {PARTIDOS.map((p, i) => <CardB key={i} partido={p} />)}
          </Section>

          <Section
            label="C · Cabecera tintada"
            desc="Fondo pastel solo en la sección de metadata. Cuerpo blanco con separador."
          >
            {PARTIDOS.map((p, i) => <CardC key={i} partido={p} />)}
          </Section>
        </div>

        <p className="font-inter text-[11px] text-[#94b0cc] mt-6 text-center">
          Mockup temporal — /mockup/color-coding
        </p>
      </div>
    </div>
  )
}
