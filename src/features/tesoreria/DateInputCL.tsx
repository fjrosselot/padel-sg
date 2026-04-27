import { useState, useEffect } from 'react'

interface Props {
  value: string       // YYYY-MM-DD
  onChange: (v: string) => void
  className?: string
}

function toDisplay(iso: string) {
  if (!iso || iso.length < 10) return ''
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

function toISO(display: string) {
  const [d, m, y] = display.split('/')
  return `${y}-${m}-${d}`
}

export function DateInputCL({ value, onChange, className }: Props) {
  const [display, setDisplay] = useState(toDisplay(value))

  useEffect(() => { setDisplay(toDisplay(value)) }, [value])

  function handleChange(raw: string) {
    let digits = raw.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    else if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    setDisplay(formatted)
    if (digits.length === 8) {
      const iso = toISO(formatted)
      if (!isNaN(Date.parse(iso))) onChange(iso)
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      value={display}
      onChange={e => handleChange(e.target.value)}
      className={className}
    />
  )
}
