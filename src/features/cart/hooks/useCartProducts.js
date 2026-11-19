import { useQueries } from '@tanstack/react-query'

import { productKeys } from '@/features/products/hooks/useProductSearch'
import { getProductById } from '@/services/products/productService'

export function useCartProducts(items) {
  return useQueries({
    queries: items.map((item) => ({
      queryKey: productKeys.detail(item.listingId),
      queryFn: ({ signal }) => getProductById({ productId: item.listingId, signal }),
      retry: false,
    })),
  })
}
