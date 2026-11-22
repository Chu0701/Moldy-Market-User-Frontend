import { skipToken, useQuery } from '@tanstack/react-query'
import { getMyStaffProfile } from '@/services/stores/storeService'

/** @param {string | undefined} userId */
export function useMyStaffProfile(userId) {
  return useQuery({
    queryKey: ['stores', 'staff-me', userId],
    queryFn: userId
      ? async ({ signal }) => {
          const staff = await getMyStaffProfile({ signal })
          if (staff?.userId !== userId || !staff.storeId || !Array.isArray(staff.permissions)) {
            throw new Error('Invalid staff profile')
          }
          return staff
        }
      : skipToken,
    retry: false,
    staleTime: 0,
  })
}
