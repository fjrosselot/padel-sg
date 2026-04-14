// Categorías reales de pádel federado
// Hombres: 6a (iniciación) → 1a (élite)
// Mujeres:  D (iniciación) → A  (élite)

const NIVELES_HOMBRE = [
  { key: '6a', bg: 'bg-gray-100',   text: 'text-gray-600'   },
  { key: '5a', bg: 'bg-sky-100',    text: 'text-sky-700'    },
  { key: '4a', bg: 'bg-green-100',  text: 'text-green-700'  },
  { key: '3a', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { key: '2a', bg: 'bg-orange-100', text: 'text-orange-700' },
  { key: '1a', bg: 'bg-red-100',    text: 'text-red-700'    },
]
const NIVELES_MUJER = [
  { key: 'D', bg: 'bg-gray-100',   text: 'text-gray-600'   },
  { key: 'C', bg: 'bg-sky-100',    text: 'text-sky-700'    },
  { key: 'B', bg: 'bg-green-100',  text: 'text-green-700'  },
  { key: 'A', bg: 'bg-orange-100', text: 'text-orange-700' },
]

const ALL = [...NIVELES_HOMBRE, ...NIVELES_MUJER]

export default function NivelDots({ nivel, size = 'md' }) {
  if (!nivel) return <span className="text-xs text-gray-400">Sin definir</span>

  const config = ALL.find(n => n.key === nivel)
  if (!config) return <span className="text-xs text-gray-400">{nivel}</span>

  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${padding} ${config.bg} ${config.text}`}>
      {nivel}
    </span>
  )
}

// Exportar las listas para usar en selectores
export { NIVELES_HOMBRE, NIVELES_MUJER }
