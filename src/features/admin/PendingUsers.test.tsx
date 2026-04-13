import { render, screen } from '@testing-library/react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { PendingUsers } from './PendingUsers'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'j1', nombre: 'María González', email: 'mg@test.com', categoria: 'C', sexo: 'F', gradualidad: 'normal', created_at: '2026-04-12T10:00:00Z' }],
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)

test('shows pending user name', async () => {
  wrap(<PendingUsers />)
  expect(await screen.findByText('María González')).toBeInTheDocument()
})

test('shows approve and reject buttons', async () => {
  wrap(<PendingUsers />)
  expect(await screen.findByRole('button', { name: /aprobar/i })).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: /rechazar/i })).toBeInTheDocument()
})
