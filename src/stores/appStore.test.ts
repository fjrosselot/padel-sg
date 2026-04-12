import { renderHook, act } from '@testing-library/react'
import { useAppStore } from './appStore'

test('setTemporadaId updates store', () => {
  const { result } = renderHook(() => useAppStore())
  act(() => result.current.setTemporadaId('season-123'))
  expect(result.current.temporadaId).toBe('season-123')
})
