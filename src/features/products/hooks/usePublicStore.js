import { skipToken, useQuery } from '@tanstack/react-query'

import { getPublicStore } from '@/services/stores/storeService'

/** @param {string | null | undefined} storeId */
export function usePublicStore(storeId) {
  return useQuery({
    queryKey: ['stores', 'detail', storeId],
    queryFn: storeId ? ({ signal }) => getPublicStore({ storeId, signal }) : skipToken,
  })
}
