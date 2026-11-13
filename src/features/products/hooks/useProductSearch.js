import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'

import { readProductSearchParams } from './productSearchParams'
import { searchProducts } from '@/services/products/productService'

export const productKeys = {
  search: (params) => ['products', 'search', params],
  detail: (productId) => ['products', 'detail', productId],
}

/** @param {{ storeId?: string, categoryId?: string }} [options] */
export function useProductSearch({ storeId, categoryId } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = {
    ...readProductSearchParams(searchParams),
    ...(storeId ? { storeId } : {}),
    ...(categoryId ? { categoryId } : {}),
  }

  const query = useQuery({
    queryKey: productKeys.search(params),
    queryFn: ({ signal }) =>
      searchProducts({
        ...params,
        signal,
      }),
    placeholderData: (previousData, previousQuery) => {
      const previousParams = previousQuery?.queryKey[2]
      return previousParams?.storeId === storeId && previousParams?.categoryId === categoryId
        ? previousData
        : undefined
    },
  })

  function changePage(page) {
    if (!Number.isSafeInteger(page) || page < 1 || query.isFetching) {
      return
    }

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('page', String(page))
      return next
    })
  }

  return {
    params,
    query,
    changePage,
  }
}
