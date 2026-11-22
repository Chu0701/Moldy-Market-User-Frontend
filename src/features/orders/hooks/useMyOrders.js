import { skipToken, useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { getMyOrders } from '@/services/orders/orderService'

export function myOrdersQueryKey(userId) {
  return ['orders', 'mine', userId]
}

export function useMyOrders() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: myOrdersQueryKey(userId),
    queryFn: userId ? ({ signal }) => getMyOrders({ signal }) : skipToken,
    select: (orders) => orders.filter((order) => order.buyerId === userId),
    retry: false,
  })
}
