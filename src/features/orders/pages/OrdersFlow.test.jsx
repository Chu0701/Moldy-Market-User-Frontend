import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { routes } from '@/app/router/routes'

import i18n from '@/i18n'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { apiClient } from '@/services/api/client'
import { getMyOrders } from '@/services/orders/orderService'
import { getMe } from '@/services/users/userService'

vi.mock('@/services/orders/orderService', () => ({ getMyOrders: vi.fn() }))
vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))
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
vi.mock('@/services/categories/categoryService', () => ({
  getCategoryTree: vi.fn().mockResolvedValue([]),
  getCategoryById: vi.fn(),
}))

const order = {
  id: 'order-id',
  orderCode: 'ORD-00001',
  buyerId: 'current-buyer',
  status: 'PENDING_PAYMENT',
  totalAmount: 120000,
  shippingFee: 0,
  createdAt: '2026-11-19T03:00:00Z',
  receiverName: 'Recipient',
  receiverPhone: '0901234567',
  shippingAddress: 'Delivery address',
  items: [
    {
      id: 1,
      productId: 'product-id',
      productName: 'Order snapshot book',
      unitPrice: 120000,
      quantity: 1,
      imageUrl: null,
    },
  ],
}
let router
let queryClient

beforeEach(async () => {
  setAccessToken('test-access-token')
  vi.mocked(getMe)
    .mockReset()
    .mockResolvedValue({ id: 'current-buyer', roles: ['USER'] })
  vi.mocked(getMyOrders).mockReset().mockResolvedValue([order])
  vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Unexpected direct HTTP request'))
  await i18n.changeLanguage('vi')
})

afterEach(() => {
  clearAccessToken()
  router?.dispose()
  queryClient?.clear()
  vi.restoreAllMocks()
})

function renderRoute(path) {
  router = createMemoryRouter(routes, { initialEntries: [path] })
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

test('shows order snapshots and opens detail using only the buyer list', async () => {
  const user = renderRoute('/orders')
  const link = await screen.findByRole('link', { name: order.orderCode }, { timeout: 4000 })
  expect(link).toHaveAttribute('href', '/orders/order-id')
  expect(screen.getByText('Order snapshot book')).toBeInTheDocument()
  expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument()
  expect(queryClient.getQueryData(['orders', 'mine', 'current-buyer'])).toEqual([order])
  await user.click(link)
  await screen.findByRole('heading', { name: 'Chi tiết đơn ORD-00001' })
  const delivery = screen.getByRole('region', { name: 'Thông tin nhận hàng' })
  expect(within(delivery).getByText(order.receiverName)).toBeInTheDocument()
  expect(screen.getByText(order.receiverPhone)).toBeInTheDocument()
  expect(screen.getByText(order.shippingAddress)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Quay lại đơn mua' })).toHaveAttribute('href', '/orders')
  expect(apiClient.get).not.toHaveBeenCalled()
})

test('loads a direct order link and tolerates an unknown status or missing creation date', async () => {
  vi.mocked(getMyOrders).mockResolvedValue([{ ...order, status: 'FUTURE_STATUS', createdAt: null }])
  renderRoute('/orders/order-id')
  await screen.findByRole('heading', { name: 'Chi tiết đơn ORD-00001' }, { timeout: 4000 })
  expect(screen.getByText('Đang cập nhật trạng thái')).toBeInTheDocument()
  expect(screen.getByText('Chưa có thông tin ngày tạo')).toBeInTheDocument()
  expect(apiClient.get).not.toHaveBeenCalled()
})

test('recognizes the confirmed status returned by the backend', async () => {
  vi.mocked(getMyOrders).mockResolvedValue([{ ...order, status: 'CONFIRMED' }])
  renderRoute('/orders')
  await screen.findByRole('link', { name: order.orderCode }, { timeout: 4000 })
  expect(screen.getByText('Đã xác nhận')).toBeInTheDocument()
  expect(screen.queryByText('Đang cập nhật trạng thái')).not.toBeInTheDocument()
})

test('does not show a foreign order returned in an unexpected response', async () => {
  vi.mocked(getMyOrders).mockResolvedValue([{ ...order, buyerId: 'other-buyer' }])
  renderRoute('/orders/order-id')
  await screen.findByText('Không tìm thấy đơn của bạn', {}, { timeout: 4000 })
  expect(screen.queryByText(order.receiverName)).not.toBeInTheDocument()
  expect(screen.queryByText(order.shippingAddress)).not.toBeInTheDocument()
  expect(apiClient.get).not.toHaveBeenCalled()
})

test('shows empty purchase history with a real browse link', async () => {
  vi.mocked(getMyOrders).mockResolvedValue([])
  renderRoute('/orders')
  await screen.findByText('Chưa có đơn mua', {}, { timeout: 4000 })
  expect(
    within(screen.getByRole('main')).getByRole('link', { name: 'Khám phá sản phẩm' }),
  ).toHaveAttribute('href', '/products')
})

test('shows a load failure and retries the list request', async () => {
  vi.mocked(getMyOrders).mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce([order])
  const user = renderRoute('/orders')
  await screen.findByText('Chưa tải được đơn mua', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByRole('link', { name: order.orderCode })
})

test('shows forbidden access without revealing order data', async () => {
  vi.mocked(getMyOrders).mockRejectedValue({ status: 403 })
  renderRoute('/orders')
  const alert = await screen.findByRole('alert', {}, { timeout: 4000 })
  expect(alert).toHaveTextContent(i18n.t('feedback.forbiddenTitle'))
  expect(screen.queryByText('Order snapshot book')).not.toBeInTheDocument()
})

test('shows loading while the order list is pending', async () => {
  let finishOrders
  vi.mocked(getMyOrders).mockReturnValue(
    new Promise((resolve) => {
      finishOrders = resolve
    }),
  )
  renderRoute('/orders')
  await screen.findByText('Đang tải đơn mua…', {}, { timeout: 4000 })
  await act(async () => {
    finishOrders([order])
  })
  await screen.findByRole('link', { name: order.orderCode })
})

test('redirects a guest to login and preserves the order return path', async () => {
  clearAccessToken()
  renderRoute('/orders/order-id')
  await screen.findByRole('button', { name: 'Đăng nhập' }, { timeout: 4000 })
  expect(router.state.location.state.from).toBe('/orders/order-id')
  expect(getMyOrders).not.toHaveBeenCalled()
})

test('clears the buyer-specific order cache on logout', async () => {
  const user = renderRoute('/orders')
  await screen.findByRole('link', { name: order.orderCode }, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(queryClient.getQueryData(['orders', 'mine', 'current-buyer'])).toBeUndefined()
  expect(within(screen.getByRole('main')).queryByText(order.receiverName)).not.toBeInTheDocument()
})
