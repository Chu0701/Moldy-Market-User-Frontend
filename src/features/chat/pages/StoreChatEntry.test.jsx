import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { routes } from '@/app/router/routes'
import i18n from '@/i18n'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { getMe } from '@/services/users/userService'
import { getPublicStore, getMyStaffProfile } from '@/services/stores/storeService'
import { getProductById, searchProducts } from '@/services/products/productService'
import {
  startConversation,
  getConversations,
  getConversationMessages,
} from '@/services/chat/chatService'

vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))
vi.mock('@/services/stores/storeService', async (original) => ({
  ...(await original()),
  getPublicStore: vi.fn(),
  getMyStaffProfile: vi.fn(),
}))
vi.mock('@/services/products/productService', async (original) => ({
  ...(await original()),
  getProductById: vi.fn(),
  searchProducts: vi.fn(),
}))
vi.mock('@/services/chat/chatService', () => ({
  startConversation: vi.fn(),
  getConversations: vi.fn(),
  getConversationMessages: vi.fn(),
}))
vi.mock('@/services/chat/chatConnection', () => ({
  connectChat: vi.fn(() => ({ close: vi.fn(), sendText: vi.fn() })),
}))
vi.mock('@/services/categories/categoryService', () => ({
  getCategoryTree: vi.fn().mockResolvedValue([]),
  getCategoryById: vi.fn(),
}))
vi.mock('@/services/api/authRefreshInterceptor', () => ({
  waitForPendingRefresh: vi.fn().mockResolvedValue(),
}))
vi.mock('@/services/auth/authService', () => ({
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(),
  registerAccount: vi.fn(),
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
}))

const buyer = { id: 'buyer', roles: ['USER'], permissions: [] }
const shop = { id: 'shop', ownerId: 'owner', name: 'Chu shop', description: 'Used books' }
const product = {
  id: 'product',
  sellerId: 'staff-poster',
  storeId: shop.id,
  title: 'Staff listing',
  status: 'ACTIVE',
  condition: 'USED',
  price: 1000,
  images: [],
}
const conversation = {
  id: 'room',
  participant1Id: buyer.id,
  participant2Id: shop.ownerId,
  status: 'ACTIVE',
  canSend: true,
  createdAt: '2026-11-21T10:00:00Z',
}
let client, router
beforeEach(async () => {
  vi.clearAllMocks()
  setAccessToken('entry-token')
  vi.mocked(getMe).mockResolvedValue(buyer)
  vi.mocked(getPublicStore).mockResolvedValue(shop)
  vi.mocked(getProductById).mockResolvedValue(product)
  vi.mocked(searchProducts).mockResolvedValue({ items: [], page: 1, hasNext: false })
  vi.mocked(startConversation).mockResolvedValue(conversation)
  vi.mocked(getConversations).mockResolvedValue([conversation])
  vi.mocked(getConversationMessages).mockResolvedValue({ items: [], page: 1, hasNext: false })
  await i18n.changeLanguage('vi')
})
afterEach(() => {
  clearAccessToken()
  router?.dispose()
  client?.clear()
  vi.restoreAllMocks()
})
function open(path) {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}
const button = () => screen.findByRole('button', { name: 'Chat với gian hàng' }, { timeout: 4000 })

test.each(['/products/product', '/stores/shop'])(
  'opens an owner conversation from %s',
  async (path) => {
    const user = open(path)
    const start = await button()
    await waitFor(() => expect(start).toBeEnabled())
    await user.click(start)
    await waitFor(() => expect(router.state.location.pathname).toBe('/chat/room'))
    expect(startConversation).toHaveBeenCalledExactlyOnceWith({ targetUserId: 'owner' })
    expect(startConversation).not.toHaveBeenCalledWith({ targetUserId: 'staff-poster' })
  },
)

test('guest chat link goes to login and preserves the product return URL', async () => {
  clearAccessToken()
  const user = open('/products/product?from=search')
  await user.click(
    await screen.findByRole('link', { name: 'Chat với gian hàng' }, { timeout: 4000 }),
  )
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  expect(router.state.location.state.from).toBe('/products/product?from=search')
  expect(startConversation).not.toHaveBeenCalled()
})

test('owner cannot start a conversation with themselves', async () => {
  vi.mocked(getMe).mockResolvedValue({ ...buyer, id: shop.ownerId, roles: ['OWNER'] })
  open('/stores/shop')
  const start = await button()
  await screen.findByText('Đây là gian hàng của bạn.')
  expect(start).toBeDisabled()
  expect(startConversation).not.toHaveBeenCalled()
})

test('staff cannot use the customer chat entry for their own store', async () => {
  vi.mocked(getMe).mockResolvedValue({
    ...buyer,
    id: 'staff-poster',
    roles: ['USER', 'STAFF'],
    storeId: shop.id,
  })
  vi.mocked(getMyStaffProfile).mockResolvedValue({
    userId: 'staff-poster',
    storeId: shop.id,
    permissions: ['STORE_WORKSPACE_ACCESS'],
  })
  vi.mocked(startConversation).mockResolvedValue({
    ...conversation,
    participant1Id: 'staff-poster',
  })
  open('/products/product')
  const start = await button()
  await screen.findByText(/Chủ shop và nhân viên không dùng chat mua bán/)
  expect(start).toBeDisabled()
  expect(startConversation).not.toHaveBeenCalled()
})

test('staff may start customer chat with another store', async () => {
  vi.mocked(getMe).mockResolvedValue({
    ...buyer,
    id: 'staff-poster',
    roles: ['USER', 'STAFF'],
    storeId: 'employer-shop',
  })
  vi.mocked(getMyStaffProfile).mockResolvedValue({
    userId: 'staff-poster',
    storeId: 'employer-shop',
    permissions: ['STORE_WORKSPACE_ACCESS'],
  })
  vi.mocked(startConversation).mockResolvedValue({
    ...conversation,
    participant1Id: 'staff-poster',
  })
  const user = open('/stores/shop')
  const start = await button()
  await waitFor(() => expect(start).toBeEnabled())
  await user.click(start)
  await waitFor(() =>
    expect(startConversation).toHaveBeenCalledExactlyOnceWith({ targetUserId: shop.ownerId }),
  )
})

test('missing ownerId never falls back to the staff sellerId', async () => {
  vi.mocked(getPublicStore).mockResolvedValue({ ...shop, ownerId: undefined })
  open('/products/product')
  const start = await button()
  await screen.findByText('Chưa xác định được người nhận tin của gian hàng.')
  expect(start).toBeDisabled()
  expect(startConversation).not.toHaveBeenCalled()
})

test('double click sends a single POST and opens the returned existing conversation', async () => {
  let finish
  vi.mocked(startConversation).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open('/stores/shop')
  const start = await button()
  await waitFor(() => expect(start).toBeEnabled())
  await user.dblClick(start)
  expect(startConversation).toHaveBeenCalledTimes(1)
  await act(async () => {
    finish(conversation)
  })
  await waitFor(() => expect(router.state.location.pathname).toBe('/chat/room'))
})

test('server denial stays on the store and does not retry POST', async () => {
  vi.mocked(startConversation).mockRejectedValue({ status: 403, code: 'ACCESS_DENIED' })
  const user = open('/stores/shop')
  const start = await button()
  await waitFor(() => expect(start).toBeEnabled())
  await user.click(start)
  await screen.findByText('Bạn không có quyền bắt đầu cuộc trò chuyện này.')
  expect(router.state.location.pathname).toBe('/stores/shop')
  expect(startConversation).toHaveBeenCalledTimes(1)
})

test.each([
  ['CHAT_STORE_MEMBER', /Chủ shop và nhân viên không dùng chat mua bán/],
  ['CHAT_PARTICIPANT_UNAVAILABLE', /Tài khoản trong cuộc trò chuyện hiện không khả dụng/],
])('explains the server business rejection %s', async (code, message) => {
  vi.mocked(startConversation).mockRejectedValue({ status: 403, code })
  const user = open('/stores/shop')
  const start = await button()
  await waitFor(() => expect(start).toBeEnabled())
  await user.click(start)
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(router.state.location.pathname).toBe('/stores/shop')
})

test('unexpected participants in a response never open another users chat', async () => {
  vi.mocked(startConversation).mockResolvedValue({ ...conversation, participant2Id: 'stranger' })
  const user = open('/stores/shop')
  const start = await button()
  await waitFor(() => expect(start).toBeEnabled())
  await user.click(start)
  await screen.findByText('Chưa mở được cuộc trò chuyện. Hãy thử lại.')
  expect(router.state.location.pathname).toBe('/stores/shop')
})

test('a late create response after logout neither navigates nor restores the old inbox', async () => {
  let finish
  vi.mocked(startConversation).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open('/stores/shop')
  const start = await button()
  await waitFor(() => expect(start).toBeEnabled())
  await user.click(start)
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await screen.findByRole('button', { name: 'Đăng nhập' })
  await act(async () => {
    finish(conversation)
  })
  expect(router.state.location.pathname).not.toBe('/chat/room')
  expect(client.getQueryData(['chat', buyer.id, 'conversations'])).toBeUndefined()
})
