import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import { getAccessToken, subscribeToAccessToken } from '@/lib/tokenStorage'
import { getMe } from '@/services/users/userService'

export const meQueryKey = ['users', 'me']

export function useSession({ enabled = true } = {}) {
  const accessToken = useSyncExternalStore(subscribeToAccessToken, getAccessToken, () => null)
  const hasAccessToken = Boolean(accessToken)

  const profileQuery = useQuery({
    queryKey: meQueryKey,
    queryFn: ({ signal }) => getMe({ signal }),
    enabled: enabled && hasAccessToken,
    retry: false,
  })

  return { hasAccessToken, profileQuery }
}
