import { useMutation, useQueryClient } from '@tanstack/react-query'

import { storeStaffQueryKey } from '@/features/stores/hooks/useStoreStaff'
import { updateStoreStaffPermissions } from '@/services/stores/storeService'

/** @param {string} userId */
export function useUpdateStoreStaffPermissions(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateStoreStaffPermissions,
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: storeStaffQueryKey(userId),
        exact: true,
      }),
  })
}
