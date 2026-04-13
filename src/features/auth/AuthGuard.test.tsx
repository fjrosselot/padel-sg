import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { AuthGuard } from './AuthGuard'

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}))

import { useUser } from '@/hooks/useUser'

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/dashboard" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

test('redirects to /login when not authenticated', () => {
  vi.mocked(useUser).mockReturnValue({ data: null, isLoading: false } as any)
  wrap(<AuthGuard><div>Protected</div></AuthGuard>)
  expect(screen.getByText('Login page')).toBeInTheDocument()
})

test('renders children when authenticated and active', () => {
  vi.mocked(useUser).mockReturnValue({
    data: { estado_cuenta: 'activo' },
    isLoading: false,
  } as any)
  wrap(<AuthGuard><div>Protected</div></AuthGuard>)
  expect(screen.getByText('Protected')).toBeInTheDocument()
})
