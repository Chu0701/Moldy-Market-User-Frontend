import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import { getAccessToken } from '@/lib/tokenStorage'
import { ApiError } from '@/services/api/ApiError'
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from '@/services/notifications/notificationService'

export const notificationKeys = { inbox: (userId) => ['notifications', userId, 'inbox'] }

export function useNotifications() {
  const { hasAccessToken, profileQuery } = useSession()
  const client = useQueryClient()
  const locked = useRef(false)
  const userId = hasAccessToken && profileQuery.isSuccess ? profileQuery.data?.id : undefined
  const queryKey = notificationKeys.inbox(userId)
  const isCurrent = (actor) =>
    Boolean(actor && getAccessToken() && client.getQueryData(meQueryKey)?.id === actor)
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => getNotifications({ token: pageParam, signal }),
    initialPageParam: undefined,
    getNextPageParam: (last, _pages, _lastParam, params) =>
      last.hasMore && last.nextToken && !params.includes(last.nextToken)
        ? last.nextToken
        : undefined,
    enabled: Boolean(userId && !profileQuery.isError),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  })
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ actor, id, action }) => {
      if (!isCurrent(actor)) return
      const key = notificationKeys.inbox(actor)
      await client.cancelQueries({ queryKey: key, exact: true })
      if (!isCurrent(actor)) return
      const cached = client.getQueryData(key)
      const item = cached?.pages
        .flatMap((page) => page.items)
        .find((row) => row.id === id && row.userId === actor && !row.deleted)
      if (!item || client.getQueryState(key)?.error) {
        throw new ApiError({
          status: 400,
          code: 'FE_NOTIFICATION_STATE_CHANGED',
          message: 'Refresh notification state before retrying',
        })
      }
      if (action === 'read') await markNotificationRead({ id })
      else await deleteNotification({ id })
    },
    onSettled: async (_data, _error, { actor }) => {
      if (isCurrent(actor)) {
        await client.invalidateQueries({ queryKey: notificationKeys.inbox(actor), exact: true })
      }
    },
  })

  async function update(id, action) {
    if (locked.current || !isCurrent(userId)) return
    locked.current = true
    try {
      await mutation.mutateAsync({ actor: userId, id, action })
    } finally {
      locked.current = false
    }
  }

  // Keep earlier pages when appending fails, but never display data after an auth denial.
  const error = [profileQuery.error, query.error, mutation.error].find(
    (value) => value?.status === 401 || value?.status === 403,
  )
  const seen = new Set()
  const items =
    !userId || error
      ? []
      : (query.data?.pages ?? [])
          .flatMap((page) => page.items)
          .filter((row) => {
            if (row.userId !== userId || row.deleted || seen.has(row.id)) return false
            seen.add(row.id)
            return true
          })

  async function refresh() {
    if (locked.current || !isCurrent(userId)) return
    mutation.reset()
    // Discard the cursor chain: its starting item may have been deleted or expired.
    await client.resetQueries({ queryKey, exact: true })
  }

  return { query, mutation, items, update, refresh, accessError: error, profileQuery, userId }
}
