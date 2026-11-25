import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { useSession } from '@/features/auth/hooks/useSession'
import { FeaturedProducts } from '@/features/marketplace/components/FeaturedProducts'
import { ProductSkeleton } from '@/features/marketplace/components/ProductSkeleton'
import { useNewestProducts } from '@/features/marketplace/hooks/useNewestProducts'
import { ProductCard } from '@/features/products/components/ProductCard'
import { wishlistKeys } from '@/features/wishlist/wishlistKeys'
import { addToWishlist, removeFromWishlist } from '@/services/wishlist/wishlistService'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

/** @param {{ query?: ReturnType<typeof useNewestProducts> }} props */
export function NewestProductsSection({ query: providedQuery } = {}) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const fallbackQuery = useNewestProducts()
  const query = providedQuery ?? fallbackQuery
  const products = query.data?.items ?? []
  const [localWishlistOverrides, setLocalWishlistOverrides] = useState({})

  // Passively read cached wishlist IDs (zero extra mount requests on HomePage).
  const cachedWishlistIds = useMemo(() => {
    const ids = new Set()
    if (!userId) return ids
    const entries = queryClient.getQueriesData({ queryKey: ['wishlist', userId, 'list'] })
    for (const [, data] of entries) {
      for (const item of data?.items ?? []) {
        if (item?.productId) ids.add(item.productId)
      }
    }
    return ids
  }, [queryClient, userId])

  const wishlistMutation = useMutation({
    mutationFn: async ({ productId, currentlySaved }) => {
      if (currentlySaved) {
        await removeFromWishlist({ productId })
        return { productId, saved: false }
      }
      await addToWishlist({ productId })
      return { productId, saved: true }
    },
    retry: false,
    onSuccess: ({ productId, saved }) => {
      setLocalWishlistOverrides((prev) => ({ ...prev, [productId]: saved }))
      pushToast(t(saved ? 'wishlist.savedToast' : 'wishlist.removedToast'), 'info')
      if (!userId) return
      queryClient.setQueryData(wishlistKeys.check(userId, productId), saved)
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all(userId) })
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.productCount(productId) })
    },
  })

  function handleToggleWishlist(productId) {
    if (!userId) {
      void navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    const currentlySaved =
      productId in localWishlistOverrides
        ? localWishlistOverrides[productId]
        : cachedWishlistIds.has(productId)
    wishlistMutation.mutate({ productId, currentlySaved })
  }

  let content

  if (query.isPending) {
    content = <ProductSkeleton />
  } else if (query.isError) {
    if (query.error.status === 403) {
      content = <ForbiddenState />
    } else {
      content = (
        <ErrorState
          title={t('products.errorTitle')}
          description={t('products.errorMessage')}
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      )
    }
  } else if (products.length === 0) {
    return null
  } else {
    content = products.map((product) => {
      const isSaved =
        product.id in localWishlistOverrides
          ? localWishlistOverrides[product.id]
          : cachedWishlistIds.has(product.id)

      return (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          price={product.price}
          imageUrl={product.images?.[0]}
          createdAt={product.createdAt}
          condition={product.condition}
          conditionLabel={t(conditionKeys[product.condition] ?? 'products.conditions.unknown')}
          isWishlisted={isSaved}
          wishlistPending={
            wishlistMutation.isPending && wishlistMutation.variables?.productId === product.id
          }
          onToggleWishlist={() => handleToggleWishlist(product.id)}
          compareProduct={{
            id: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.images?.[0],
            condition: product.condition,
            status: product.status,
            storeId: product.storeId,
            attributes: product.attributes,
          }}
        />
      )
    })
  }

  return <FeaturedProducts>{content}</FeaturedProducts>
}
