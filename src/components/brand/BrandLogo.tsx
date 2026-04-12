interface BrandLogoProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function BrandLogo({ variant = 'full', className = '' }: BrandLogoProps) {
  if (variant === 'compact') {
    return (
      <div
        role="img"
        aria-label="Pádel SG"
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-gold font-manrope text-xs font-black text-navy ${className}`}
      >
        P·SG
      </div>
    )
  }
  return (
    <div
      role="img"
      aria-label="Pádel SG"
      className={`flex items-center gap-2 ${className}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-manrope text-xs font-black text-navy">
        P·SG
      </div>
      <span className="font-manrope text-sm font-bold text-gold">Pádel SG</span>
    </div>
  )
}
