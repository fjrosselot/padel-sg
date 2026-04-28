// MOCKUP — App Asados · Dashboard (iteración 1)
import { UtensilsCrossed, BookOpen, History, Plus, ChevronRight, Flame } from 'lucide-react'

const C = {
  bg:     '#FAF8F5',   // crema cálida
  card:   '#FFFFFF',
  ink:    '#1C1A17',   // carbón oscuro
  ember:  '#C4541A',   // brasa
  muted:  '#8B7E74',   // gris cálido
  soft:   '#FFF0E8',   // ember suave
  border: '#EDE8E3',
}

const QUICK = [
  { icon: UtensilsCrossed, label: 'Cortes',   desc: 'Catálogo y precios' },
  { icon: BookOpen,        label: 'Recetas',  desc: 'Acompañamientos' },
  { icon: History,         label: 'Historial',desc: 'Asados anteriores' },
]

function BottomNav({ active }: { active: string }) {
  const items = [
    { icon: Flame,           label: 'Inicio' },
    { icon: UtensilsCrossed, label: 'Cortes' },
    { icon: BookOpen,        label: 'Recetas' },
    { icon: History,         label: 'Historial' },
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex"
      style={{ borderColor: C.border }}>
      {items.map(({ icon: Icon, label }) => {
        const isActive = label === active
        return (
          <button key={label} type="button"
            className="flex-1 flex flex-col items-center gap-1 py-3"
          >
            <Icon className="h-5 w-5" style={{ color: isActive ? C.ember : C.muted }} />
            <span className="font-inter text-[10px] font-medium"
              style={{ color: isActive ? C.ember : C.muted }}>
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 h-0.5 w-8 rounded-full"
                style={{ background: C.ember }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function AsadosDashboardMockup() {
  return (
    <div className="min-h-screen pb-20" style={{ background: C.bg }}>
      <div className="max-w-md mx-auto px-4 pt-8 space-y-5">

        {/* Greeting */}
        <div>
          <h1 className="font-manrope text-2xl font-bold" style={{ color: C.ink }}>
            App de Asados
          </h1>
          <p className="font-inter text-sm mt-0.5" style={{ color: C.muted }}>
            ¿Qué asado vamos a planificar?
          </p>
        </div>

        {/* Hero CTA — Nuevo asado */}
        <button type="button"
          className="w-full rounded-2xl overflow-hidden relative flex items-center px-5 py-5 text-left group"
          style={{ background: C.ink, minHeight: 96 }}>
          {/* Watermark */}
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-manrope font-black text-8xl leading-none select-none pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.06)' }}>
            A
          </span>
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mr-4"
            style={{ background: C.ember }}>
            <Plus className="h-5 w-5 text-white" />
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-manrope text-base font-bold text-white leading-tight">
              Nuevo asado
            </p>
            <p className="font-inter text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Calcular cantidades y presupuesto
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5"
            style={{ color: 'rgba(255,255,255,0.35)' }} />
        </button>

        {/* Quick links */}
        <div>
          <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: C.muted }}>
            Accesos rápidos
          </p>
          <div className="space-y-2">
            {QUICK.map(({ icon: Icon, label, desc }) => (
              <button key={label} type="button"
                className="w-full flex items-center gap-4 rounded-xl px-4 py-3.5 text-left group"
                style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: C.soft }}>
                  <Icon className="h-4 w-4" style={{ color: C.ember }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-sm font-bold" style={{ color: C.ink }}>{label}</p>
                  <p className="font-inter text-xs" style={{ color: C.muted }}>{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: C.border }} />
              </button>
            ))}
          </div>
        </div>

        {/* Último asado */}
        <div>
          <p className="font-inter text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: C.muted }}>
            Último asado
          </p>
          <div className="rounded-xl overflow-hidden"
            style={{ background: C.card, boxShadow: '0 1px 4px rgba(28,26,23,0.07)' }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: C.border }}>
              <div className="flex-1 min-w-0">
                <p className="font-manrope text-sm font-bold" style={{ color: C.ink }}>
                  Asado padres 4°B
                </p>
                <p className="font-inter text-xs" style={{ color: C.muted }}>15 mar 2026 · 23 personas</p>
              </div>
              <span className="font-inter text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: C.soft, color: C.ember }}>
                familiar
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: C.border }}>
              {[
                { label: 'Total', value: '$185.000' },
                { label: 'Por persona', value: '$8.000' },
                { label: 'Recaudado', value: '68%' },
              ].map(({ label, value }) => (
                <div key={label} className="px-3 py-3 text-center">
                  <p className="font-manrope text-sm font-bold" style={{ color: C.ink }}>{value}</p>
                  <p className="font-inter text-[10px] mt-0.5" style={{ color: C.muted }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <BottomNav active="Inicio" />
    </div>
  )
}
