import { afterEach, describe, expect, test, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useCategories } from '@/features/marketplace/hooks/useCategories'
import { getCategoryTree } from '@/services/categories/categoryService'

vi.mock('@/services/categories/categoryService', () => ({ getCategoryTree: vi.fn() }))

const clients = []

function renderCategoriesHook() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)

  function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  return renderHook(() => useCategories(), { wrapper: Wrapper })
}

afterEach(() => {
  vi.resetAllMocks()
  for (const client of clients.splice(0)) client.clear()
})

describe('useCategories', () => {
  test('passes cancellation to the service and exposes the returned tree', async () => {
    const categories = [
      { id: 'a8098c1a-f86e-11da-bd1a-00112444be1e', name: 'Test category', children: [] },
    ]
    vi.mocked(getCategoryTree).mockResolvedValue(categories)
    const { result } = renderCategoriesHook()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBe(categories)
    expect(getCategoryTree).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) })
  })

  test('exposes an empty tree as successful data', async () => {
    vi.mocked(getCategoryTree).mockResolvedValue([])
    const { result } = renderCategoriesHook()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  test('exposes failures and allows retrying without replacing the service', async () => {
    const error = Object.assign(new Error('Unavailable'), { status: 503 })
    vi.mocked(getCategoryTree).mockRejectedValueOnce(error).mockResolvedValueOnce([])
    const { result } = renderCategoriesHook()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(error)

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
