import { useMutation, useQueryClient } from '@tanstack/react-query'

import { storeStaffQueryKey } from '@/features/stores/hooks/useStoreStaff'
import { addStoreStaff } from '@/services/stores/storeService'

/** @param {string} userId */
export function useAddStoreStaff(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addStoreStaff,
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: storeStaffQueryKey(userId),
        exact: true,
      }),
  })
}
