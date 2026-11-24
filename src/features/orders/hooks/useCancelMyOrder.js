import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { myOrdersQueryKey } from '@/features/orders/hooks/useMyOrders'
import { cancelMyOrder } from '@/services/orders/cancelOrderService'

export function useCancelMyOrder() {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useMutation({
    mutationFn: ({ orderId }) => cancelMyOrder({ orderId }),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(userId) })
      }
    },
  })
}
