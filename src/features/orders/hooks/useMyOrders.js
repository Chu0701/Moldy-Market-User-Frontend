import { skipToken, useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { getMyOrders } from '@/services/orders/orderService'

export function myOrdersQueryKey(userId) {
  return ['orders', 'mine', userId]
}

function byCreatedAtDesc(a, b) {
  const timeA = a?.createdAt ? Date.parse(a.createdAt) : Number.NaN
  const timeB = b?.createdAt ? Date.parse(b.createdAt) : Number.NaN
  if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0
  return timeB - timeA
}

export function useMyOrders() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: myOrdersQueryKey(userId),
    queryFn: userId ? ({ signal }) => getMyOrders({ signal }) : skipToken,
    select: (orders) => orders.filter((order) => order.buyerId === userId).sort(byCreatedAtDesc),
    refetchOnMount: 'always',
    retry: false,
  })
}
