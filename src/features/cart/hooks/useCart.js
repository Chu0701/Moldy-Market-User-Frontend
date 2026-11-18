import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import { addCartItem, getCart, removeCartItem } from '@/services/cart/cartService'

export function cartQueryKey(userId) {
  return ['cart', userId]
}

export function useCart() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: cartQueryKey(userId),
    queryFn: userId ? ({ signal }) => getCart({ signal }) : skipToken,
    retry: false,
  })
}

function useCartMutation(mutationFn) {
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const queryKey = cartQueryKey(userId)

  return useMutation({
    mutationFn,
    scope: { id: `cart-${userId}` },
    retry: false,
    onSuccess: async (cart) => {
      await queryClient.cancelQueries({ queryKey, exact: true })

      if (queryClient.getQueryData(meQueryKey)?.id !== userId) return

      queryClient.setQueryData(queryKey, cart)
    },
  })
}

export function useAddCartItem() {
  return useCartMutation(addCartItem)
}

export function useRemoveCartItem() {
  return useCartMutation(removeCartItem)
}
