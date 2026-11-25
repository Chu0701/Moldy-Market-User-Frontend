import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createStoreReview,
  getOrderReview,
  getStoreReviews,
  replyToStoreReview,
} from '@/services/reviews/reviewService'

export const orderReviewQueryKey = (orderId) => ['reviews', 'order', orderId]
export const storeReviewsQueryKey = (storeId) => ['reviews', 'store', storeId]

/** @param {string | undefined} orderId @param {boolean} enabled */
export function useOrderReview(orderId, enabled = true) {
  return useQuery({
    queryKey: orderReviewQueryKey(orderId),
    queryFn: ({ signal }) => getOrderReview({ orderId, signal }),
    enabled: Boolean(orderId) && enabled,
    retry: false,
  })
}

/** @param {string | null | undefined} storeId */
export function useStoreReviews(storeId) {
  return useQuery({
    queryKey: storeReviewsQueryKey(storeId),
    queryFn: ({ signal }) => getStoreReviews({ storeId, signal }),
    enabled: Boolean(storeId),
    staleTime: 60_000,
    retry: false,
  })
}

export function useCreateStoreReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, rating, comment }) => createStoreReview({ orderId, rating, comment }),
    onSuccess: (review, variables) => {
      queryClient.setQueryData(orderReviewQueryKey(variables.orderId), review)
      if (review?.storeId) {
        void queryClient.invalidateQueries({ queryKey: storeReviewsQueryKey(review.storeId) })
      }
    },
  })
}

/** @param {string | null | undefined} storeId */
export function useReplyToStoreReview(storeId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, reply }) => replyToStoreReview({ reviewId, reply }),
    onSuccess: (updatedReview) => {
      const targetStoreId = storeId ?? updatedReview?.storeId
      if (targetStoreId) {
        void queryClient.invalidateQueries({ queryKey: storeReviewsQueryKey(targetStoreId) })
      }
    },
  })
}
