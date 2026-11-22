import { afterEach, expect, test, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import { getNotifications, markNotificationRead, deleteNotification } from './notificationService'

afterEach(() => vi.restoreAllMocks())

test('preserves an empty filtered page with a next cursor and forwards cancellation', async () => {
  const signal = new AbortController().signal
  const page = { items: [], nextToken: 'opaque-next', hasMore: true, limit: 20 }
  const get = vi
    .spyOn(apiClient, 'get')
    .mockResolvedValue({ data: { success: true, code: 'SUCCESS', data: page } })
  expect(await getNotifications({ token: 'opaque-current', signal })).toEqual(page)
  expect(get).toHaveBeenCalledWith('/api/v1/notifications', {
    params: { limit: 20, token: 'opaque-current' },
    signal,
  })
})

test('rejects malformed pages instead of presenting them as empty', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { success: true, code: 'SUCCESS', data: { items: [], hasMore: true } },
  })
  await expect(getNotifications()).rejects.toThrow()
})

test('read and delete accept empty 204 bodies and encode opaque IDs', async () => {
  const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ status: 204, data: '' })
  const remove = vi.spyOn(apiClient, 'delete').mockResolvedValue({ status: 204, data: '' })
  await expect(markNotificationRead({ id: 'opaque/id' })).resolves.toBeUndefined()
  await expect(deleteNotification({ id: 'opaque/id' })).resolves.toBeUndefined()
  expect(patch).toHaveBeenCalledWith('/api/v1/notifications/opaque%2Fid/read')
  expect(remove).toHaveBeenCalledWith('/api/v1/notifications/opaque%2Fid')
})
