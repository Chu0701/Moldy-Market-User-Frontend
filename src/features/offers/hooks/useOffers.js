import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { offerKeys } from '@/features/offers/offerKeys'
import {
  acceptOffer,
  cancelOffer,
  counterOffer,
  createOffer,
  getOfferHistory,
  getReceivedOffers,
  getSentOffers,
  rejectOffer,
} from '@/services/offers/offerService'

/** @param {{ page?: number, size?: number }} [params] */
export function useSentOffers({ page = 1, size = 10 } = {}) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  const query = useQuery({
    queryKey: offerKeys.sent(userId, page, size),
    queryFn: ({ signal }) => getSentOffers({ page, size, signal }),
    enabled: Boolean(userId),
  })

  return { userId, profileQuery, query }
}

/** @param {{ page?: number, size?: number }} [params] */
export function useReceivedOffers({ page = 1, size = 10 } = {}) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  const query = useQuery({
    queryKey: offerKeys.received(userId, page, size),
    queryFn: ({ signal }) => getReceivedOffers({ page, size, signal }),
    enabled: Boolean(userId),
  })
  return { userId, profileQuery, query }
}

/** @param {{ offerId?: string, page?: number, size?: number, enabled?: boolean }} params */
export function useOfferHistory({ offerId, page = 1, size = 20, enabled = true }) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  return useQuery({
    queryKey: offerKeys.history(userId, offerId, page, size),
    queryFn: ({ signal }) => getOfferHistory({ offerId, page, size, signal }),
    enabled: Boolean(userId && offerId && enabled),
  })
}
function useOfferMutation(mutationFn) {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  return useMutation({
    mutationFn: (variables) => mutationFn(variables),
    retry: false,
    onSuccess: () => {
      if (!userId) return
      void queryClient.invalidateQueries({ queryKey: offerKeys.all(userId) })
    },
  })
}
export function useCreateOffer() {
  return useOfferMutation(createOffer)
}
export function useCounterOffer() {
  return useOfferMutation(counterOffer)
}
export function useAcceptOffer() {
  return useOfferMutation(acceptOffer)
}
export function useRejectOffer() {
  return useOfferMutation(rejectOffer)
}
export function useCancelOffer() {
  return useOfferMutation(cancelOffer)
}
