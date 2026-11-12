import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test, vi } from 'vitest'

import { searchProducts } from '@/services/products/productService'
import { useProductSearch } from './useProductSearch'

vi.mock('@/services/products/productService', () => ({ searchProducts: vi.fn() }))

test('retains results between pages in one store and isolates a different store', async () => {
  const firstPage = { page: 1, items: [{ id: 'first-product' }] }
  const secondPage = Promise.withResolvers()
  const differentStore = Promise.withResolvers()
  vi.mocked(searchProducts)
    .mockResolvedValueOnce(firstPage)
    .mockReturnValueOnce(secondPage.promise)
    .mockReturnValueOnce(differentStore.promise)

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={['/stores/first-store?q=ao&size=1']}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MemoryRouter>
    )
  }
  const { result, rerender } = renderHook(({ storeId }) => useProductSearch({ storeId }), {
    wrapper: Wrapper,
    initialProps: { storeId: 'first-store' },
  })

  await waitFor(() => expect(result.current.query.data).toEqual(firstPage))
  expect(searchProducts).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ storeId: 'first-store', q: 'ao', page: 1, size: 1 }),
  )

  act(() => result.current.changePage(2))

  await waitFor(() =>
    expect(searchProducts).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ storeId: 'first-store', page: 2 }),
    ),
  )
  expect(result.current.query.isPlaceholderData).toBe(true)
  expect(result.current.query.data).toEqual(firstPage)

  secondPage.resolve({ page: 2, items: [{ id: 'second-product' }] })
  await waitFor(() => expect(result.current.query.data?.page).toBe(2))

  rerender({ storeId: 'different-store' })

  await waitFor(() =>
    expect(searchProducts).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ storeId: 'different-store', page: 2 }),
    ),
  )
  expect(result.current.query.isPending).toBe(true)
  expect(result.current.query.data).toBeUndefined()

  differentStore.resolve({ page: 2, items: [] })
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
})
