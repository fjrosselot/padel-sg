const LABEL: Record<string, string> = { drive: 'Drive', reves: 'Revés', ambos: 'Ambos' }
const STYLE: Record<string, string> = {
  drive: 'bg-emerald-50 text-emerald-700',
  reves: 'bg-orange-50 text-orange-700',
  ambos: 'bg-sky-50 text-sky-700',
}

export function LadoBadge({ lado }: { lado: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-lg font-inter text-xs font-semibold ${STYLE[lado] ?? 'bg-slate-100 text-slate-600'}`}>
      {LABEL[lado] ?? lado}
    </span>
  )
}
