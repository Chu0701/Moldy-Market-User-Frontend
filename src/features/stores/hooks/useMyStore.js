import { skipToken, useQuery } from '@tanstack/react-query'

import { getMyStore } from '@/services/stores/storeService'

/** @param {string} userId */
export function myStoreQueryKey(userId) {
  return ['stores', 'mine', userId]
}

/** @param {string | undefined} userId */
export function useMyStore(userId) {
  return useQuery({
    queryKey: userId ? myStoreQueryKey(userId) : ['stores', 'mine'],
    queryFn: userId
      ? async ({ signal }) => {
          try {
            return await getMyStore({ signal })
          } catch (error) {
            if (error?.status === 404 && error?.code === 'STORE_001') {
              return null
            }

            throw error
          }
        }
      : skipToken,
    retry: false,
  })
}
