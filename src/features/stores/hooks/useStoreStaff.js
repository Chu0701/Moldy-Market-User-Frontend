import { skipToken, useQuery } from '@tanstack/react-query'

import { getStoreStaff } from '@/services/stores/storeService'

/** @param {string | undefined} userId */
export function storeStaffQueryKey(userId) {
  return ['stores', 'staff', userId]
}

/** @param {string | undefined} userId */
export function useStoreStaff(userId) {
  return useQuery({
    queryKey: storeStaffQueryKey(userId),
    queryFn: userId ? ({ signal }) => getStoreStaff({ signal }) : skipToken,
    retry: false,
  })
}
