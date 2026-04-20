import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RankingPage from './RankingPage'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: (table: string) => ({
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: table === 'temporadas' ? [{ id: 'temp-1' }] : [], error: null }),
          }),
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RankingPage', () => {
  it('renders the Ranking header', async () => {
    render(<RankingPage />, { wrapper })
    expect(await screen.findByText(/ranking/i)).toBeTruthy()
  })

  it('shows empty state when no data', async () => {
    render(<RankingPage />, { wrapper })
    expect(await screen.findByText(/Sin puntos de ranking/i)).toBeTruthy()
  })

  it('shows Todas pill active by default', async () => {
    render(<RankingPage />, { wrapper })
    const pill = await screen.findByRole('button', { name: 'Todas' })
    expect(pill.className).toContain('bg-navy')
  })
})
