import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn().mockReturnValue({ data: null, isLoading: false }),
}))

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/dashboard']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )

test('renders all nav items', () => {
  wrap(<Sidebar />)
  expect(screen.getByLabelText('Dashboard')).toBeInTheDocument()
  expect(screen.getByLabelText('Torneos')).toBeInTheDocument()
  expect(screen.getByLabelText('Calendario')).toBeInTheDocument()
})
