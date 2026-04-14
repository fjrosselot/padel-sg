import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [jugador, setJugador] = useState(null)
  const [cargando, setCargando] = useState(true)

  async function cargarJugador(userId) {
    const { data } = await supabase
      .from('jugadores')
      .select('*')
      .eq('id', userId)
      .single()
    setJugador(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          await cargarJugador(session.user.id)
        } catch {
          setJugador(null)
        }
      }
    }).finally(() => {
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          await cargarJugador(session.user.id)
        } catch {
          setJugador(null)
        }
      } else {
        setJugador(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // Los datos extra van en options.data → el trigger los lee de raw_user_meta_data
  async function signUp({ nombre, email, password, telefono, hijos }) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, telefono, hijos },
      },
    })
    return { error }
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  async function recargarJugador() {
    if (user) await cargarJugador(user.id)
  }

  const value = {
    user,
    jugador,
    cargando,
    isAdmin: jugador?.es_admin ?? false,
    isActive: jugador?.estado_cuenta === 'activo',
    isPending: jugador?.estado_cuenta === 'pendiente',
    signIn,
    signOut,
    signUp,
    resetPassword,
    recargarJugador,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
