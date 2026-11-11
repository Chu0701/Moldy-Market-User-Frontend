import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'

import { readProductSearchParams } from './productSearchParams'
import { searchProducts } from '@/services/products/productService'

export const productKeys = {
  search: (params) => ['products', 'search', params],
}

export function useProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = readProductSearchParams(searchParams)

  const query = useQuery({
    queryKey: productKeys.search(params),
    queryFn: ({ signal }) =>
      searchProducts({
        ...params,
        signal,
      }),
    placeholderData: keepPreviousData,
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
