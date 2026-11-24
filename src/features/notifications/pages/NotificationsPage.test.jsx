import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import i18n from '@/i18n'
import { NotificationsPage } from './NotificationsPage'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from '@/services/notifications/notificationService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  meQueryKey: ['users', 'me'],
  useSession: vi.fn(() => ({
    hasAccessToken: true,
    profileQuery: { isSuccess: true, data: { id: 'viewer' } },
  })),
}))
vi.mock('@/services/notifications/notificationService', () => ({
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  deleteNotification: vi.fn(),
}))
const item = {
  id: 'opaque-id',
  userId: 'viewer',
  title: 'Order updated',
  message: 'Plain notification body',
  read: false,
  deleted: false,
  type: 'FUTURE_TYPE',
  createdAt: '2026-11-22T01:00:00Z',
}
const page = (items = [item], nextToken) => ({
  items,
  nextToken,
  hasMore: Boolean(nextToken),
  limit: 20,
})
let client
beforeEach(async () => {
  vi.resetAllMocks()
  vi.mocked(useSession).mockReturnValue({
    hasAccessToken: true,
    profileQuery: { isSuccess: true, data: { id: 'viewer' } },
  })
  setAccessToken('test-token')
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  client.setQueryData(meQueryKey, { id: 'viewer' })
  vi.mocked(getNotifications).mockResolvedValue(page())
  vi.mocked(markNotificationRead).mockResolvedValue(undefined)
  vi.mocked(deleteNotification).mockResolvedValue(undefined)
  await i18n.changeLanguage('vi')
})
afterEach(() => {
  clearAccessToken()
  client.clear()
})
function mount() {
  render(
    <QueryClientProvider client={client}>
      <NotificationsPage />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

test('loads the inbox and renders unknown types as plain content', async () => {
  mount()
  expect(await screen.findByText(item.title)).toBeInTheDocument()
  expect(screen.getByText(item.message)).toBeInTheDocument()
  expect(screen.getByText('Chưa đọc')).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('continues after an empty filtered page and deduplicates overlapping pages', async () => {
  vi.mocked(getNotifications)
    .mockResolvedValueOnce(page([], 'next1'))
    .mockResolvedValueOnce(page([item], 'next2'))
    .mockResolvedValueOnce(page([item]))
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Tải thêm' }))
  await screen.findByText(item.title)
  await user.click(screen.getByRole('button', { name: 'Tải thêm' }))
  await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(3))
  expect(screen.getAllByText(item.title)).toHaveLength(1)
  expect(getNotifications.mock.calls[1][0].token).toBe('next1')
})

test('read state changes only after mutation and canonical refetch succeed', async () => {
  let resolve
  vi.mocked(markNotificationRead).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Đánh dấu đã đọc' }))
  expect(screen.getByText('Chưa đọc')).toBeInTheDocument()
  vi.mocked(getNotifications).mockResolvedValue(page([{ ...item, read: true }]))
  await act(async () => resolve())
  expect(await screen.findByText('Đã đọc')).toBeInTheDocument()
  expect(markNotificationRead).toHaveBeenCalledTimes(1)
})

test('failed delete keeps the notification and offers a safe retry', async () => {
  vi.mocked(deleteNotification).mockRejectedValue(new Error('network'))
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Xóa' }))
  await user.click(screen.getByRole('button', { name: 'Xác nhận xóa' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể cập nhật thông báo')
  expect(screen.getByText(item.title)).toBeInTheDocument()
  expect(deleteNotification).toHaveBeenCalledTimes(1)
})

test('confirmed delete refetches the inbox', async () => {
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Xóa' }))
  vi.mocked(getNotifications).mockResolvedValue(page([]))
  await user.click(screen.getByRole('button', { name: 'Xác nhận xóa' }))
  expect(await screen.findByText('Chưa có thông báo')).toBeInTheDocument()
  expect(screen.queryByText(item.title)).not.toBeInTheDocument()
})

test('append failure retains previous items and can retry the same cursor', async () => {
  vi.mocked(getNotifications)
    .mockResolvedValueOnce(page([item], 'next'))
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(page([item]))
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Tải thêm' }))
  await screen.findByRole('alert')
  expect(screen.getByText(item.title)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Tải thêm' }))
  await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(3))
  expect(getNotifications.mock.calls[2][0].token).toBe('next')
})

test('403 hides cached content and actions', async () => {
  vi.mocked(getNotifications).mockRejectedValue({ status: 403 })
  mount()
  expect(await screen.findByRole('alert')).toHaveTextContent('Bạn không có quyền xem thông báo')
  expect(screen.queryByRole('button', { name: 'Đánh dấu đã đọc' })).not.toBeInTheDocument()
})

test('a pending mutation cannot restore notification data after logout', async () => {
  let resolve
  vi.mocked(markNotificationRead).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Đánh dấu đã đọc' }))
  await act(async () => {
    clearAccessToken()
    client.clear()
    resolve()
  })
  expect(client.getQueryData(['notifications', 'viewer', 'inbox'])).toBeUndefined()
  expect(getNotifications).toHaveBeenCalledTimes(1)
})

test('foreign or deleted records never render', async () => {
  vi.mocked(getNotifications).mockResolvedValue(
    page([
      { ...item, userId: 'other' },
      { ...item, id: 'deleted', deleted: true },
    ]),
  )
  mount()
  expect(await screen.findByText('Chưa có thông báo')).toBeInTheDocument()
  expect(screen.queryByText(item.title)).not.toBeInTheDocument()
})

test('does not request notifications without a verified session', async () => {
  vi.mocked(useSession).mockReturnValue({
    hasAccessToken: false,
    profileQuery: { isSuccess: false },
  })
  clearAccessToken()
  mount()
  await act(async () => {})
  expect(getNotifications).not.toHaveBeenCalled()
})

test('refresh drops the old cursor chain and starts from page one', async () => {
  vi.mocked(getNotifications)
    .mockResolvedValueOnce(page([item], 'next'))
    .mockResolvedValueOnce(page([{ ...item, id: 'second', title: 'Older update' }]))
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Tải thêm' }))
  await screen.findByText('Older update')
  vi.mocked(getNotifications).mockResolvedValue(page([{ ...item, title: 'Newest update' }]))
  await user.click(screen.getByRole('button', { name: 'Làm mới' }))
  await screen.findByText('Newest update')
  expect(screen.queryByText('Older update')).not.toBeInTheDocument()
  expect(getNotifications).toHaveBeenCalledTimes(3)
  expect(getNotifications.mock.calls[2][0].token).toBeUndefined()
})

test('double click while marking read sends one mutation', async () => {
  let resolve
  vi.mocked(markNotificationRead).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const user = mount()
  await user.dblClick(await screen.findByRole('button', { name: 'Đánh dấu đã đọc' }))
  expect(markNotificationRead).toHaveBeenCalledTimes(1)
  await act(async () => resolve())
})

test('mutation 403 hides existing cached notification content', async () => {
  vi.mocked(markNotificationRead).mockRejectedValue({ status: 403 })
  const user = mount()
  await user.click(await screen.findByRole('button', { name: 'Đánh dấu đã đọc' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Bạn không có quyền xem thông báo')
  expect(screen.queryByText(item.title)).not.toBeInTheDocument()
})

test('filters unread notifications and marks all unread items as read', async () => {
  const unreadOne = { ...item, id: 'u1', title: 'Unread order', read: false }
  const readTwo = { ...item, id: 'r1', title: 'Already read', read: true }
  vi.mocked(getNotifications)
    .mockResolvedValueOnce(page([unreadOne, readTwo]))
    .mockResolvedValue(page([{ ...unreadOne, read: true }, readTwo]))

  const user = mount()
  expect(await screen.findByText('Unread order')).toBeInTheDocument()
  expect(screen.getByText('Already read')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Chưa đọc (1)' }))
  expect(screen.getByText('Unread order')).toBeInTheDocument()
  expect(screen.queryByText('Already read')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Đánh dấu tất cả đã đọc' }))
  await waitFor(() => expect(markNotificationRead).toHaveBeenCalledExactlyOnceWith({ id: 'u1' }))
  expect(await screen.findByText('Không còn thông báo chưa đọc')).toBeInTheDocument()
})
