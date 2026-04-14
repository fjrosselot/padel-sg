import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TemporadaContext = createContext(null)

export function TemporadaProvider({ children }) {
  const [temporadas, setTemporadas] = useState([])
  const [temporadaActiva, setTemporadaActiva] = useState(null)
  // La que el usuario está viendo (puede diferir de la activa)
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)

  async function cargar() {
    const { data } = await supabase
      .from('temporadas')
      .select('*')
      .eq('deporte_id', 'padel')
      .order('anio', { ascending: false })
      .order('fecha_inicio', { ascending: false })

    const lista = data ?? []
    const activa = lista.find(t => t.activa) ?? null

    setTemporadas(lista)
    setTemporadaActiva(activa)
    setTemporadaSeleccionada(prev => {
      // Si ya hay una seleccionada y sigue existiendo, mantenerla
      if (prev && lista.find(t => t.id === prev.id)) return lista.find(t => t.id === prev.id)
      return activa
    })
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const value = {
    temporadas,
    temporadaActiva,
    temporadaSeleccionada,
    setTemporadaSeleccionada,
    cargando,
    recargar: cargar,
  }

  return <TemporadaContext.Provider value={value}>{children}</TemporadaContext.Provider>
}

export function useTemporada() {
  const ctx = useContext(TemporadaContext)
  if (!ctx) throw new Error('useTemporada debe usarse dentro de TemporadaProvider')
  return ctx
}
