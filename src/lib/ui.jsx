// Utilidades de UI compartidas — sistema de diseño St. George

const AVATAR_COLORS = [
  '#3B82F6','#8B5CF6','#10B981','#F59E0B',
  '#EF4444','#EC4899','#14B8A6','#6366F1','#F97316','#06B6D4',
]

export function avatarColor(str) {
  const sum = (str || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export function getInitials(nombre) {
  return (nombre || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
}

export function Avatar({ nombre, size = 'md' }) {
  const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: avatarColor(nombre) }}
    >
      {getInitials(nombre)}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function PageTitle({ children }) {
  return (
    <h1 className="text-2xl font-black text-[#1B2A4A] uppercase tracking-tight leading-tight">
      {children}
    </h1>
  )
}

export function SectionLabel({ children }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

export function Pills({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition
            ${value === key
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
