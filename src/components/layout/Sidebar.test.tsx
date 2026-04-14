import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const wrap = (ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={['/dashboard']}>{ui}</MemoryRouter>)

test('renders all nav items', () => {
  wrap(<Sidebar />)
  expect(screen.getByLabelText('Dashboard')).toBeInTheDocument()
  expect(screen.getByLabelText('Torneos')).toBeInTheDocument()
  expect(screen.getByLabelText('Calendario')).toBeInTheDocument()
})
