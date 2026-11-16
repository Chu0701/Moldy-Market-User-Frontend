import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { productKeys } from './useProductSearch'
import { getProductById } from '@/services/products/productService'

export function canEditPersonalProduct(product, profile) {
  return Boolean(
    profile?.id &&
    product?.sellerId === profile.id &&
    product.storeId === null &&
    ['ACTIVE', 'HIDDEN'].includes(product.status) &&
    profile.permissions?.includes('PRODUCT_MANAGE_OWN'),
  )
}

export function useProductDetail({ refetchOnMount } = {}) {
  const { productId } = useParams()

  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: ({ signal }) =>
      getProductById({
        productId,
        signal,
      }),
    enabled: Boolean(productId),
    refetchOnMount,
  })
}
