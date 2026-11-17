import { useMutation, useQueryClient } from '@tanstack/react-query'

import { storeStaffQueryKey } from '@/features/stores/hooks/useStoreStaff'
import { removeStoreStaff } from '@/services/stores/storeService'

/** @param {string} userId */
export function useRemoveStoreStaff(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeStoreStaff,
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: storeStaffQueryKey(userId),
        exact: true,
      }),
  })
}
