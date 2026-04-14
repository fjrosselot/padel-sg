import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  temporadaId: string | null
  setTemporadaId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      temporadaId: null,
      setTemporadaId: (id) => set({ temporadaId: id }),
    }),
    { name: 'padel-sg-app' },
  ),
)
