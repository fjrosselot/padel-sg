import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { LoginForm } from './LoginForm'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      }),
    },
  },
}))

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )

test('shows email and password fields', () => {
  wrap(<LoginForm />)
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
})

test('shows error on failed login', async () => {
  wrap(<LoginForm />)
  await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrongpass')
  await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
})
