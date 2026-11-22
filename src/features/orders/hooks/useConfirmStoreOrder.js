import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { meQueryKey } from '@/features/auth/hooks/useSession'
import { getStoreOrderAccess, storeOrdersKeys } from '@/features/orders/storeOrdersState'
import { myStoreQueryKey } from '@/features/stores/hooks/useMyStore'
import { getAccessToken } from '@/lib/tokenStorage'
import { ApiError } from '@/services/api/ApiError'
import { confirmStoreOrder } from '@/services/orders/storeOrderService'

export function useConfirmStoreOrder({ userId, storeId, queryKey }) {
  const client = useQueryClient()
  const locked = useRef(false)
  const isCurrent = (actorId) =>
    Boolean(getAccessToken() && actorId && client.getQueryData(meQueryKey)?.id === actorId)
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ actorId, targetStoreId, orderId, pageKey }) => {
      if (!isCurrent(actorId)) return null
      const profile = client.getQueryData(meQueryKey)
      const ownerKey = myStoreQueryKey(actorId)
      const access = getStoreOrderAccess(profile, client.getQueryData(ownerKey))
      if (
        !access.canConfirm ||
        access.storeId !== targetStoreId ||
        client.getQueryState(ownerKey)?.error
      ) {
        throw new ApiError({
          status: 403,
          code: 'ACCESS_DENIED',
          message: 'Store owner confirmation required',
        })
      }
      await client.cancelQueries({ queryKey: storeOrdersKeys.all(actorId, targetStoreId) })
      if (!isCurrent(actorId)) return null
      const order = client.getQueryData(pageKey)?.items?.find((item) => item.id === orderId)
      if (
        !order ||
        order.storeId !== targetStoreId ||
        order.status !== 'PENDING_CONFIRMED' ||
        client.getQueryState(pageKey)?.error
      ) {
        throw new ApiError({
          status: 400,
          code: 'INVALID_ORDER_STATE',
          message: 'Order state changed',
        })
      }
      return confirmStoreOrder({ orderId })
    },
    onSettled: async (_data, _error, { actorId, targetStoreId }) => {
      if (!isCurrent(actorId)) return
      await client.invalidateQueries({ queryKey: storeOrdersKeys.all(actorId, targetStoreId) })
    },
  })

  async function confirmOrder(orderId) {
    if (locked.current) return null
    locked.current = true
    try {
      return await mutation.mutateAsync({
        actorId: userId,
        targetStoreId: storeId,
        orderId,
        pageKey: queryKey,
      })
    } finally {
      locked.current = false
    }
  }

  return { ...mutation, confirmOrder }
}
