import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { RegisterForm } from './RegisterForm'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    schema: () => ({
      from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }),
    }),
  },
}))

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )

test('shows step 1 fields initially', () => {
  wrap(<RegisterForm />)
  expect(screen.getByLabelText(/^nombre/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/^apellido/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
})

test('shows validation error when name is empty', async () => {
  wrap(<RegisterForm />)
  await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
  expect(await screen.findByText(/ingresa tu nombre/i)).toBeInTheDocument()
})
