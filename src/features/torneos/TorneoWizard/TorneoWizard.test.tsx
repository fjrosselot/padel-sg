import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TorneoWizard from './index'

vi.mock('../../../lib/supabase', () => ({
  supabase: { schema: () => ({ from: () => ({ insert: () => Promise.resolve({ error: null }) }) }) }
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('TorneoWizard', () => {
  it('renders step 1 progress bar with "Tipo" active', () => {
    render(<TorneoWizard onClose={() => {}} />, { wrapper })
    expect(screen.getByText('Tipo')).toBeDefined()
  })
  it('renders cancel button', () => {
    render(<TorneoWizard onClose={() => {}} />, { wrapper })
    expect(screen.getByText('Cancelar')).toBeDefined()
  })
  it('renders next button on step 1', () => {
    render(<TorneoWizard onClose={() => {}} />, { wrapper })
    expect(screen.getByText('Siguiente')).toBeDefined()
  })
})
