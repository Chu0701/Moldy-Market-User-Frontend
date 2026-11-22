import { z } from 'zod'
import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** Verified NotificationRecord contract: doc14 section 5.1. IDs/cursors are opaque. */
const notificationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  type: z.string().nullish(),
  title: z.string().nullish(),
  message: z.string().nullish(),
  relatedEntityId: z.string().nullish(),
  relatedEntityType: z.string().nullish(),
  read: z.boolean(),
  deleted: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }).nullish(),
  readAt: z.iso.datetime({ offset: true }).nullish(),
})
const pageSchema = z
  .object({
    items: z.array(notificationSchema),
    limit: z.number().int().min(1).max(50),
    hasMore: z.boolean(),
    nextToken: z.string().min(1).nullish(),
  })
  .refine((page) => !page.hasMore || Boolean(page.nextToken))

/** @param {{token?: string, signal?: AbortSignal}} [options] */
export async function getNotifications({ token, signal } = {}) {
  return pageSchema.parse(
    unwrap(
      await apiClient.get('/api/v1/notifications', {
        params: { limit: 20, token },
        signal,
      }),
    ),
  )
}

/** @param {{id: string}} options */
export async function markNotificationRead({ id }) {
  return unwrap(await apiClient.patch(`/api/v1/notifications/${encodeURIComponent(id)}/read`))
}

/** @param {{id: string}} options */
export async function deleteNotification({ id }) {
  return unwrap(await apiClient.delete(`/api/v1/notifications/${encodeURIComponent(id)}`))
}
