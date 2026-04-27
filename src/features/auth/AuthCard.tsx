import logo from '@/assets/logo.jpeg'

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full shadow-card-hover" style={{ background: '#FFD91C' }}>
            <img src={logo} alt="Pádel SG" className="h-full w-full object-cover" />
          </div>
          <div className="text-center leading-none">
            <p className="font-manrope text-lg font-black tracking-tight text-navy" style={{ letterSpacing: '-0.02em' }}>
              Padel<span className="text-gold">SG</span>
            </p>
            <p className="mt-1 font-inter text-[9px] font-bold uppercase tracking-[0.28em] text-muted">
              Saint George's
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-card px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export const inputCls = 'w-full rounded-lg border border-navy/15 bg-surface px-4 py-3 font-inter text-sm text-navy placeholder-muted transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30'
export const labelCls = 'mb-1.5 block font-inter text-[10px] font-semibold uppercase tracking-wider text-muted'
