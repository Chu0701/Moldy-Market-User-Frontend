import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { offerKeys } from '@/features/offers/offerKeys'
import {
  acceptOffer,
  cancelOffer,
  counterOffer,
  createOffer,
  getActiveOfferForProduct,
  getOfferDetail,
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

/** @param {string | undefined} productId */
export function useActiveProductOffer(productId, { enabled = true } = {}) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: offerKeys.activeForProduct(userId, productId),
    queryFn: ({ signal }) => getActiveOfferForProduct({ productId, signal }),
    enabled: Boolean(enabled && userId && productId),
    retry: false,
  })
}

/** @param {string | undefined} offerId */
export function useOfferDetail(offerId, { enabled = true } = {}) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: offerKeys.detail(userId, offerId),
    queryFn: ({ signal }) => getOfferDetail({ offerId, signal }),
    enabled: Boolean(enabled && userId && offerId),
    retry: false,
  })
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

/**
 * Returns a Map<productId, OfferResponse> of the buyer's active (unexpired, un-checked-out) ACCEPTED offers.
 */
export function useAcceptedOffersMap() {
  const { query } = useSentOffers({ page: 1, size: 50 })
  const offersByProductId = useMemo(() => {
    const map = new Map()
    const referenceTime = query.dataUpdatedAt || 0
    for (const offer of query.data?.items ?? []) {
      if (offer.status !== 'ACCEPTED' || offer.checkoutGroupId) continue
      const deadline = offer.acceptedExpiresAt ? Date.parse(offer.acceptedExpiresAt) : 0
      if (referenceTime && deadline && deadline <= referenceTime) continue
      if (!map.has(offer.productId)) {
        map.set(offer.productId, offer)
      }
    }
    return map
  }, [query.data, query.dataUpdatedAt])

  return { offersByProductId, query }
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
