import { afterEach, describe, expect, test, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useNewestProducts } from '@/features/marketplace/hooks/useNewestProducts'
import { searchProducts } from '@/services/products/productService'

vi.mock('@/services/products/productService', () => ({ searchProducts: vi.fn() }))

const clients = []

function renderNewestHook() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)

  function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  return renderHook(() => useNewestProducts(), { wrapper: Wrapper })
}

afterEach(() => {
  vi.resetAllMocks()
  for (const client of clients.splice(0)) client.clear()
})

describe('useNewestProducts', () => {
  test('requests the first eight newest products and passes cancellation', async () => {
    const resultPage = {
      items: [{ id: 'a8098c1a-f86e-11da-bd1a-00112444be1e', title: 'Test product' }],
      page: 1,
      size: 8,
      totalElements: 1,
      totalPages: 1,
      totalCapped: false,
      facets: null,
    }
    vi.mocked(searchProducts).mockResolvedValue(resultPage)
    const { result } = renderNewestHook()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(resultPage)
    expect(searchProducts).toHaveBeenCalledWith({
      page: 1,
      size: 8,
      sort: 'newest',
      signal: expect.any(AbortSignal),
    })
  })

  test('keeps an empty product list as successful data', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ items: [], page: 1, totalPages: 0 })
    const { result } = renderNewestHook()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.items).toEqual([])
  })

  test('exposes a failed request so the section can render an error', async () => {
    const error = Object.assign(new Error('Unavailable'), { status: 503 })
    vi.mocked(searchProducts).mockRejectedValue(error)
    const { result } = renderNewestHook()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)
  })
})
