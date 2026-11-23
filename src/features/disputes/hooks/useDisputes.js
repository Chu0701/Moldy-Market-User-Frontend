import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { disputeKeys } from '@/features/disputes/disputeKeys'
import { myOrdersQueryKey } from '@/features/orders/hooks/useMyOrders'
import {
  cancelDispute,
  createDispute,
  getMyDisputeByOrder,
  getMyDisputes,
} from '@/services/disputes/disputeService'

export function useMyDisputes() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  const query = useQuery({
    queryKey: disputeKeys.list(userId),
    queryFn: ({ signal }) => getMyDisputes({ signal }),
    enabled: Boolean(userId),
  })

  return { userId, profileQuery, query }
}

/**
 * Loads the buyer's dispute for a specific order; returns null when Backend replies 404.
 * @param {string | undefined} orderId
 * @param {boolean} enabled
 */
export function useOrderDispute(orderId, enabled = true) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: disputeKeys.byOrder(userId, orderId),
    queryFn: async ({ signal }) => {
      try {
        return await getMyDisputeByOrder({ orderId, signal })
      } catch (error) {
        if (error?.status === 404 || error?.code === 'DISPUTE_NOT_EXISTED') {
          return null
        }
        throw error
      }
    },
    enabled: Boolean(userId && orderId && enabled),
    retry: false,
  })
}

export function useCreateDispute() {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useMutation({
    mutationFn: createDispute,
    retry: false,
    onSuccess: (dispute) => {
      if (!userId) return
      if (dispute?.orderId) {
        queryClient.setQueryData(disputeKeys.byOrder(userId, dispute.orderId), dispute)
      }
      void queryClient.invalidateQueries({ queryKey: disputeKeys.all(userId) })
      void queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(userId) })
    },
  })
}

export function useCancelDispute() {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useMutation({
    mutationFn: cancelDispute,
    retry: false,
    onSuccess: (dispute, variables) => {
      if (!userId) return
      queryClient.setQueryData(disputeKeys.byOrder(userId, variables.orderId), dispute)
      void queryClient.invalidateQueries({ queryKey: disputeKeys.all(userId) })
      void queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(userId) })
    },
  })
}
