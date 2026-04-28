import { useEffect } from 'react'
import { Trophy, BarChart2, DollarSign, Layers, ChevronRight, ExternalLink, Flame } from 'lucide-react'

const N = '#162844'
const G = '#e8c547'
const S = '#94b0cc'
const SRF = '#F0F4F8'

const PROJECTS = [
  {
    id: 'padel-sg',
    label: 'Padel SG',
    description: 'Plataforma de pádel Saint George\'s College',
    icon: Trophy,
    color: N,
    mockups: [
      { label: 'Landings (Torneos · Amistosos · Ranking · Jugadores)', path: '/mockup/padel-sg/landings' },
      { label: 'Dashboard', path: '/mockup/padel-sg/dashboard' },
      { label: 'Calendario', path: '/mockup/padel-sg/calendario' },
      { label: 'Torneo detalle', path: '/mockup/padel-sg/torneo-detalle' },
      { label: 'Jugador detalle (3 tabs)', path: '/mockup/padel-sg/jugador-detalle' },
      { label: 'Parejas', path: '/mockup/padel-sg/parejas' },
      { label: 'Color coding', path: '/mockup/padel-sg/color-coding' },
    ],
  },
  {
    id: 'app-asados',
    label: 'App de Asados',
    description: 'Planificador de asados — cantidades, presupuesto y cobros',
    icon: Flame,
    color: '#C4541A',
    mockups: [
      { label: 'Dashboard', path: '/mockup/app-asados/dashboard' },
      { label: 'Catálogo de cortes', path: '/mockup/app-asados/cortes' },
      { label: 'Wizard — Configuración del evento', path: '/mockup/app-asados/wizard-config' },
      { label: 'Wizard — Selección de menú', path: '/mockup/app-asados/wizard-menu' },
      { label: 'Lista de compras', path: '/mockup/app-asados/lista-compras' },
      { label: 'Receta detalle', path: '/mockup/app-asados/receta-detalle' },
      { label: 'Panel de cobros', path: '/mockup/app-asados/cobros' },
      { label: 'Historial de asados', path: '/mockup/app-asados/historial' },
    ],
  },
  {
    id: 'finanzas',
    label: 'Finanzas Familiares',
    description: 'Control financiero multi-banco',
    icon: DollarSign,
    color: '#0e7a5a',
    mockups: [],
  },
  {
    id: 'comparador',
    label: 'Comparador de Precios',
    description: 'Precios importación Chile',
    icon: BarChart2,
    color: '#7c3aed',
    mockups: [],
  },
]

export default function MockupsIndex() {
  useEffect(() => { document.title = 'Mockups Hub — Backbone IA' }, [])
  return (
    <div className="min-h-screen" style={{ background: SRF }}>
      {/* Header */}
      <div className="bg-white border-b border-[#F0F4F8] shadow-[0_2px_8px_rgba(13,27,42,0.05)]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: N }}>
              <Layers className="h-5 w-5" style={{ color: G }} />
            </div>
            <div>
              <h1 className="font-manrope text-xl font-bold" style={{ color: N }}>
                Mockups Hub
              </h1>
              <p className="font-inter text-xs" style={{ color: S }}>Backbone IA — iteración de diseño</p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {PROJECTS.map(proj => {
          const Icon = proj.icon
          const hasMockups = proj.mockups.length > 0
          return (
            <div key={proj.id} className="rounded-2xl bg-white shadow-[0_4px_16px_rgba(13,27,42,0.07)] overflow-hidden">
              {/* Project header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F0F4F8]">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: proj.color }}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-[15px] font-bold" style={{ color: N }}>{proj.label}</p>
                  <p className="font-inter text-[11px] mt-0.5" style={{ color: S }}>{proj.description}</p>
                </div>
                {!hasMockups && (
                  <span className="font-inter text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F0F4F8]"
                    style={{ color: S }}>Sin mockups aún</span>
                )}
              </div>

              {/* Mockup links */}
              {hasMockups && (
                <div className="divide-y divide-[#F0F4F8]">
                  {proj.mockups.map(m => (
                    <a key={m.path} href={m.path}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFBFC] transition-colors group">
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: S }} />
                      <span className="flex-1 font-inter text-[13px] font-medium"
                        style={{ color: N }}>{m.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: S }} />
                    </a>
                  ))}
                </div>
              )}

              {!hasMockups && (
                <div className="px-5 py-6 text-center">
                  <p className="font-inter text-xs" style={{ color: S }}>
                    Los mockups de este proyecto aparecerán aquí cuando se agreguen.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
