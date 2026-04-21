import { render, screen } from '@testing-library/react'
import { BrandLogo } from './BrandLogo'

test('renders logo with accessible label', () => {
  render(<BrandLogo />)
  expect(screen.getByRole('img', { name: /pádel sg/i })).toBeInTheDocument()
})

test('renders compact variant without text label', () => {
  render(<BrandLogo variant="compact" />)
  expect(screen.getByRole('img', { name: /pádel sg/i })).toBeInTheDocument()
  expect(screen.queryByText('Pádel SG')).not.toBeInTheDocument()
})
