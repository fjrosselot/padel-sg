interface Props {
  title: string
  icon: React.ReactNode
}

export function ComingSoon({ title, icon }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-mid text-muted">
        {icon}
      </div>
      <h1 className="mb-2 font-manrope text-2xl font-bold text-white">{title}</h1>
      <p className="font-inter text-sm text-muted">Esta sección está en construcción.</p>
    </div>
  )
}
