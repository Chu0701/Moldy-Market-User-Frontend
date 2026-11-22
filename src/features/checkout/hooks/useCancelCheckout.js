import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import { cartQueryKey } from '@/features/cart/hooks/useCart'
import { getCancellableCheckoutOrder } from '@/features/checkout/cancelCheckout'
import { checkoutKey } from '@/features/checkout/hooks/useCheckout'
import { myOrdersQueryKey } from '@/features/orders/hooks/useMyOrders'
import { productKeys } from '@/features/products/hooks/useProductSearch'
import { getAccessToken } from '@/lib/tokenStorage'
import { ApiError } from '@/services/api/ApiError'
import { cancelMyOrder } from '@/services/orders/cancelOrderService'

export function useCancelCheckout(checkoutId) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const queryClient = useQueryClient()
  const isCurrent = (actorId) =>
    Boolean(getAccessToken() && actorId && queryClient.getQueryData(meQueryKey)?.id === actorId)
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ actorId, targetId }) => {
      if (!isCurrent(actorId)) return null
      const key = checkoutKey(actorId, targetId)
      const snapshot = queryClient.getQueryData(key)
      const orderId = getCancellableCheckoutOrder(snapshot, actorId)
      if (!orderId)
        throw new ApiError({
          status: 400,
          code: 'INVALID_ORDER_STATE',
          message: 'Checkout state changed,',
        })
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      if (!isCurrent(actorId)) return null
      return cancelMyOrder({ orderId })
    },
    onSettled: async (_data, _error, { actorId, targetId }) => {
      if (!isCurrent(actorId)) return
      const key = checkoutKey(actorId, targetId)
      const snapshot = queryClient.getQueryData(key)
      const ids = [
        ...new Set(
          snapshot?.orders?.flatMap((order) => order.items?.map((item) => item.productId) ?? []) ??
            [],
        ),
      ].filter(Boolean)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key, exact: true }),
        queryClient.invalidateQueries({ queryKey: cartQueryKey(actorId), exact: true }),
        queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(actorId), exact: true }),
        ...ids.map((id) =>
          queryClient.invalidateQueries({ queryKey: productKeys.detail(id), exact: true }),
        ),
      ])
    },
  })
  return {
    ...mutation,
    userId,
    mutateAsync: () => mutation.mutateAsync({ actorId: userId, targetId: checkoutId }),
  }
}
