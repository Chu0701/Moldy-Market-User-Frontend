import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useCheckout, CHECKOUT_POLL_MS } from './useCheckout'
import { getCheckout, createCheckout } from '@/services/checkout/checkoutService'
import { getMe } from '@/services/users/userService'
import { setAccessToken, clearAccessToken } from '@/lib/tokenStorage'

vi.mock('@/services/checkout/checkoutService', () => ({
  getCheckout: vi.fn(),
  createCheckout: vi.fn(),
}))
vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))
const profile = { id: 'hook-buyer' }
const pending = {
  id: 'checkout-1',
  status: 'PENDING_PAYMENT',
  paymentResponse: { method: 'ONLINE_BANKING', paymentStatus: 'PENDING' },
  orders: [],
}
const paid = {
  ...pending,
  status: 'PAID',
  paymentResponse: { ...pending.paymentResponse, paymentStatus: 'SUCCESSFUL' },
}
let client
beforeEach(() => {
  vi.useFakeTimers()
  setAccessToken('hook-token')
  vi.mocked(getMe).mockReset().mockResolvedValue(profile)
  vi.mocked(getCheckout).mockReset().mockResolvedValue(pending)
  vi.mocked(createCheckout).mockReset()
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  client.setQueryData(['users', 'me'], profile)
  client.setQueryData(['cart', profile.id], { items: ['kept'] })
})
afterEach(() => {
  clearAccessToken()
  client.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})
function wrapper({ children }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
const tick = async (ms) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

test('polls pending online checkout then stops and invalidates only its buyer purchase data', async () => {
  vi.mocked(getCheckout).mockResolvedValueOnce(pending).mockResolvedValue(paid)
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const { result, unmount } = renderHook(() => useCheckout('checkout-1'), { wrapper })
  await tick(1)
  expect(result.current.data.status).toBe('PENDING_PAYMENT')
  await tick(CHECKOUT_POLL_MS)
  expect(result.current.data.status).toBe('PAID')
  await tick(20000)
  expect(getCheckout).toHaveBeenCalledTimes(2)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart', profile.id], exact: true })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders', 'mine', profile.id], exact: true })
  expect(client.getQueryData(['cart', profile.id]).items).toEqual(['kept'])
  unmount()
})
test('COD uses manual refresh instead of polling indefinitely', async () => {
  vi.mocked(getCheckout).mockResolvedValue({
    ...pending,
    status: 'PAY_ON_DELIVERY',
    paymentResponse: { method: 'COD', paymentStatus: 'PENDING' },
  })
  const { result, unmount } = renderHook(() => useCheckout('checkout-1'), { wrapper })
  await tick(1)
  await tick(30000)
  expect(getCheckout).toHaveBeenCalledTimes(1)
  await act(async () => {
    await result.current.refetch()
  })
  expect(getCheckout).toHaveBeenCalledTimes(2)
  unmount()
})
test('a GET error stops automatic polling until a manual successful refresh', async () => {
  vi.mocked(getCheckout)
    .mockResolvedValueOnce(pending)
    .mockRejectedValueOnce({ status: 500 })
    .mockResolvedValue(paid)
  const { result, unmount } = renderHook(() => useCheckout('checkout-1'), { wrapper })
  await tick(1)
  await tick(CHECKOUT_POLL_MS)
  expect(result.current.isRefetchError).toBe(true)
  await tick(20000)
  expect(getCheckout).toHaveBeenCalledTimes(2)
  await act(async () => {
    await result.current.refetch()
  })
  await tick(1)
  expect(result.current.data.status).toBe('PAID')
  unmount()
})
test('a response arriving after logout cannot restore a cleared account cache', async () => {
  let finish
  vi.mocked(getCheckout).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const { unmount } = renderHook(() => useCheckout('checkout-1'), { wrapper })
  await tick(1)
  act(() => {
    clearAccessToken()
    client.clear()
  })
  await act(async () => {
    finish(paid)
  })
  await tick(1)
  expect(client.getQueryData(['checkout', profile.id, 'checkout-1'])).toBeUndefined()
  expect(client.getQueryData(['cart', profile.id])).toBeUndefined()
  unmount()
})
