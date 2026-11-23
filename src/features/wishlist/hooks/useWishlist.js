import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { wishlistKeys } from '@/features/wishlist/wishlistKeys'
import { getProductById } from '@/services/products/productService'
import {
  addToWishlist,
  checkWishlisted,
  getProductWishlistCount,
  getWishlist,
  removeFromWishlist,
} from '@/services/wishlist/wishlistService'

/**
 * Loads the current user's paginated wishlist and hydrates product summaries.
 * @param {{ page?: number, size?: number }} [options]
 */
export function useWishlistPage({ page = 1, size = 20 } = {}) {
  const queryClient = useQueryClient()
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  const listQuery = useQuery({
    queryKey: wishlistKeys.list(userId, page, size),
    queryFn: ({ signal }) => getWishlist({ page, size, signal }),
    enabled: Boolean(userId),
  })

  const items = listQuery.data?.items ?? []
  const productQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ['products', 'detail', item.productId],
      queryFn: ({ signal }) => getProductById({ productId: item.productId, signal }),
      enabled: Boolean(item.productId),
      retry: false,
    })),
  })

  const removeMutation = useMutation({
    mutationFn: ({ productId }) => removeFromWishlist({ productId }),
    retry: false,
    onSuccess: (_data, variables) => {
      if (!userId) return
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all(userId) })
      void queryClient.invalidateQueries({
        queryKey: wishlistKeys.productCount(variables.productId),
      })
    },
  })

  return {
    userId,
    profileQuery,
    listQuery,
    items,
    productQueries,
    removeMutation,
  }
}

/**
 * Manages wishlist status and toggle action for a single product.
 * Only queries Backend when authenticated (SecurityConfig requires auth).
 * @param {string | undefined} productId
 */
export function useWishlistToggle(productId) {
  const queryClient = useQueryClient()
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const canQuery = Boolean(userId && productId)

  const checkQuery = useQuery({
    queryKey: wishlistKeys.check(userId, productId),
    queryFn: ({ signal }) => checkWishlisted({ productId, signal }),
    enabled: canQuery,
    retry: false,
  })

  const countQuery = useQuery({
    queryKey: wishlistKeys.productCount(productId),
    queryFn: ({ signal }) => getProductWishlistCount({ productId, signal }),
    enabled: canQuery,
    retry: false,
  })

  const toggleMutation = useMutation({
    mutationFn: async (currentlySaved) => {
      if (currentlySaved) {
        await removeFromWishlist({ productId })
        return false
      }
      await addToWishlist({ productId })
      return true
    },
    retry: false,
    onSuccess: (nextSaved) => {
      if (!userId || !productId) return
      queryClient.setQueryData(wishlistKeys.check(userId, productId), nextSaved)
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all(userId) })
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.productCount(productId) })
    },
    onError: (error) => {
      if (!userId || !productId) return
      if (
        error?.code === 'PRODUCT_ALREADY_WISHLISTED' ||
        error?.code === 'WISHLIST_ITEM_NOT_FOUND'
      ) {
        void queryClient.invalidateQueries({ queryKey: wishlistKeys.check(userId, productId) })
        void queryClient.invalidateQueries({ queryKey: wishlistKeys.productCount(productId) })
      }
    },
  })

  return {
    isAuthenticated: Boolean(userId),
    isSaved: Boolean(checkQuery.data),
    count: countQuery.data ?? 0,
    isLoading: checkQuery.isPending,
    isPending: toggleMutation.isPending,
    error: toggleMutation.error,
    toggle: () => {
      if (!canQuery || toggleMutation.isPending) return
      toggleMutation.mutate(Boolean(checkQuery.data))
    },
  }
}
