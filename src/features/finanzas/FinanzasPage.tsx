import { Wallet, Clock } from 'lucide-react'

export default function FinanzasPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-gold" />
        <h1 className="font-manrope text-2xl font-bold text-navy">Finanzas</h1>
      </div>

      <div className="rounded-xl bg-white shadow-card p-8 flex flex-col items-center text-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
          <Clock className="h-7 w-7 text-gold" />
        </div>
        <div>
          <p className="font-manrope text-base font-bold text-navy">Próximamente</p>
          <p className="font-inter text-sm text-muted mt-1 max-w-xs">
            Aquí podrás ver el seguimiento de cuotas, pagos de torneos y estado financiero de la rama.
          </p>
        </div>

        <div className="w-full border-t border-surface-high pt-4 space-y-2">
          {[
            'Cuotas de membresía',
            'Pagos de torneos e inscripciones',
            'Historial de transacciones',
            'Estado de cuenta por jugador',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-left">
              <div className="h-1.5 w-1.5 rounded-full bg-gold/40 shrink-0" />
              <p className="font-inter text-xs text-muted">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
