import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { usePaymentDeadline } from './usePaymentDeadline'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-20T03:00:00Z'))
})
afterEach(() => vi.useRealTimers())
test('updates the clock hint and stops ticking at zero without changing any server state', () => {
  const { result, unmount } = renderHook(() => usePaymentDeadline('2026-11-20T03:00:02Z', true))
  expect(result.current).toBe(2)
  act(() => vi.advanceTimersByTime(2000))
  expect(result.current).toBe(0)
  expect(vi.getTimerCount()).toBe(0)
  unmount()
})
test('does not schedule a clock for COD or an invalid deadline', () => {
  const { unmount } = renderHook(() => usePaymentDeadline(null, false))
  expect(vi.getTimerCount()).toBe(0)
  unmount()
  const invalid = renderHook(() => usePaymentDeadline('invalid', true))
  expect(invalid.result.current).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
  invalid.unmount()
})
test('cleans up its interval when leaving the payment page', () => {
  const { unmount } = renderHook(() => usePaymentDeadline('2026-11-20T03:01:00Z', true))
  expect(vi.getTimerCount()).toBe(1)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
