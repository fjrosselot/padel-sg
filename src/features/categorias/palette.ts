export const PALETTE = [
  { nombre: 'Índigo',    fondo: '#e0e7ff', borde: '#a5b4fc', texto: '#3730a3' },
  { nombre: 'Cielo',     fondo: '#e0f2fe', borde: '#7dd3fc', texto: '#0369a1' },
  { nombre: 'Esmeralda', fondo: '#d1fae5', borde: '#6ee7b7', texto: '#065f46' },
  { nombre: 'Verde',     fondo: '#f0fdf4', borde: '#86efac', texto: '#15803d' },
  { nombre: 'Rosa',      fondo: '#ffe4e6', borde: '#fda4af', texto: '#be123c' },
  { nombre: 'Ámbar',     fondo: '#fef3c7', borde: '#fcd34d', texto: '#92400e' },
  { nombre: 'Violeta',   fondo: '#f3e8ff', borde: '#d8b4fe', texto: '#7e22ce' },
  { nombre: 'Turquesa',  fondo: '#ccfbf1', borde: '#5eead4', texto: '#0f766e' },
  { nombre: 'Naranja',   fondo: '#ffedd5', borde: '#fdba74', texto: '#c2410c' },
  { nombre: 'Lima',      fondo: '#ecfccb', borde: '#bef264', texto: '#4d7c0f' },
  { nombre: 'Fucsia',    fondo: '#fce7f3', borde: '#f9a8d4', texto: '#be185d' },
  { nombre: 'Cyan',      fondo: '#cffafe', borde: '#67e8f9', texto: '#0e7490' },
  { nombre: 'Lavanda',   fondo: '#ede9fe', borde: '#c4b5fd', texto: '#6d28d9' },
  { nombre: 'Amarillo',  fondo: '#fefce8', borde: '#fef08a', texto: '#854d0e' },
  { nombre: 'Rojo',      fondo: '#fee2e2', borde: '#fca5a5', texto: '#b91c1c' },
  { nombre: 'Pizarra',   fondo: '#f1f5f9', borde: '#94a3b8', texto: '#334155' },
] as const

export type PaletteEntry = typeof PALETTE[number]
