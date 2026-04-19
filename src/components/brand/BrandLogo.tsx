import logo from '@/assets/logo.jpeg'

interface BrandLogoProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function BrandLogo({ variant = 'full', className = '' }: BrandLogoProps) {
  if (variant === 'compact') {
    return (
      <img
        src={logo}
        alt="Pádel SG"
        className={`h-9 w-9 rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logo} alt="Pádel SG" className="h-9 w-9 rounded-full object-cover" />
      <span className="font-manrope text-sm font-bold text-gold">Pádel SG</span>
    </div>
  )
}
