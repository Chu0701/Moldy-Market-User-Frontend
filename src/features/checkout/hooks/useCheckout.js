import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import { cartQueryKey } from '@/features/cart/hooks/useCart'
import { myOrdersQueryKey } from '@/features/orders/hooks/useMyOrders'
import { getCheckoutStage } from '@/features/checkout/checkoutPayment'
import { getAccessToken } from '@/lib/tokenStorage'
import { createCheckout, getCheckout } from '@/services/checkout/checkoutService'

export const checkoutKey = (userId, checkoutId) => ['checkout', userId, checkoutId]
export const CHECKOUT_POLL_MS = 5000

function isCurrentUser(queryClient, userId) {
  return (
    Boolean(getAccessToken()) &&
    Boolean(userId) &&
    queryClient.getQueryData(meQueryKey)?.id === userId
  )
}

function refreshPurchaseQueries(queryClient, userId) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: cartQueryKey(userId), exact: true }),
    queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(userId), exact: true }),
  ])
}

export function useCreateCheckout() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const queryClient = useQueryClient()
  const mutation = useMutation({
    retry: false,
    scope: { id: 'checkout-create-' + userId },
    mutationFn: async (values) => {
      if (!isCurrentUser(queryClient, userId)) return null
      const result = await createCheckout(values)
      if (!result?.id || typeof result.id !== 'string') throw new Error('Missing checkout id')
      return isCurrentUser(queryClient, userId) ? result : null
    },
    onSuccess: (checkout) => {
      if (!checkout || !isCurrentUser(queryClient, userId)) return
      queryClient.setQueryData(checkoutKey(userId, checkout.id), checkout)
      void refreshPurchaseQueries(queryClient, userId)
    },
  })
  return { ...mutation, userId }
}

export function useCheckout(checkoutId) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const queryClient = useQueryClient()
  const lastRefresh = useRef(null)
  const query = useQuery({
    queryKey: checkoutKey(userId, checkoutId),
    queryFn: userId && checkoutId ? ({ signal }) => getCheckout({ checkoutId, signal }) : skipToken,
    staleTime: 0,
    retry: false,
    refetchInterval: (current) => {
      if (!userId || current.state.error) return false
      const stage = getCheckoutStage(current.state.data)
      return ['bankPending', 'syncing'].includes(stage) ? CHECKOUT_POLL_MS : false
    },
    refetchIntervalInBackground: false,
  })

  useEffect(() => {
    if (!query.data || query.error || !isCurrentUser(queryClient, userId)) return
    const stage = getCheckoutStage(query.data)
    const collected = query.data.orders
      ?.filter((order) => order.status === 'COMPLETED')
      .map((order) => order.id)
      .sort()
      .join(',')
    const stamp = [userId, checkoutId, stage, collected].join(':')
    const shouldRefresh =
      ['paid', 'expired', 'cancelled', 'failed'].includes(stage) || Boolean(collected)
    if (!shouldRefresh || lastRefresh.current === stamp) return
    lastRefresh.current = stamp
    void refreshPurchaseQueries(queryClient, userId)
  }, [query.data, query.error, userId, checkoutId, queryClient])

  return query
}
