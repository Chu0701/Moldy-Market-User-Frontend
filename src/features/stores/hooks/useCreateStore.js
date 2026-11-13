import { useMutation, useQueryClient } from '@tanstack/react-query'

import { meQueryKey } from '@/features/auth/hooks/useSession'
import { myStoreQueryKey } from '@/features/stores/hooks/useMyStore'
import { createStore } from '@/services/stores/storeService'

/** @param {string} userId */

export function useCreateStore(userId) {
  const queryClient = useQueryClient()
  const storeKey = myStoreQueryKey(userId)

  return useMutation({
    mutationFn: createStore,
    retry: false,
    onSuccess: async (store) => {
      await queryClient.cancelQueries({ queryKey: storeKey, exact: true })

      if (queryClient.getQueryData(meQueryKey)?.id !== userId) return

      queryClient.setQueryData(storeKey, store)
      void queryClient.invalidateQueries({ queryKey: meQueryKey, exact: true })
    },
  })
}
