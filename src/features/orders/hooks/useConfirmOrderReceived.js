import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { myOrdersQueryKey } from '@/features/orders/hooks/useMyOrders'
import { confirmOrderReceived } from '@/services/orders/orderService'

export function useConfirmOrderReceived() {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id

  return useMutation({
    mutationFn: ({ orderId }) => confirmOrderReceived({ orderId }),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(userId) })
      }
    },
  })
}
