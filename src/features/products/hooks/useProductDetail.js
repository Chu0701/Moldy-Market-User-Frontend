import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { productKeys } from './useProductSearch'
import { getProductById } from '@/services/products/productService'

export function useProductDetail() {
  const { productId } = useParams()

  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: ({ signal }) =>
      getProductById({
        productId,
        signal,
      }),
    enabled: Boolean(productId),
  })
}
