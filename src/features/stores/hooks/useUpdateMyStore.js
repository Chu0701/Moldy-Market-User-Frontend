import { useMutation, useQueryClient } from '@tanstack/react-query'

import { meQueryKey } from '@/features/auth/hooks/useSession'
import { myStoreQueryKey } from '@/features/stores/hooks/useMyStore'
import { updateMyStore } from '@/services/stores/storeService'

/** @param {string} userId */
export function useUpdateMyStore(userId) {
  const queryClient = useQueryClient()
  const storeKey = myStoreQueryKey(userId)

  return useMutation({
    mutationFn: updateMyStore,
    retry: false,
    onSuccess: async (store) => {
      await queryClient.cancelQueries({ queryKey: storeKey, exact: true })
      if (queryClient.getQueryData(meQueryKey)?.id !== userId) return

      queryClient.setQueryData(storeKey, store)
      void queryClient.invalidateQueries({
        queryKey: ['stores', 'detail', store.id],
        exact: true,
      })
    },
  })
}
