import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { routes } from '@/app/router/routes'

import i18n from '@/i18n'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { apiClient } from '@/services/api/client'
import { createCheckout, getCheckout } from '@/services/checkout/checkoutService'
import { getCart, removeCartItem } from '@/services/cart/cartService'
import { getProductById } from '@/services/products/productService'
import { cancelMyOrder } from '@/services/orders/cancelOrderService'
import { getMyOrders } from '@/services/orders/orderService'
import { getMe } from '@/services/users/userService'

vi.mock('@/services/orders/cancelOrderService', () => ({ cancelMyOrder: vi.fn() }))
vi.mock('@/services/checkout/checkoutService', () => ({
  createCheckout: vi.fn(),
  getCheckout: vi.fn(),
}))
vi.mock('@/services/cart/cartService', () => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}))
vi.mock('@/services/products/productService', () => ({ getProductById: vi.fn() }))
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

const profile = { id: 'checkout-buyer', fullName: 'Chu', phone: '0901234567', roles: ['USER'] }
const cart = {
  id: 'cart',
  items: [{ listingId: 'product-1', quantity: 1, totalPrice: 120000 }],
  totalItems: 1,
  subtotal: 120000,
}
const order = {
  id: 'order-1',
  orderCode: 'ORD-1',
  buyerId: profile.id,
  checkoutGroupId: 'checkout-1',
  status: 'PENDING_PAYMENT',
  totalAmount: 240000,
  shippingFee: 0,
  receiverName: 'Chu',
  receiverPhone: profile.phone,
  shippingAddress: 'Address',
  items: [
    {
      id: 1,
      productId: 'product-1',
      productName: 'Snapshot book',
      quantity: 1,
      unitPrice: 240000,
      imageUrl: null,
    },
  ],
}
const qr = 'https://vietqr.app/img?amount=240000&des=MM12345678'
const bank = () => ({
  id: 'checkout-1',
  totalAmount: 240000,
  expiredAt: new Date(Date.now() + 600000).toISOString(),
  status: 'PENDING_PAYMENT',
  paymentResponse: {
    id: 'payment-1',
    method: 'ONLINE_BANKING',
    paymentStatus: 'PENDING',
    qrBankUrl: qr,
    checkoutGroupId: 'checkout-1',
  },
  orders: [order],
})
const cod = () => ({
  ...bank(),
  status: 'PAY_ON_DELIVERY',
  expiredAt: null,
  paymentResponse: { ...bank().paymentResponse, method: 'COD', qrBankUrl: null },
  orders: [{ ...order, status: 'PENDING_CONFIRMED' }],
})
const paid = () => ({
  ...bank(),
  status: 'PAID',
  paymentResponse: { ...bank().paymentResponse, paymentStatus: 'SUCCESSFUL' },
  orders: [{ ...order, status: 'CONFIRMED' }],
})
let router
let client

beforeEach(async () => {
  setAccessToken('checkout-token')
  vi.mocked(cancelMyOrder)
    .mockReset()
    .mockResolvedValue({ ...order, status: 'CANCELLED' })
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(getMe).mockReset().mockResolvedValue(profile)
  vi.mocked(getCart).mockReset().mockResolvedValue(cart)
  vi.mocked(getProductById)
    .mockReset()
    .mockResolvedValue({ id: 'product-1', title: 'Cart book', status: 'ACTIVE', price: 120000 })
  vi.mocked(getMyOrders).mockReset().mockResolvedValue([order])
  vi.mocked(createCheckout).mockReset().mockResolvedValue(cod())
  vi.mocked(getCheckout).mockReset().mockResolvedValue(cod())
  vi.mocked(removeCartItem).mockReset()
  vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Unexpected direct HTTP'))
  vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Unexpected direct HTTP'))
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
    defaultOptions: { queries: { retry: false, staleTime: 30000 }, mutations: { retry: false } },
  })
  client.setQueryData(['users', 'me'], profile)
  client.setQueryData(['cart', profile.id], cart)
  router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}
test('confirming one cancellation cancels the shared checkout, refreshes server data and preserves cart contents', async () => {
  const initial = { ...bank(), orders: [order, { ...order, id: 'order-2' }] }
  const cancelled = {
    ...initial,
    status: 'CANCELLED',
    paymentResponse: { ...initial.paymentResponse, paymentStatus: 'FAILED' },
    orders: initial.orders.map((item) => ({ ...item, status: 'CANCELLED' })),
  }
  vi.mocked(getCheckout).mockResolvedValue(initial)
  let finish
  vi.mocked(cancelMyOrder).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open('/checkout/checkout-1')
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const button = await screen.findByRole(
    'button',
    { name: 'Hủy checkout', exact: true },
    { timeout: 4000 },
  )
  await user.dblClick(button)
  expect(window.confirm).toHaveBeenCalledTimes(1)
  expect(window.confirm.mock.calls[0][0]).toMatch(/2/)
  expect(cancelMyOrder).toHaveBeenCalledExactlyOnceWith({ orderId: 'order-1' })
  expect(screen.queryByAltText('Mã QR chuyển khoản của checkout')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Đang hủy…' })).toBeDisabled()
  vi.mocked(getCheckout).mockResolvedValue(cancelled)
  await act(async () => {
    finish({ ...order, status: 'CANCELLED' })
  })
  await screen.findByRole('heading', { name: 'Checkout đã hủy' })
  expect(screen.getAllByText('Đã hủy')).toHaveLength(2)
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart', profile.id], exact: true })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders', 'mine', profile.id], exact: true })
  expect(client.getQueryData(['cart', profile.id]).items).toHaveLength(1)
  expect(removeCartItem).not.toHaveBeenCalled()
  expect(createCheckout).not.toHaveBeenCalled()
})

test('declining confirmation sends no cancellation and keeps the QR available', async () => {
  vi.mocked(getCheckout).mockResolvedValue(bank())
  vi.mocked(window.confirm).mockReturnValue(false)
  const user = open('/checkout/checkout-1')
  await user.click(
    await screen.findByRole('button', { name: 'Hủy checkout', exact: true }, { timeout: 4000 }),
  )
  expect(cancelMyOrder).not.toHaveBeenCalled()
  expect(screen.getByAltText('Mã QR chuyển khoản của checkout')).toBeInTheDocument()
})

test.each([
  cod,
  paid,
  () => ({
    ...bank(),
    paymentResponse: { ...bank().paymentResponse, paymentStatus: 'PROCESSING' },
  }),
])('does not offer checkout cancellation for COD, paid or processing payment', async (make) => {
  vi.mocked(getCheckout).mockResolvedValue(make())
  open('/checkout/checkout-1')
  await screen.findByRole('heading', { name: 'Thanh toán đơn mua' }, { timeout: 4000 })
  expect(
    screen.queryByRole('button', { name: 'Hủy checkout', exact: true }),
  ).not.toBeInTheDocument()
  expect(cancelMyOrder).not.toHaveBeenCalled()
})

test('payment winning the race refreshes paid state and never pretends cancellation succeeded', async () => {
  vi.mocked(getCheckout).mockResolvedValue(bank())
  vi.mocked(cancelMyOrder).mockImplementation(async () => {
    vi.mocked(getCheckout).mockResolvedValue(paid())
    throw { status: 400, code: 'INVALID_ORDER_STATE' }
  })
  const user = open('/checkout/checkout-1')
  await user.click(
    await screen.findByRole('button', { name: 'Hủy checkout', exact: true }, { timeout: 4000 }),
  )
  await screen.findByRole('heading', { name: 'Đã thanh toán' })
  expect(screen.getByRole('alert')).toHaveTextContent('Trạng thái đã thay đổi')
  expect(cancelMyOrder).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('heading', { name: 'Checkout đã hủy' })).not.toBeInTheDocument()
})

test('an uncertain cancellation is not retried and hides stale QR until a successful manual refresh', async () => {
  vi.mocked(getCheckout).mockResolvedValue(bank())
  vi.mocked(cancelMyOrder).mockRejectedValue({ code: 'FE_NETWORK_ERROR' })
  const user = open('/checkout/checkout-1')
  await user.click(
    await screen.findByRole('button', { name: 'Hủy checkout', exact: true }, { timeout: 4000 }),
  )
  await screen.findByText(/Chưa xác định kết quả hủy/)
  expect(screen.queryByAltText('Mã QR chuyển khoản của checkout')).not.toBeInTheDocument()
  expect(cancelMyOrder).toHaveBeenCalledTimes(1)
  await user.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }))
  await screen.findByAltText('Mã QR chuyển khoản của checkout')
  expect(cancelMyOrder).toHaveBeenCalledTimes(1)
})

test('logout while cancellation is pending does not invalidate or restore the cleared session cache', async () => {
  vi.mocked(getCheckout).mockResolvedValue(bank())
  let finish
  vi.mocked(cancelMyOrder).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open('/checkout/checkout-1')
  await user.click(
    await screen.findByRole('button', { name: 'Hủy checkout', exact: true }, { timeout: 4000 }),
  )
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  await act(async () => {
    clearAccessToken()
    client.clear()
  })
  await screen.findByRole('heading', { name: 'Đăng nhập' })
  invalidate.mockClear()
  await act(async () => {
    finish({ ...order, status: 'CANCELLED' })
  })
  expect(invalidate).not.toHaveBeenCalled()
  expect(client.getQueryData(['checkout', profile.id, 'checkout-1'])).toBeUndefined()
})

test('successful POST followed by failed GET keeps QR hidden until the canonical cancelled checkout is loaded', async () => {
  vi.mocked(getCheckout).mockResolvedValue(bank())
  vi.mocked(cancelMyOrder).mockImplementation(async () => {
    vi.mocked(getCheckout).mockRejectedValue({ status: 500 })
    return { ...order, status: 'CANCELLED' }
  })
  const user = open('/checkout/checkout-1')
  await user.click(
    await screen.findByRole('button', { name: 'Hủy checkout', exact: true }, { timeout: 4000 }),
  )
  await screen.findByText(/Chưa cập nhật được trạng thái/)
  expect(screen.queryByAltText('Mã QR chuyển khoản của checkout')).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Checkout đã hủy' })).not.toBeInTheDocument()
  const cancelled = {
    ...bank(),
    status: 'CANCELLED',
    paymentResponse: { ...bank().paymentResponse, paymentStatus: 'FAILED' },
    orders: [{ ...order, status: 'CANCELLED' }],
  }
  vi.mocked(getCheckout).mockResolvedValue(cancelled)
  await user.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }))
  await screen.findByRole('heading', { name: 'Checkout đã hủy' })
  expect(cancelMyOrder).toHaveBeenCalledTimes(1)
})

test('checks the current cached snapshot again after the confirmation dialog', async () => {
  vi.mocked(getCheckout).mockResolvedValue(bank())
  vi.mocked(window.confirm).mockImplementation(() => {
    client.setQueryData(['checkout', profile.id, 'checkout-1'], paid())
    vi.mocked(getCheckout).mockResolvedValue(paid())
    return true
  })
  const user = open('/checkout/checkout-1')
  await user.click(
    await screen.findByRole('button', { name: 'Hủy checkout', exact: true }, { timeout: 4000 }),
  )
  await screen.findByRole('heading', { name: 'Đã thanh toán' })
  expect(cancelMyOrder).not.toHaveBeenCalled()
})
