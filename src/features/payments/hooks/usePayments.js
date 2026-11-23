import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { paymentKeys } from '@/features/payments/paymentKeys'
import { getMyPayments } from '@/services/payments/paymentService'

export function useMyPayments() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  const query = useQuery({
    queryKey: paymentKeys.mine(userId),
    queryFn: ({ signal }) => getMyPayments({ signal }),
    enabled: Boolean(userId),
  })

  return { userId, profileQuery, query }
}
