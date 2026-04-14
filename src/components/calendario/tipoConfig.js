export const TIPO_CONFIG = {
  torneo_interno:  { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700',    label: 'Torneo interno'  },
  torneo_externo:  { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', label: 'Torneo externo'  },
  amistoso:        { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700',   label: 'Amistoso'        },
  entrenamiento:   { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', label: 'Entrenamiento'   },
  clase:           { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', label: 'Clase'           },
  social:          { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       label: 'Social'          },
  otro:            { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600',     label: 'Otro'            },
}

export const TIPOS = Object.entries(TIPO_CONFIG).map(([key, val]) => ({ key, ...val }))

export function formatFechaUI(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatHora(time) {
  if (!time) return ''
  return time.slice(0, 5)  // HH:MM
}
