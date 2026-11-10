import { useQuery } from '@tanstack/react-query'

import { searchProducts } from '@/services/products/productService'

export const productKeys = {
  search: (params) => ['products', 'search', params],
}

export function useNewestProducts() {
  const params = {
    page: 1,
    size: 8,
    sort: 'newest',
  }

  return useQuery({
    queryKey: productKeys.search(params),
    queryFn: ({ signal }) =>
      searchProducts({
        ...params,
        signal,
      }),
  })
}
