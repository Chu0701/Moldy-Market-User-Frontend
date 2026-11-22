import { act, render, screen, waitFor } from '@testing-library/react'
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
import { getMyOrders } from '@/services/orders/orderService'
import { getMe } from '@/services/users/userService'

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
async function fill(user) {
  await user.type(
    await screen.findByLabelText('Địa chỉ nhận hàng', {}, { timeout: 4000 }),
    'Delivery address',
  )
  await waitFor(() => expect(screen.getByLabelText('Họ tên người nhận')).toHaveValue('Chu'))
}

test('submits COD once, opens its server checkout and keeps the cart intact', async () => {
  const user = open('/checkout?productId=product-1')
  await fill(user)
  await user.dblClick(screen.getByRole('button', { name: 'Đặt hàng' }))
  await screen.findByRole('heading', { name: 'Đã tạo đơn COD' }, { timeout: 4000 })
  expect(createCheckout).toHaveBeenCalledExactlyOnceWith({
    productIds: ['product-1'],
    receiverName: 'Chu',
    phoneNumber: profile.phone,
    shippingAddress: 'Delivery address',
    method: 'COD',
    note: '',
  })
  expect(router.state.location.pathname).toBe('/checkout/checkout-1')
  expect(client.getQueryData(['cart', profile.id]).items).toEqual(cart.items)
  expect(removeCartItem).not.toHaveBeenCalled()
  expect(
    screen.queryByRole('img', { name: 'Mã QR chuyển khoản của checkout' }),
  ).not.toBeInTheDocument()
})
test('uses server amount and exact QR on a bookmarked bank checkout without creating again', async () => {
  vi.mocked(getCheckout).mockResolvedValue(bank())
  open('/checkout/checkout-1')
  const image = await screen.findByRole(
    'img',
    { name: 'Mã QR chuyển khoản của checkout' },
    { timeout: 4000 },
  )
  expect(image).toHaveAttribute('src', qr)
  expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
  expect(screen.getByRole('heading', { name: 'Tổng thanh toán' }).parentElement).toHaveTextContent(
    '240.000',
  )
  expect(createCheckout).not.toHaveBeenCalled()
})
test('only a new paid server response shows success and refreshes server-owned cart data', async () => {
  vi.mocked(getCheckout).mockResolvedValueOnce(bank()).mockResolvedValue(paid())
  const user = open('/checkout/checkout-1')
  await screen.findByRole('heading', { name: 'Chờ chuyển khoản' }, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }))
  await screen.findByRole('heading', { name: 'Đã thanh toán' })
  expect(
    screen.queryByRole('img', { name: 'Mã QR chuyển khoản của checkout' }),
  ).not.toBeInTheDocument()
  expect(client.getQueryState(['cart', profile.id]).isInvalidated).toBe(true)
  expect(client.getQueryData(['cart', profile.id]).items).toEqual(cart.items)
  expect(removeCartItem).not.toHaveBeenCalled()
  vi.mocked(getCart).mockResolvedValue({ ...cart, items: [], totalItems: 0, subtotal: 0 })
  await act(async () => {
    await router.navigate('/cart')
  })
  await waitFor(() => expect(client.getQueryData(['cart', profile.id]).items).toEqual([]))
})
test('the local clock reaching zero hides the QR without inventing an expired server state', async () => {
  vi.mocked(getCheckout).mockResolvedValue({ ...bank(), expiredAt: '2020-01-01T00:00:00Z' })
  open('/checkout/checkout-1')
  await screen.findByRole('heading', { name: 'Chờ chuyển khoản' }, { timeout: 4000 })
  expect(screen.getByText(/Đồng hồ đã qua hạn/)).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Đã hết hạn thanh toán' })).not.toBeInTheDocument()
  expect(
    screen.queryByRole('img', { name: 'Mã QR chuyển khoản của checkout' }),
  ).not.toBeInTheDocument()
})
test('an expired checkout keeps the cart and shows the server terminal state', async () => {
  vi.mocked(getCheckout).mockResolvedValue({
    ...bank(),
    status: 'EXPIRED',
    paymentResponse: { ...bank().paymentResponse, paymentStatus: 'FAILED' },
  })
  open('/checkout/checkout-1')
  await screen.findByRole('heading', { name: 'Đã hết hạn thanh toán' }, { timeout: 4000 })
  expect(client.getQueryData(['cart', profile.id]).items).toEqual(cart.items)
  expect(removeCartItem).not.toHaveBeenCalled()
})
test('COD waiting for the store is not displayed as a paid order', async () => {
  open('/checkout/checkout-1')
  await screen.findByRole('heading', { name: 'Đã tạo đơn COD' }, { timeout: 4000 })
  expect(screen.getByText('Chờ gian hàng xác nhận')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Đã thanh toán' })).not.toBeInTheDocument()
})
test('forbidden refresh hides cached private checkout content', async () => {
  vi.mocked(getCheckout).mockRejectedValue({ status: 403 })
  open('/checkout/checkout-1')
  act(() => client.setQueryData(['checkout', profile.id, 'checkout-1'], bank()))
  await screen.findByRole('heading', { name: 'Không có quyền xem nội dung' }, { timeout: 4000 })
  expect(screen.queryByText('Snapshot book')).not.toBeInTheDocument()
})
test('an initial GET failure can be retried without posting another checkout', async () => {
  vi.mocked(getCheckout).mockRejectedValueOnce({ status: 500 }).mockResolvedValue(cod())
  const user = open('/checkout/checkout-1')
  await screen.findByText('Chưa tải được checkout', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByRole('heading', { name: 'Đã tạo đơn COD' })
  expect(createCheckout).not.toHaveBeenCalled()
})
test('a refresh failure preserves order snapshots but hides a stale pending QR', async () => {
  vi.mocked(getCheckout)
    .mockResolvedValueOnce(bank())
    .mockRejectedValueOnce({ status: 500 })
    .mockResolvedValue(paid())
  const user = open('/checkout/checkout-1')
  await screen.findByRole('heading', { name: 'Chờ chuyển khoản' }, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }))
  await screen.findByText(/Chưa cập nhật được trạng thái/)
  expect(screen.getByText('Snapshot book')).toBeInTheDocument()
  expect(
    screen.queryByRole('img', { name: 'Mã QR chuyển khoản của checkout' }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }))
  await screen.findByRole('heading', { name: 'Đã thanh toán' })
})
test('an ambiguous POST result is not retried and points to existing orders', async () => {
  vi.mocked(createCheckout).mockRejectedValue({ status: null })
  const user = open('/checkout?productId=product-1')
  await fill(user)
  await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  await screen.findByText(/Chưa xác định được đơn đã tạo hay chưa/)
  expect(createCheckout).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeDisabled()
  expect(screen.getByRole('link', { name: 'Kiểm tra đơn mua' })).toHaveAttribute('href', '/orders')
  expect(removeCartItem).not.toHaveBeenCalled()
})
test('a reserved-product error is translated instead of deleting or silently resubmitting', async () => {
  vi.mocked(createCheckout).mockRejectedValue({ status: 409, code: 'PRODUCT_RESERVED' })
  const user = open('/checkout?productId=product-1')
  await fill(user)
  await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  await screen.findByText(/Có sản phẩm đang được giữ/)
  expect(createCheckout).toHaveBeenCalledTimes(1)
  expect(removeCartItem).not.toHaveBeenCalled()
})
test('logout while creating does not navigate or restore checkout cache after the response', async () => {
  let finish
  vi.mocked(createCheckout).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open('/checkout?productId=product-1')
  await fill(user)
  await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  await waitFor(() => expect(createCheckout).toHaveBeenCalledTimes(1))
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await screen.findByRole('heading', { name: 'Đăng nhập' }, { timeout: 4000 })
  await act(async () => {
    finish(cod())
  })
  expect(router.state.location.pathname).toBe('/login')
  expect(client.getQueryData(['checkout', profile.id, 'checkout-1'])).toBeUndefined()
  expect(getCheckout).not.toHaveBeenCalled()
})
test('a guest is sent to login with the checkout return path', async () => {
  clearAccessToken()
  open('/checkout/checkout-1')
  await screen.findByRole('heading', { name: 'Đăng nhập' }, { timeout: 4000 })
  expect(getCheckout).not.toHaveBeenCalled()
  expect(router.state.location.state.from).toBe('/checkout/checkout-1')
})
test('leaving the form while POST is pending does not force navigation when it finishes', async () => {
  let finish
  vi.mocked(createCheckout).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = open('/checkout?productId=product-1')
  await fill(user)
  await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  await waitFor(() => expect(createCheckout).toHaveBeenCalledTimes(1))
  await user.click(screen.getByRole('link', { name: 'Giỏ hàng' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/cart'))
  await act(async () => {
    finish(cod())
  })
  expect(router.state.location.pathname).toBe('/cart')
  expect(getCheckout).not.toHaveBeenCalled()
})
test('an unpaid buyer order exposes a recovery link to the existing checkout', async () => {
  const user = open('/orders/order-1')
  const link = await screen.findByRole('link', { name: 'Tiếp tục thanh toán' }, { timeout: 4000 })
  expect(link).toHaveAttribute('href', '/checkout/checkout-1')
  await user.click(link)
  await screen.findByRole('heading', { name: 'Đã tạo đơn COD' })
  expect(createCheckout).not.toHaveBeenCalled()
})
test('delivery validation blocks POST before a complete address is entered', async () => {
  const user = open('/checkout?productId=product-1')
  await screen.findByLabelText('Địa chỉ nhận hàng', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Đặt hàng' }))
  await screen.findByText('Vui lòng nhập thông tin này.')
  expect(createCheckout).not.toHaveBeenCalled()
})
