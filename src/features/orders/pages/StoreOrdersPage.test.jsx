import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { routes } from '@/app/router/routes'

vi.mock('@/services/chat/chatService', () => ({
  getConversations: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/services/chat/chatConnection', () => ({
  connectChat: vi.fn(() => ({ close: vi.fn(), sendText: vi.fn() })),
}))
import i18n from '@/i18n'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { getStoreOrders, confirmStoreOrder } from '@/services/orders/storeOrderService'
import { getMe } from '@/services/users/userService'
import { getMyStore, getPublicStore, getMyStaffProfile } from '@/services/stores/storeService'

vi.mock('@/services/orders/storeOrderService', () => ({
  getStoreOrders: vi.fn(),
  confirmStoreOrder: vi.fn(),
}))
vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))
vi.mock('@/services/stores/storeService', () => ({
  getMyStore: vi.fn(),
  getPublicStore: vi.fn(),
  getMyStaffProfile: vi.fn(),
}))
vi.mock('@/services/categories/categoryService', () => ({
  getCategoryTree: vi.fn().mockResolvedValue([]),
  getCategoryById: vi.fn(),
}))
vi.mock('@/services/api/authRefreshInterceptor', () => ({
  waitForPendingRefresh: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/services/auth/authService', () => ({
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  registerAccount: vi.fn(),
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
}))

const owner = { id: 'owner', fullName: 'Chu', roles: ['OWNER'], permissions: [] }
const staff = {
  id: 'staff',
  fullName: 'Staff',
  roles: ['STAFF'],
  storeId: 'store-1',
  permissions: ['STORE_WORKSPACE_ACCESS', 'ORDER_PROCESS'],
}
const store = { id: 'store-1', ownerId: owner.id, name: 'Store one', status: 'ACTIVE' }
const order = {
  id: 'order-1',
  orderCode: 'ORD-STAFF',
  buyerId: 'buyer',
  sellerId: 'staff-creator',
  storeId: store.id,
  checkoutGroupId: 'checkout',
  status: 'PENDING_CONFIRMED',
  paymentMethod: 'COD',
  paymentStatus: 'PENDING',
  totalAmount: 1000,
  receiverName: 'Private receiver',
  receiverPhone: '0901234567',
  shippingAddress: 'Private address',
  createdAt: '2026-11-21T02:00:00Z',
  items: [
    {
      id: 1,
      productId: 'product',
      productName: 'Store snapshot book',
      quantity: 1,
      unitPrice: 1000,
    },
  ],
}
const rows = [order, { ...order, id: 'order-2', orderCode: 'ORD-COLLEAGUE', status: 'CONFIRMED' }]
const page = (items = rows, number = 1, hasNext = false) => ({
  items,
  page: number,
  size: 20,
  totalElements: items.length,
  hasNext,
})
let router, client

beforeEach(async () => {
  setAccessToken('store-orders-token')
  vi.mocked(getMe).mockReset().mockResolvedValue(owner)
  vi.mocked(getMyStore).mockReset().mockResolvedValue(store)
  vi.mocked(getPublicStore).mockReset().mockResolvedValue(store)
  vi.mocked(getMyStaffProfile)
    .mockReset()
    .mockResolvedValue({ userId: staff.id, storeId: store.id, permissions: staff.permissions })
  vi.mocked(getStoreOrders).mockReset().mockResolvedValue(page())
  vi.mocked(confirmStoreOrder)
    .mockReset()
    .mockResolvedValue({ ...order, status: 'CONFIRMED' })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  await i18n.changeLanguage('vi')
})

afterEach(() => {
  clearAccessToken()
  router?.dispose()
  client?.clear()
  vi.restoreAllMocks()
})

function open(path = '/store/orders', profile = owner) {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30000 }, mutations: { retry: false } },
  })
  client.setQueryData(['users', 'me'], profile)
  client.setQueryData(['cart', profile.id], { items: ['untouched'] })
  vi.mocked(getMe).mockResolvedValue(profile)
  router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}
const findConfirm = () =>
  screen.findByRole('button', { name: 'Xác nhận đơn COD' }, { timeout: 4000 })
const list = () => screen.getByRole('list', { name: 'Danh sách đơn của gian hàng' })
async function findStatus(text) {
  const orders = await screen.findByRole('list', { name: 'Danh sách đơn của gian hàng' })
  return within(orders).findByText(text)
}

test('owner reaches the list from store overview and sees orders from staff without buyer-only links', async () => {
  const user = open('/store')
  await user.click(
    await screen.findByRole('link', { name: 'Đơn hàng gian hàng' }, { timeout: 4000 }),
  )
  await screen.findByRole('heading', { name: 'ORD-STAFF' }, { timeout: 4000 })
  expect(screen.getByRole('heading', { name: 'ORD-COLLEAGUE' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'ORD-STAFF' })).not.toBeInTheDocument()
  await user.click(screen.getAllByText('Xem món và thông tin nhận hàng')[0])
  expect(screen.getAllByText('Private receiver')[0]).toBeVisible()
  expect(getStoreOrders).toHaveBeenCalledWith({
    storeId: store.id,
    page: 1,
    status: '',
    signal: expect.any(AbortSignal),
  })
})

test('delegated staff reaches the list and has no owner confirmation action or my-store request', async () => {
  const user = open('/store', staff)
  await user.click(
    await screen.findByRole('link', { name: 'Đơn hàng gian hàng' }, { timeout: 4000 }),
  )
  await screen.findByRole('heading', { name: 'ORD-STAFF' })
  expect(screen.queryByRole('button', { name: 'Xác nhận đơn COD' })).not.toBeInTheDocument()
  expect(getMyStore).not.toHaveBeenCalled()
  expect(confirmStoreOrder).not.toHaveBeenCalled()
})

test('staff without ORDER_PROCESS is forbidden before any order data request', async () => {
  vi.mocked(getMyStaffProfile).mockResolvedValue({
    userId: staff.id,
    storeId: store.id,
    permissions: ['STORE_WORKSPACE_ACCESS'],
  })
  open('/store/orders', staff)
  await screen.findByRole('heading', { name: 'Không có quyền xem nội dung' }, { timeout: 4000 })
  expect(getStoreOrders).not.toHaveBeenCalled()
})

test('staff order requests use the self membership store rather than a stale session store', async () => {
  open('/store/orders', { ...staff, storeId: 'stale-shop' })
  await screen.findByRole('heading', { name: 'ORD-STAFF' })
  expect(getStoreOrders).toHaveBeenCalledWith(expect.objectContaining({ storeId: store.id }))
})

test('a failed staff permission recheck hides previously cached private orders', async () => {
  open('/store/orders', staff)
  await screen.findByRole('heading', { name: 'ORD-STAFF' })
  vi.mocked(getMyStaffProfile).mockRejectedValue({ status: 403, code: 'ACCESS_DENIED' })
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['stores', 'staff-me', staff.id] })
  })
  await screen.findByRole('heading', { name: 'Không có quyền xem nội dung' })
  expect(screen.queryByText('ORD-STAFF')).not.toBeInTheDocument()
})

test('confirmation can be declined, then a double click submits exactly once and reads canonical state', async () => {
  let finish
  vi.mocked(confirmStoreOrder).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open()
  const button = await findConfirm()
  vi.mocked(window.confirm).mockReturnValueOnce(false)
  await user.click(button)
  expect(confirmStoreOrder).not.toHaveBeenCalled()
  vi.mocked(window.confirm).mockClear()
  await user.dblClick(button)
  expect(confirmStoreOrder).toHaveBeenCalledExactlyOnceWith({ orderId: order.id })
  expect(window.confirm).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Đang xác nhận…' })).toBeDisabled()
  expect(
    client.getQueryData(['orders', 'store', owner.id, store.id, { page: 1, status: '' }]).items[0]
      .status,
  ).toBe('PENDING_CONFIRMED')
  vi.mocked(getStoreOrders).mockResolvedValue(
    page(rows.map((item) => ({ ...item, status: 'CONFIRMED' }))),
  )
  await act(async () => {
    finish({ ...order, status: 'CONFIRMED' })
  })
  await waitFor(() => expect(within(list()).getAllByText('Đã xác nhận')).toHaveLength(2))
  expect(screen.queryByRole('button', { name: 'Xác nhận đơn COD' })).not.toBeInTheDocument()
  expect(client.getQueryData(['cart', owner.id]).items).toEqual(['untouched'])
  expect(screen.queryByText('Đã thanh toán', { exact: true })).not.toBeInTheDocument()
})

test('filter and pagination use URL state and changing status resets to page one', async () => {
  vi.mocked(getStoreOrders).mockImplementation(async ({ page: number }) => page(rows, number, true))
  const user = open('/store/orders?page=2')
  await findConfirm()
  await user.click(screen.getByRole('button', { name: 'Sau' }))
  await waitFor(() =>
    expect(getStoreOrders).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 })),
  )
  await user.selectOptions(screen.getByLabelText('Trạng thái đơn'), 'PENDING_CONFIRMED')
  await waitFor(() =>
    expect(getStoreOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, status: 'PENDING_CONFIRMED' }),
    ),
  )
  expect(router.state.location.search).toContain('page=1')
})

test('invalid URL is reset explicitly and never submitted to the endpoint', async () => {
  const user = open('/store/orders?page=0')
  await screen.findByRole('heading', { name: 'Bộ lọc chưa hợp lệ' }, { timeout: 4000 })
  expect(getStoreOrders).not.toHaveBeenCalled()
  await user.click(screen.getByRole('link', { name: 'Đặt lại bộ lọc' }))
  await screen.findByRole('heading', { name: 'ORD-STAFF' })
  expect(getStoreOrders).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
})

test('empty page has a useful state and a failed GET can be retried', async () => {
  vi.mocked(getStoreOrders).mockRejectedValueOnce({ status: 500 }).mockResolvedValue(page([]))
  const user = open()
  await screen.findByRole('heading', { name: 'Chưa tải được đơn gian hàng' }, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByRole('heading', { name: 'Chưa có đơn phù hợp' })
  expect(confirmStoreOrder).not.toHaveBeenCalled()
})

test('a refetch 403 hides cached customer details and confirmation controls', async () => {
  const user = open()
  await findConfirm()
  vi.mocked(getStoreOrders).mockRejectedValue({ status: 403 })
  await user.click(screen.getByRole('button', { name: 'Cập nhật danh sách' }))
  await screen.findByRole('heading', { name: 'Không có quyền xem nội dung' })
  expect(screen.queryByText('Private receiver')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'ORD-STAFF' })).not.toBeInTheDocument()
})

test('a changed order rejected by the server is refreshed without faking confirmation', async () => {
  vi.mocked(confirmStoreOrder).mockImplementation(async () => {
    vi.mocked(getStoreOrders).mockResolvedValue(page([{ ...order, status: 'CANCELLED' }]))
    throw { status: 400, code: 'INVALID_ORDER_STATE' }
  })
  const user = open()
  await user.click(await findConfirm())
  await findStatus('Đã hủy')
  expect(screen.getByRole('alert')).toHaveTextContent('Trạng thái đơn đã thay đổi')
  expect(confirmStoreOrder).toHaveBeenCalledTimes(1)
})

test('network ambiguity refetches the actual status and never retries the confirmation POST', async () => {
  vi.mocked(confirmStoreOrder).mockImplementation(async () => {
    vi.mocked(getStoreOrders).mockResolvedValue(page([{ ...order, status: 'CONFIRMED' }]))
    throw { code: 'FE_NETWORK_ERROR' }
  })
  const user = open()
  await user.click(await findConfirm())
  await findStatus('Đã xác nhận')
  expect(screen.getByRole('alert')).toHaveTextContent('Chưa xác định kết quả xác nhận')
  expect(confirmStoreOrder).toHaveBeenCalledTimes(1)
})

test('logout while POST is pending does not restore or invalidate another session cache', async () => {
  let finish
  vi.mocked(confirmStoreOrder).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open()
  await user.click(await findConfirm())
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  await act(async () => {
    clearAccessToken()
    client.clear()
  })
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  invalidate.mockClear()
  await act(async () => {
    finish({ ...order, status: 'CONFIRMED' })
  })
  expect(invalidate).not.toHaveBeenCalled()
  expect(
    client.getQueryData(['orders', 'store', owner.id, store.id, { page: 1, status: '' }]),
  ).toBeUndefined()
})

test('checks owner permission again after the confirmation dialog', async () => {
  const user = open()
  await findConfirm()
  vi.mocked(window.confirm).mockImplementation(() => {
    client.setQueryData(['users', 'me'], { ...staff, id: owner.id })
    return true
  })
  await user.click(screen.getByRole('button', { name: 'Xác nhận đơn COD' }))
  await screen.findByRole('alert')
  expect(confirmStoreOrder).not.toHaveBeenCalled()
})

test('POST success plus GET failure does not invent a new status or leave an actionable stale card', async () => {
  vi.mocked(confirmStoreOrder).mockImplementation(async () => {
    vi.mocked(getStoreOrders).mockRejectedValue({ status: 500 })
    return { ...order, status: 'CONFIRMED' }
  })
  const user = open()
  await user.click(await findConfirm())
  await screen.findByRole('heading', { name: 'Chưa tải được đơn gian hàng' })
  expect(screen.queryByRole('button', { name: 'Xác nhận đơn COD' })).not.toBeInTheDocument()
  vi.mocked(getStoreOrders).mockResolvedValue(page([{ ...order, status: 'CONFIRMED' }]))
  await user.click(screen.getByRole('button', { name: 'Thử lại' }))
  await findStatus('Đã xác nhận')
  expect(confirmStoreOrder).toHaveBeenCalledTimes(1)
})

test('owner without a store is directed to open-store without an orders request', async () => {
  vi.mocked(getMyStore).mockRejectedValue({ status: 404, code: 'STORE_NOT_FOUND' })
  open()
  await screen.findByRole('link', { name: 'Mở gian hàng' }, { timeout: 4000 })
  expect(getStoreOrders).not.toHaveBeenCalled()
})

test('guest returns to the protected order page after login', async () => {
  clearAccessToken()
  open('/store/orders?page=2')
  clearAccessToken()
  await screen.findByRole('heading', { name: 'Đăng nhập' }, { timeout: 4000 })
  expect(router.state.location.state.from).toBe('/store/orders?page=2')
  expect(getStoreOrders).not.toHaveBeenCalled()
})

test('missing payment metadata hides COD confirmation and explains that a refresh is needed', async () => {
  vi.mocked(getStoreOrders).mockResolvedValue(
    page([{ ...order, paymentMethod: null, paymentStatus: null }]),
  )
  open()
  await screen.findByRole('heading', { name: order.orderCode })
  expect(screen.queryByRole('button', { name: 'Xác nhận đơn COD' })).not.toBeInTheDocument()
  expect(screen.getByText(/Chưa đủ thông tin thanh toán để xác nhận đơn/)).toBeInTheDocument()
  expect(confirmStoreOrder).not.toHaveBeenCalled()
})

test('canonical cache payment change during the confirmation dialog prevents a stale COD request', async () => {
  const user = open()
  vi.mocked(window.confirm).mockImplementation(() => {
    client.setQueryData(
      ['orders', 'store', owner.id, store.id, { page: 1, status: '' }],
      page([{ ...order, paymentStatus: 'SUCCESSFUL' }]),
    )
    return true
  })
  await user.click(await findConfirm())
  await screen.findByRole('alert')
  expect(confirmStoreOrder).not.toHaveBeenCalled()
})

test('simultaneous clicks on different orders do not leave the second confirmation permanently locked', async () => {
  const bothPending = rows.map((item) => ({ ...item, status: 'PENDING_CONFIRMED' }))
  vi.mocked(getStoreOrders).mockResolvedValue(page(bothPending))
  let finish
  vi.mocked(confirmStoreOrder)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    .mockImplementationOnce(async () => {
      vi.mocked(getStoreOrders).mockResolvedValue(
        page(rows.map((item) => ({ ...item, status: 'CONFIRMED' }))),
      )
      return { ...rows[1], status: 'CONFIRMED' }
    })
  const user = open()
  const buttons = await screen.findAllByRole(
    'button',
    { name: 'Xác nhận đơn COD' },
    { timeout: 4000 },
  )
  await act(async () => {
    buttons[0].click()
    buttons[1].click()
  })
  expect(confirmStoreOrder).toHaveBeenCalledTimes(1)
  vi.mocked(getStoreOrders).mockResolvedValue(
    page([{ ...order, status: 'CONFIRMED' }, bothPending[1]]),
  )
  await act(async () => {
    finish({ ...order, status: 'CONFIRMED' })
  })
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Xác nhận đơn COD' })).toBeEnabled(),
  )
  await user.click(screen.getByRole('button', { name: 'Xác nhận đơn COD' }))
  await waitFor(() => expect(confirmStoreOrder).toHaveBeenCalledTimes(2))
  expect(confirmStoreOrder).toHaveBeenLastCalledWith({ orderId: rows[1].id })
})
