import { BrandLogo } from '@/components/brand/BrandLogo'

export function PendingApproval() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-card">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>
        <div className="mb-4 text-4xl">🎾</div>
        <h1 className="mb-2 font-manrope text-xl font-bold text-navy">¡Solicitud recibida!</h1>
        <p className="mb-6 font-inter text-sm text-slate">
          Tu solicitud de acceso está siendo revisada. Recibirás un email cuando tu cuenta sea aprobada por el administrador.
        </p>
        <div className="rounded-md border-l-2 border-gold bg-warning-bg p-3 font-inter text-xs text-slate">
          Si tienes preguntas, contacta al administrador de la rama.
        </div>
        <a href="/login" className="mt-4 block font-inter text-xs text-muted underline">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
