import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { RequireAuth } from '@/app/router/RequireAuth'
import { routes } from '@/app/router/routes'

vi.mock('@/services/chat/chatService', () => ({
  getConversations: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/services/chat/chatConnection', () => ({
  connectChat: vi.fn(() => ({ close: vi.fn(), sendText: vi.fn() })),
}))
import i18n from '@/i18n'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { waitForPendingRefresh } from '@/services/api/authRefreshInterceptor'
import { apiClient } from '@/services/api/client'
import {
  login,
  logout,
  registerAccount,
  resendVerification,
  verifyEmail,
} from '@/services/auth/authService'
import { getCategoryById, getCategoryTree } from '@/services/categories/categoryService'
import { addCartItem, getCart, removeCartItem } from '@/services/cart/cartService'
import {
  changeProductStatus,
  createStoreProduct,
  deleteProduct,
  getMyProducts,
  getMyStoreProducts,
  getStoreProducts,
  getProductById,
  searchProducts,
  updateProduct,
} from '@/services/products/productService'
import {
  addStoreStaff,
  createStore,
  getMyStore,
  getMyStaffProfile,
  getPublicStore,
  getStoreStaff,
  removeStoreStaff,
  updateMyStore,
  updateStoreStaffPermissions,
} from '@/services/stores/storeService'
import { changePassword, getMe, updateMyProfile } from '@/services/users/userService'
import { getMyAppraiserCommissions } from '@/services/commission/commissionService'

vi.mock('@/services/api/authRefreshInterceptor', () => ({ waitForPendingRefresh: vi.fn() }))
vi.mock('@/services/cart/cartService', () => ({
  addCartItem: vi.fn(),
  getCart: vi.fn(),
  removeCartItem: vi.fn(),
}))
vi.mock('@/services/auth/authService', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  registerAccount: vi.fn(),
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
}))
vi.mock('@/services/users/userService', () => ({
  changePassword: vi.fn(),
  getMe: vi.fn(),
  updateMyProfile: vi.fn(),
}))
vi.mock('@/services/stores/storeService', () => ({
  addStoreStaff: vi.fn(),
  createStore: vi.fn(),
  getMyStore: vi.fn(),
  getMyStaffProfile: vi.fn(),
  getPublicStore: vi.fn(),
  getStoreStaff: vi.fn(),
  removeStoreStaff: vi.fn(),
  updateMyStore: vi.fn(),
  updateStoreStaffPermissions: vi.fn(),
}))
vi.mock('@/services/categories/categoryService', () => ({
  getCategoryById: vi.fn(),
  getCategoryTree: vi.fn(),
}))
vi.mock('@/services/products/productService', () => ({
  changeProductStatus: vi.fn(),
  createStoreProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getMyProducts: vi.fn(),
  getMyStoreProducts: vi.fn(),
  getStoreProducts: vi.fn(),
  getProductById: vi.fn(),
  searchProducts: vi.fn(),
  updateProduct: vi.fn(),
}))
vi.mock('@/services/commission/commissionService', () => ({
  getMyAppraiserCommission: vi.fn(),
  getMyAppraiserCommissions: vi.fn(),
}))

let router
let queryClient

beforeEach(() => {
  vi.mocked(addCartItem).mockReset()
  vi.mocked(getCart).mockReset()
  vi.mocked(removeCartItem).mockReset()
  vi.mocked(waitForPendingRefresh).mockReset().mockResolvedValue(undefined)
  vi.mocked(login).mockReset()
  vi.mocked(logout).mockReset()
  vi.mocked(registerAccount).mockReset()
  vi.mocked(resendVerification).mockReset()
  vi.mocked(verifyEmail).mockReset()
  vi.mocked(changePassword).mockReset()
  vi.mocked(updateMyProfile).mockReset()
  vi.mocked(getMe)
    .mockReset()
    .mockResolvedValue({ id: 'test-user', roles: ['USER'] })
  vi.mocked(getProductById).mockReset()
  vi.mocked(changeProductStatus).mockReset()
  vi.mocked(deleteProduct).mockReset()
  vi.mocked(getMyProducts).mockReset()
  vi.mocked(getMyStoreProducts).mockReset()
  vi.mocked(getStoreProducts).mockReset()
  vi.mocked(updateProduct).mockReset()
  vi.mocked(createStoreProduct).mockReset()
  vi.mocked(createStore).mockReset()
  vi.mocked(addStoreStaff).mockReset()
  vi.mocked(getMyStore).mockReset()
  vi.mocked(getMyStaffProfile)
    .mockReset()
    .mockImplementation(async () => {
      const profile = await getMe()
      return {
        userId: profile.id,
        storeId: profile.storeId,
        permissions: profile.permissions ?? [],
      }
    })
  vi.mocked(getPublicStore).mockReset()
  vi.mocked(getStoreStaff).mockReset()
  vi.mocked(removeStoreStaff).mockReset()
  vi.mocked(updateMyStore).mockReset()
  vi.mocked(updateStoreStaffPermissions).mockReset()
  vi.mocked(getCategoryById).mockReset()
  vi.mocked(getCategoryTree).mockReset().mockResolvedValue([])
  vi.mocked(searchProducts).mockReset().mockResolvedValue({ items: [] })
  vi.mocked(getMyAppraiserCommissions).mockReset().mockResolvedValue([])
})

function renderRoute(path, routeConfig = routes) {
  router = createMemoryRouter(routeConfig, { initialEntries: [path] })
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

afterEach(async () => {
  clearAccessToken()
  router?.dispose()
  queryClient?.clear()
  await i18n.changeLanguage('vi')
  document.documentElement.lang = 'vi'
})

const loginCredentials = { email: 'chu@example.com', password: ' test password ' }

async function submitLogin(user) {
  const email = await screen.findByRole('textbox', { name: 'Email' })
  await user.type(email, loginCredentials.email)
  await user.type(screen.getByLabelText('Mật khẩu'), loginCredentials.password)
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
}

const routesWithPrivatePage = [
  ...routes,
  {
    Component: RequireAuth,
    children: [{ path: '/test-private', element: <h1>Test private page</h1> }],
  },
]

describe('user app routing', () => {
  const emptyCart = { id: null, items: [], subtotal: 0, totalItems: 0 }
  const cartProduct = {
    id: 'cart-product',
    title: 'Cart product',
    status: 'ACTIVE',
    price: 300000,
    sellerId: 'other-seller',
    condition: 'USED',
    images: [],
  }
  const filledCart = {
    id: 'cart-id',
    totalItems: 1,
    subtotal: 120000,
    items: [
      {
        listingId: cartProduct.id,
        sellerId: 'other-seller',
        quantity: 1,
        priceAtAddTime: 120000,
        totalPrice: 120000,
      },
    ],
  }

  describe('appraiser workspace access', () => {
    test('blocks a regular user from appraiser work pages', async () => {
      setAccessToken('test-access-token')

      renderRoute('/appraiser/assignments')

      expect(await screen.findByText('Không có quyền xem nội dung')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Công việc được giao' })).not.toBeInTheDocument()
    })

    test('shows the empty state for the commission list under the appraiser route', async () => {
      setAccessToken('test-access-token')
      vi.mocked(getMe).mockResolvedValue({ id: 'appraiser-user', roles: ['USER', 'APPRAISER'] })

      renderRoute('/appraiser/commissions')

      expect(await screen.findByRole('heading', { name: 'Hoa hồng' })).toBeInTheDocument()
      expect(await screen.findByText('Chưa có hoa hồng')).toBeInTheDocument()
      expect(getMyAppraiserCommissions).toHaveBeenCalledOnce()
    })
  })

  describe('preparing checkout from cart', () => {
    test('carries only selected products to the delivery form and sends no order request', async () => {
      setAccessToken('test-access-token')
      const otherProduct = { ...cartProduct, id: 'other-product', title: 'Other product' }
      vi.mocked(getCart).mockResolvedValue({
        ...filledCart,
        totalItems: 2,
        subtotal: 240000,
        items: [...filledCart.items, { ...filledCart.items[0], listingId: otherProduct.id }],
      })
      vi.mocked(getProductById).mockImplementation(async ({ productId }) =>
        productId === cartProduct.id ? cartProduct : otherProduct,
      )
      const post = vi
        .spyOn(apiClient, 'post')
        .mockRejectedValue(new Error('Unexpected order request'))
      try {
        const user = renderRoute('/cart')
        expect(
          await screen.findByRole('button', { name: 'Tiếp tục đặt hàng' }, { timeout: 4000 }),
        ).toBeDisabled()
        await user.click(
          await screen.findByRole('checkbox', { name: 'Chọn sản phẩm: Cart product' }),
        )
        const next = screen.getByRole('link', { name: 'Tiếp tục đặt hàng' })
        expect(new URL(next.href).searchParams.getAll('productId')).toEqual([cartProduct.id])
        await user.click(next)
        await waitFor(
          () => {
            expect(router.state.location.pathname).toBe('/checkout')
            expect(router.state.navigation.state).toBe('idle')
          },
          { timeout: 4000 },
        )
        await screen.findByRole('heading', { name: 'Thông tin đặt hàng' })
        const main = screen.getByRole('main')
        expect(within(main).getByRole('link', { name: cartProduct.title })).toBeInTheDocument()
        expect(within(main).getByRole('link', { name: cartProduct.title })).toHaveAttribute(
          'href',
          '/products/' + cartProduct.id,
        )
        expect(screen.getByLabelText('Địa chỉ nhận hàng').tagName).toBe('TEXTAREA')
        expect(
          within(main).queryByRole('link', { name: otherProduct.title }),
        ).not.toBeInTheDocument()
        await user.type(screen.getByLabelText('Họ tên người nhận'), 'Chu')
        await user.type(screen.getByLabelText('Số điện thoại người nhận'), '123')
        await user.tab()
        expect(await screen.findByRole('alert')).toHaveTextContent('số điện thoại Việt Nam hợp lệ')
        await user.click(screen.getByRole('radio', { name: 'Chuyển khoản ngân hàng' }))
        expect(screen.getByRole('radio', { name: 'Chuyển khoản ngân hàng' })).toBeChecked()
        expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeEnabled()
        await user.click(screen.getByLabelText('Họ tên người nhận'))
        await user.keyboard('{Enter}')
        expect(post).not.toHaveBeenCalled()
        expect(addCartItem).not.toHaveBeenCalled()
        expect(removeCartItem).not.toHaveBeenCalled()
      } finally {
        post.mockRestore()
      }
    })

    test('opens a bookmarked selection using current cart data', async () => {
      setAccessToken('test-access-token')
      vi.mocked(getCart).mockResolvedValue(filledCart)
      vi.mocked(getProductById).mockResolvedValue(cartProduct)
      renderRoute('/checkout?productId=cart-product')
      expect(await screen.findByLabelText('Địa chỉ nhận hàng', {}, { timeout: 4000 })).toHaveValue(
        '',
      )
      expect(screen.getByRole('link', { name: cartProduct.title })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeEnabled()
    })

    test.each([
      '/checkout',
      '/checkout?productId=removed-product',
      '/checkout?productId=cart-product&productId=cart-product',
    ])('asks to select again for a missing, stale or duplicate selection: %s', async (path) => {
      setAccessToken('test-access-token')
      vi.mocked(getCart).mockResolvedValue(filledCart)
      renderRoute(path)
      await screen.findByText('Chọn lại sản phẩm', {}, { timeout: 4000 })
      expect(screen.queryByLabelText('Họ tên người nhận')).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Quay lại giỏ hàng' })).toHaveAttribute(
        'href',
        '/cart',
      )
    })

    test('does not select a sold product when selecting all', async () => {
      setAccessToken('test-access-token')
      vi.mocked(getCart).mockResolvedValue(filledCart)
      vi.mocked(getProductById).mockResolvedValue({ ...cartProduct, status: 'SOLD' })
      renderRoute('/cart')
      const checkbox = await screen.findByRole(
        'checkbox',
        { name: 'Chọn sản phẩm: Cart product' },
        { timeout: 4000 },
      )
      expect(checkbox).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Chọn tất cả (tối đa 20)' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Tiếp tục đặt hàng' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Xóa khỏi giỏ' })).toBeEnabled()
    })

    test('limits selection to twenty and lets the buyer deselect at the limit', async () => {
      setAccessToken('test-access-token')
      const items = Array.from({ length: 21 }, (_, index) => ({
        ...filledCart.items[0],
        listingId: 'selected-product-' + index,
      }))
      vi.mocked(getCart).mockResolvedValue({
        ...filledCart,
        items,
        totalItems: 21,
        subtotal: 2520000,
      })
      vi.mocked(getProductById).mockImplementation(async ({ productId }) => ({
        ...cartProduct,
        id: productId,
        title: productId,
      }))
      const user = renderRoute('/cart')
      await screen.findByRole(
        'checkbox',
        { name: 'Chọn sản phẩm: selected-product-20' },
        { timeout: 4000 },
      )
      await user.click(screen.getByRole('button', { name: 'Chọn tất cả (tối đa 20)' }))
      const next = screen.getByRole('link', { name: 'Tiếp tục đặt hàng' })
      expect(new URL(next.href).searchParams.getAll('productId')).toHaveLength(20)
      const last = screen.getByRole('checkbox', { name: 'Chọn sản phẩm: selected-product-20' })
      expect(last).toBeDisabled()
      await user.click(screen.getByRole('checkbox', { name: 'Chọn sản phẩm: selected-product-0' }))
      expect(last).toBeEnabled()
      await user.click(last)
      expect(
        new URL(screen.getByRole('link', { name: 'Tiếp tục đặt hàng' }).href).searchParams.getAll(
          'productId',
        ),
      ).toHaveLength(20)
    })
  })

  test('adds a product, displays the server cart price and removes the final item', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getProductById).mockResolvedValue(cartProduct)
    vi.mocked(addCartItem).mockResolvedValue(filledCart)
    vi.mocked(getCart).mockResolvedValue(filledCart)
    vi.mocked(removeCartItem).mockResolvedValue(emptyCart)
    const user = renderRoute('/products/cart-product')

    await waitFor(() => expect(router.state.initialized).toBe(true), { timeout: 4000 })
    await user.click(await screen.findByRole('button', { name: 'Thêm vào giỏ' }))
    expect(addCartItem).toHaveBeenCalledExactlyOnceWith(
      { productId: cartProduct.id },
      expect.any(Object),
    )
    const added = await screen.findByText('Đã thêm vào giỏ.', { exact: false })
    await user.click(within(added).getByRole('link', { name: 'Giỏ hàng' }))
    const main = screen.getByRole('main')
    await within(main).findByRole('link', { name: cartProduct.title })
    expect(within(main).getByText('Tạm tính cho 1 sản phẩm')).toBeInTheDocument()
    expect(within(main).getAllByText(/120[.,]000/)).toHaveLength(2)
    expect(within(main).queryByText(/300[.,]000/)).not.toBeInTheDocument()
    await user.click(within(main).getByRole('button', { name: 'Xóa khỏi giỏ' }))
    await within(main).findByText('Giỏ hàng đang trống')
    expect(removeCartItem).toHaveBeenCalledExactlyOnceWith(
      { productId: cartProduct.id },
      expect.any(Object),
    )
  })

  test('redirects a guest cart request to login without loading cart data', async () => {
    renderRoute('/cart')
    await screen.findByRole('button', { name: 'Đăng nhập' })
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state.from).toBe('/cart')
    expect(getCart).not.toHaveBeenCalled()
  })

  test('keeps the product return path when a guest wants to add to cart', async () => {
    vi.mocked(getProductById).mockResolvedValue(cartProduct)
    const user = renderRoute('/products/cart-product')
    await user.click(await screen.findByRole('link', { name: 'Thêm vào giỏ' }))
    await screen.findByRole('button', { name: 'Đăng nhập' })
    expect(router.state.location.state.from).toBe('/products/cart-product')
    expect(addCartItem).not.toHaveBeenCalled()
  })

  test.each([
    { sellerId: 'test-user', storeId: null },
    { sellerId: 'other-seller', storeId: 'linked-store' },
  ])('hides add to cart for an owned or linked store product: %j', async (ownership) => {
    setAccessToken('test-access-token')
    vi.mocked(getMe).mockResolvedValue({
      id: 'test-user',
      roles: ['USER'],
      storeId: 'linked-store',
    })
    vi.mocked(getProductById).mockResolvedValue({ ...cartProduct, ...ownership })
    renderRoute('/products/cart-product')
    await screen.findByRole('heading', { name: cartProduct.title })
    await waitFor(() => expect(getMe).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Thêm vào giỏ' })).not.toBeInTheDocument()
  })

  test('shows the backend membership rejection when local profile cannot determine it', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getProductById).mockResolvedValue(cartProduct)
    vi.mocked(addCartItem).mockRejectedValue({ status: 403, code: 'CART_OWN_PRODUCT' })
    const user = renderRoute('/products/cart-product')
    await user.click(await screen.findByRole('button', { name: 'Thêm vào giỏ' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Bạn không thể thêm sản phẩm của mình hoặc gian hàng mình làm việc vào giỏ.',
    )
  })

  test('allows removing a cart item whose product is no longer accessible', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getCart).mockResolvedValue(filledCart)
    vi.mocked(getProductById).mockRejectedValue({ status: 404 })
    vi.mocked(removeCartItem).mockResolvedValue(emptyCart)
    const user = renderRoute('/cart')
    await screen.findByText('Thông tin sản phẩm hiện không khả dụng.')
    await user.click(screen.getByRole('button', { name: 'Xóa khỏi giỏ' }))
    await screen.findByText('Giỏ hàng đang trống')
  })

  test('does not restore private cart cache when an add request finishes after logout', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getProductById).mockResolvedValue(cartProduct)
    let finishAdd
    vi.mocked(addCartItem).mockReturnValue(
      new Promise((resolve) => {
        finishAdd = resolve
      }),
    )
    vi.mocked(logout).mockResolvedValue(undefined)
    const user = renderRoute('/products/cart-product')
    await user.click(await screen.findByRole('button', { name: 'Thêm vào giỏ' }))
    await waitFor(() => expect(addCartItem).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    await screen.findByRole('button', { name: 'Đăng nhập' })
    await act(async () => {
      finishAdd(filledCart)
    })
    expect(queryClient.getQueryData(['cart', 'test-user'])).toBeUndefined()
  })

  const product = {
    id: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
    title: 'Test product',
    price: 250000,
    condition: 'LIKE_NEW',
    images: [],
  }

  const store = {
    id: 'a8098c1a-f86e-11da-bd1a-00112444be1f',
    ownerId: 'store-owner',
    name: 'Test store',
    description: 'Test store description',
  }

  test.each([
    { role: 'OWNER', isStaff: false },
    { role: 'STAFF', isStaff: true },
  ])('creates a listing for a store as $role', { timeout: 15000 }, async ({ role, isStaff }) => {
    setAccessToken('test-access-token')
    vi.mocked(getMe).mockResolvedValue({
      id: 'test-user',
      roles: ['USER', role],
      permissions: isStaff ? ['STORE_WORKSPACE_ACCESS', 'PRODUCT_CREATE'] : ['PRODUCT_CREATE'],
      storeId: store.id,
    })
    if (!isStaff) vi.mocked(getMyStore).mockResolvedValue({ ...store, status: 'ACTIVE' })
    vi.mocked(getPublicStore).mockResolvedValue(store)
    const categoryId = 'a8098c1a-f86e-11da-bd1a-00112444be1f'
    const listing = {
      ...product,
      title: 'Sách cũ',
      price: 45000.5,
      condition: 'USED',
      status: 'ACTIVE',
      storeId: store.id,
    }
    vi.mocked(getCategoryTree).mockResolvedValue([
      { id: 'root', name: 'Sách', children: [{ id: categoryId, name: 'Văn học' }] },
      { id: 'empty', name: 'Đồ điện tử', children: [] },
    ])
    vi.mocked(createStoreProduct).mockResolvedValue(listing)
    vi.mocked(getProductById).mockResolvedValue(listing)
    const user = renderRoute('/')

    const listingLink = await screen.findByRole(
      'link',
      { name: 'Đăng sản phẩm' },
      { timeout: 4000 },
    )
    expect(listingLink).toHaveAttribute('href', '/store/products/new')
    if (isStaff) {
      await user.click(screen.getByRole('link', { name: 'Gian hàng làm việc' }))
      await user.click(
        await within(screen.getByRole('main')).findByRole('link', { name: 'Đăng sản phẩm' }),
      )
    } else {
      await user.click(listingLink)
    }
    const category = await screen.findByRole('combobox', { name: 'Danh mục' }, { timeout: 4000 })
    expect(router.state.location.pathname).toBe('/store/products/new')
    expect(screen.queryByRole('option', { name: 'Sách' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Đồ điện tử' })).not.toBeInTheDocument()
    await user.selectOptions(category, categoryId)
    await user.type(screen.getByRole('textbox', { name: 'Tên sản phẩm' }), ' Sách cũ ')
    await user.type(screen.getByRole('textbox', { name: 'Giá (₫)' }), '45000,50')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Tình trạng' }), 'USED')
    await user.click(screen.getByRole('button', { name: 'Đăng sản phẩm' }))

    expect(
      await screen.findByRole('heading', { name: listing.title }, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/products/${listing.id}`)
    expect(createStoreProduct).toHaveBeenCalledExactlyOnceWith({
      storeId: store.id,
      categoryId,
      title: listing.title,
      description: undefined,
      price: listing.price,
      condition: 'USED',
      imageFileIds: [],
    })
    if (isStaff) expect(getMyStore).not.toHaveBeenCalled()
  })

  test('blocks direct access to the product form for staff without PRODUCT_CREATE', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getMe).mockResolvedValue({
      id: 'staff-user',
      roles: ['USER', 'STAFF'],
      permissions: ['STORE_WORKSPACE_ACCESS'],
      storeId: store.id,
    })
    renderRoute('/store/products/new')

    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem nội dung')
    expect(screen.queryByRole('link', { name: 'Đăng sản phẩm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đăng sản phẩm' })).not.toBeInTheDocument()
    expect(getMyStore).not.toHaveBeenCalled()
    expect(getPublicStore).not.toHaveBeenCalled()
    expect(createStoreProduct).not.toHaveBeenCalled()
  })

  test('requires a store even when entering the former personal listing URL', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getMyStore).mockRejectedValueOnce(
      Object.assign(new Error('Store not found'), { status: 404, code: 'STORE_NOT_FOUND' }),
    )
    renderRoute('/my-products/new')

    expect(
      await screen.findByText(
        'Bạn cần mở gian hàng trước khi đăng sản phẩm.',
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/store/products/new')
    const main = screen.getByRole('main')
    expect(main.querySelector('a[href="/open-store"]')).toHaveTextContent('Mở gian hàng')
    expect(screen.queryByRole('button', { name: 'Đăng sản phẩm' })).not.toBeInTheDocument()
    expect(createStoreProduct).not.toHaveBeenCalled()
  })

  test(
    'shows a hidden personal listing and opens the next page from the header',
    { timeout: 15000 },
    async () => {
      setAccessToken('test-access-token')
      vi.mocked(getMyProducts).mockImplementation(async ({ page }) => ({
        items: page === 1 ? [{ ...product, title: 'Tin cá nhân đang ẩn', status: 'HIDDEN' }] : [],
        page,
        size: 20,
        hasNext: page === 1,
        totalElements: 1,
      }))
      const user = renderRoute('/')

      await user.click(
        await screen.findByRole('link', { name: 'Sản phẩm của tôi' }, { timeout: 4000 }),
      )
      const listing = await screen.findByRole(
        'link',
        { name: /Tin cá nhân đang ẩn/ },
        { timeout: 4000 },
      )
      expect(listing).toHaveAttribute('href', `/products/${product.id}`)
      expect(listing).toHaveTextContent('Đang ẩn')

      await user.click(screen.getByRole('button', { name: 'Sau' }))

      expect(await screen.findByText('Trang này chưa có tin cá nhân.')).toBeInTheDocument()
      expect(router.state.location).toMatchObject({ pathname: '/my-products', search: '?page=2' })
      expect(screen.getByRole('button', { name: 'Trước' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Sau' })).toBeDisabled()
      expect(vi.mocked(getMyProducts).mock.calls.map(([options]) => options.page)).toEqual([1, 2])
    },
  )

  test(
    'opens private store listings from the store overview and paginates',
    { timeout: 15000 },
    async () => {
      setAccessToken('test-access-token')
      vi.mocked(getMyStore).mockResolvedValue(store)
      vi.mocked(getMyStoreProducts).mockImplementation(async ({ page }) => ({
        items: [
          {
            ...product,
            storeId: store.id,
            title: page === 1 ? 'Tin gian hàng đang ẩn' : 'Tin gian hàng đang bán',
            status: page === 1 ? 'HIDDEN' : 'ACTIVE',
          },
        ],
        page,
        size: 20,
        hasNext: page === 1,
        totalElements: 21,
      }))
      const user = renderRoute('/store')

      await user.click(
        await screen.findByRole('link', { name: 'Sản phẩm của gian hàng' }, { timeout: 4000 }),
      )
      const hidden = await screen.findByRole(
        'link',
        { name: /Tin gian hàng đang ẩn/ },
        { timeout: 4000 },
      )
      expect(hidden).toHaveTextContent('Đang ẩn')

      await user.click(screen.getByRole('button', { name: 'Sau' }))

      const active = await screen.findByRole(
        'link',
        { name: /Tin gian hàng đang bán/ },
        { timeout: 4000 },
      )
      expect(active).toHaveTextContent('Đang bán')
      expect(router.state.location).toMatchObject({
        pathname: '/store/products',
        search: '?page=2',
      })
      expect(vi.mocked(getMyStoreProducts).mock.calls.map(([options]) => options.page)).toEqual([
        1, 2,
      ])
      expect(getMyProducts).not.toHaveBeenCalled()
    },
  )

  describe('managing a personal listing', () => {
    const listing = {
      ...product,
      sellerId: 'test-user',
      storeId: null,
      status: 'ACTIVE',
      version: 0,
    }
    const editPath = `/my-products/${listing.id}/edit`
    const myProductsKey = ['products', 'mine', 'test-user', 2]

    beforeEach(() => {
      setAccessToken('test-access-token')
      vi.mocked(getMe).mockResolvedValue({
        id: 'test-user',
        roles: ['USER'],
        permissions: ['PRODUCT_MANAGE_OWN'],
      })
      vi.mocked(getProductById).mockResolvedValue(listing)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    test(
      'only deletes after confirmation and returns to the product list',
      { timeout: 15000 },
      async () => {
        const confirm = vi
          .spyOn(window, 'confirm')
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
        vi.mocked(deleteProduct).mockResolvedValueOnce(undefined)
        const path = `/products/${listing.id}`
        const user = renderRoute(path)
        queryClient.setQueryData(myProductsKey, { items: [listing] })
        const button = await screen.findByRole('button', { name: 'Xóa tin' }, { timeout: 4000 })

        await user.click(button)
        expect(deleteProduct).not.toHaveBeenCalled()
        expect(router.state.location.pathname).toBe(path)

        await user.click(button)
        await waitFor(() => expect(router.state.location.pathname).toBe('/products'), {
          timeout: 4000,
        })
        expect(confirm).toHaveBeenCalledWith(
          expect.stringContaining('Bạn có chắc muốn xóa tin này?'),
        )
        expect(deleteProduct).toHaveBeenCalledExactlyOnceWith({ productId: listing.id })
        expect(queryClient.getQueryData(['products', 'detail', listing.id])).toMatchObject({
          status: 'DELETED',
        })
        expect(queryClient.getQueryState(myProductsKey)?.isInvalidated).toBe(true)
      },
    )

    test('keeps the listing on screen when delete fails', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.mocked(deleteProduct).mockRejectedValueOnce(new Error('Delete failed'))
      const path = `/products/${listing.id}`
      const user = renderRoute(path)

      await user.click(await screen.findByRole('button', { name: 'Xóa tin' }, { timeout: 4000 }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa tin.')
      expect(router.state.location.pathname).toBe(path)
      expect(screen.getByRole('heading', { name: listing.title })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Xóa tin' })).toBeEnabled()
    })

    test('hides and shows a listing, refreshing its status after each change', async () => {
      vi.mocked(changeProductStatus).mockImplementation(async ({ status }) => {
        vi.mocked(getProductById).mockResolvedValue({ ...listing, status })
      })
      const user = renderRoute(`/products/${listing.id}`)

      queryClient.setQueryData(myProductsKey, { items: [listing] })
      await user.click(await screen.findByRole('button', { name: 'Ẩn tin' }, { timeout: 4000 }))
      const show = await screen.findByRole('button', { name: 'Hiện tin' })
      expect(screen.getByText('Đang ẩn')).toBeInTheDocument()
      expect(queryClient.getQueryState(myProductsKey)?.isInvalidated).toBe(true)

      queryClient.setQueryData(myProductsKey, { items: [{ ...listing, status: 'HIDDEN' }] })
      await user.click(show)
      expect(await screen.findByRole('button', { name: 'Ẩn tin' })).toBeEnabled()
      expect(screen.getByText('Đang bán')).toBeInTheDocument()
      expect(queryClient.getQueryState(myProductsKey)?.isInvalidated).toBe(true)
      expect(changeProductStatus).toHaveBeenCalledTimes(2)
      expect(vi.mocked(changeProductStatus).mock.calls.map(([options]) => options)).toEqual([
        { productId: listing.id, status: 'HIDDEN' },
        { productId: listing.id, status: 'ACTIVE' },
      ])
    })

    test('keeps the current status and shows an error when the listing is locked', async () => {
      vi.mocked(changeProductStatus).mockRejectedValueOnce(
        Object.assign(new Error('Locked'), { status: 409, code: 'PRODUCT_STATUS_LOCKED' }),
      )
      const user = renderRoute(`/products/${listing.id}`)

      await user.click(await screen.findByRole('button', { name: 'Ẩn tin' }, { timeout: 4000 }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Trạng thái của tin đã thay đổi')
      expect(screen.getByText('Đang bán')).toBeInTheDocument()
    })

    test(
      'opens the edit form from the listing and saves version zero',
      { timeout: 15000 },
      async () => {
        const saved = { ...listing, title: 'Updated listing', version: 1 }
        vi.mocked(updateProduct).mockImplementationOnce(async () => {
          vi.mocked(getProductById).mockResolvedValue(saved)
          return saved
        })
        const user = renderRoute(`/products/${listing.id}`)

        queryClient.setQueryData(myProductsKey, { items: [listing] })
        await user.click(
          await screen.findByRole('link', { name: 'Chỉnh sửa sản phẩm' }, { timeout: 4000 }),
        )
        const title = await screen.findByRole(
          'textbox',
          { name: 'Tên sản phẩm' },
          { timeout: 4000 },
        )
        expect(title).toHaveValue(listing.title)
        await user.clear(title)
        await user.type(title, saved.title)
        await user.click(screen.getByRole('button', { name: 'Lưu' }))

        expect(
          await screen.findByRole('heading', { name: saved.title }, { timeout: 4000 }),
        ).toBeInTheDocument()
        expect(router.state.location.pathname).toBe(`/products/${listing.id}`)
        expect(queryClient.getQueryState(myProductsKey)?.isInvalidated).toBe(true)
        expect(updateProduct).toHaveBeenCalledExactlyOnceWith({
          productId: listing.id,
          version: 0,
          title: saved.title,
          price: listing.price,
          condition: listing.condition,
          description: '',
        })
      },
    )

    test(
      'keeps the draft on conflict and uses the latest version after reload',
      { timeout: 15000 },
      async () => {
        const latest = { ...listing, title: 'Edited in another tab', version: 1 }
        vi.mocked(updateProduct)
          .mockRejectedValueOnce(
            Object.assign(new Error('Conflict'), { status: 409, code: 'CONCURRENT_MODIFICATION' }),
          )
          .mockResolvedValueOnce({ ...latest, version: 2 })
        const user = renderRoute(editPath)
        const title = await screen.findByRole(
          'textbox',
          { name: 'Tên sản phẩm' },
          { timeout: 4000 },
        )
        await user.clear(title)
        await user.type(title, 'My draft')
        const save = screen.getByRole('button', { name: 'Lưu' })
        await user.click(save)

        expect(await screen.findByRole('alert')).toHaveTextContent('Sản phẩm đã thay đổi')
        expect(title).toHaveValue('My draft')
        expect(save).toBeDisabled()

        vi.mocked(getProductById).mockResolvedValue(latest)
        await user.click(screen.getByRole('button', { name: 'Tải lại dữ liệu' }))
        await waitFor(() => expect(title).toHaveValue(latest.title))
        expect(save).toBeEnabled()
        await user.click(save)

        await waitFor(() => {
          expect(updateProduct).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ title: latest.title, version: latest.version }),
          )
        })
      },
    )

    test('blocks the direct edit route for another seller’s listing', async () => {
      vi.mocked(getProductById).mockResolvedValue({
        ...listing,
        sellerId: 'other-user',
        version: undefined,
      })
      renderRoute(editPath)

      expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toHaveTextContent(
        'Không có quyền xem nội dung',
      )
      expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    })
  })

  describe('managing a store listing', () => {
    const listing = {
      ...product,
      sellerId: 'store-staff',
      storeId: store.id,
      status: 'ACTIVE',
      version: 0,
    }
    const editPath = `/store/products/${listing.id}/edit`

    beforeEach(() => {
      setAccessToken('test-access-token')
      vi.mocked(getMe).mockResolvedValue({
        id: 'test-user',
        roles: ['USER'],
        permissions: ['PRODUCT_MANAGE_OWN'],
      })
      vi.mocked(getProductById).mockResolvedValue(listing)
      vi.mocked(getPublicStore).mockResolvedValue(store)
      vi.mocked(getMyStore).mockResolvedValue({ ...store, status: 'ACTIVE' })
    })

    test('lets the store owner open the edit form for a listing created by staff', async () => {
      const user = renderRoute(`/products/${listing.id}`)

      const edit = await screen.findByRole(
        'link',
        { name: 'Chỉnh sửa sản phẩm' },
        { timeout: 4000 },
      )
      expect(edit).toHaveAttribute('href', editPath)
      expect(screen.getByRole('button', { name: 'Ẩn tin' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Xóa tin' })).toBeEnabled()

      await user.click(edit)

      expect(await screen.findByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue(
        listing.title,
      )
    })

    test('lets delegated staff open a coworker listing edit form without resolving an owned store', async () => {
      vi.mocked(getMe).mockResolvedValue({
        id: 'manager',
        roles: ['USER', 'STAFF'],
        permissions: ['STORE_WORKSPACE_ACCESS', 'PRODUCT_MANAGE_OWN'],
        storeId: store.id,
      })
      vi.mocked(getMyStaffProfile).mockResolvedValue({
        userId: 'manager',
        storeId: store.id,
        permissions: ['STORE_WORKSPACE_ACCESS', 'PRODUCT_MANAGE_OWN'],
      })
      const user = renderRoute(`/products/${listing.id}`)
      await user.click(
        await screen.findByRole('link', { name: 'Chỉnh sửa sản phẩm' }, { timeout: 4000 }),
      )
      expect(await screen.findByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue(
        listing.title,
      )
      expect(getMyStore).not.toHaveBeenCalled()
      expect(createStoreProduct).not.toHaveBeenCalled()
    })

    test('blocks the direct edit route for a listing from another store', async () => {
      vi.mocked(getMyStore).mockResolvedValue({ id: 'other-store', status: 'ACTIVE' })
      renderRoute(editPath)

      expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toHaveTextContent(
        'Không có quyền xem nội dung',
      )
      expect(getMyStore).toHaveBeenCalledOnce()
      expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    })

    test('shows a retry when the store lookup fails during a direct edit', async () => {
      vi.mocked(getMyStore).mockRejectedValueOnce(new Error('Store lookup failed'))
      const user = renderRoute(editPath)

      expect(await screen.findByRole('alert', {}, { timeout: 4000 })).toHaveTextContent(
        'Bạn có thể quay lại sau.',
      )
      await user.click(screen.getByRole('button', { name: 'Thử lại' }))

      expect(await screen.findByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue(
        listing.title,
      )
    })
  })

  test('displays the newest product and navigates to its details', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ items: [product] })
    vi.mocked(getProductById).mockResolvedValue({
      ...product,
      status: 'ACTIVE',
      description: 'Test product description',
      storeId: null,
      attributes: {
        'Chất liệu': 'Da',
        'Có hộp': false,
      },
    })
    const user = renderRoute('/')

    const productLink = await screen.findByRole('link', { name: /Test product/ }, { timeout: 4000 })
    expect(productLink).toHaveAttribute('href', `/products/${product.id}`)
    expect(screen.getByText('Như mới')).toBeInTheDocument()
    expect(screen.getByText(/250\.000/)).toHaveTextContent(/250\.000\s*₫/)
    expect(screen.getByText('Chưa có ảnh sản phẩm')).toBeInTheDocument()

    const header = screen.getByRole('banner')
    await user.click(productLink)

    expect(await screen.findByRole('heading', { name: product.title })).toBeInTheDocument()
    expect(screen.getByText('Test product description')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Thuộc tính sản phẩm' })).toBeInTheDocument()
    expect(screen.getByText('Chất liệu', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('Da', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getByText('Có hộp', { selector: 'dt' })).toBeInTheDocument()
    expect(screen.getByText('Không', { selector: 'dd' })).toBeInTheDocument()
    expect(getProductById).toHaveBeenCalledWith(expect.objectContaining({ productId: product.id }))
    expect(screen.queryByRole('heading', { name: 'Gian hàng' })).not.toBeInTheDocument()
    expect(getPublicStore).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe(`/products/${product.id}`)
    expect(screen.getByRole('banner')).toBe(header)
  })

  test('keeps product details visible while loading the associated public store', async () => {
    vi.mocked(getProductById).mockResolvedValue({ ...product, status: 'ACTIVE', storeId: store.id })
    const pendingStore = Promise.withResolvers()
    vi.mocked(getPublicStore).mockResolvedValue(store).mockReturnValueOnce(pendingStore.promise)
    const user = renderRoute(`/products/${product.id}`)

    expect(await screen.findByRole('heading', { name: product.title })).toBeInTheDocument()
    expect(screen.getByText('Đang tải thông tin gian hàng…')).toHaveAttribute('role', 'status')
    expect(getPublicStore).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ storeId: store.id }),
    )

    pendingStore.resolve(store)

    expect(await screen.findByText(store.name)).toBeInTheDocument()
    expect(screen.getByText(store.description)).toBeInTheDocument()

    const storeLink = screen.getByRole('link', { name: 'Xem gian hàng' })
    expect(storeLink).toHaveAttribute('href', `/stores/${store.id}`)
    await user.click(storeLink)

    expect(await screen.findByRole('heading', { name: store.name })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/stores/${store.id}`)
  })

  test('opens the public store URL directly and shows its public information', async () => {
    vi.mocked(getPublicStore).mockResolvedValue(store)
    renderRoute(`/stores/${store.id}`)

    expect(await screen.findByRole('heading', { name: store.name })).toBeInTheDocument()
    expect(screen.getByText(store.description)).toBeInTheDocument()
    expect(getPublicStore).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ storeId: store.id }),
    )
  })

  test('filters products by selected parent and child categories', async () => {
    const parent = { id: 'a8098c1a-f86e-11da-bd1a-00112444be1e', name: 'Thời trang' }
    const child = { id: 'a8098c1a-f86e-11da-bd1a-00112444be1f', name: 'Áo khoác' }
    vi.mocked(getCategoryTree).mockResolvedValue([{ ...parent, children: [child] }])
    const user = renderRoute('/products')

    await user.click(await screen.findByRole('checkbox', { name: parent.name }))
    await user.click(screen.getByRole('checkbox', { name: 'Thời trang / Áo khoác' }))
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm sản phẩm' }))

    await waitFor(() =>
      expect(searchProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: [parent.id, child.id], page: 1 }),
      ),
    )
    expect(new URLSearchParams(router.state.location.search).getAll('categoryId')).toEqual([
      parent.id,
      child.id,
    ])
  })

  test('blocks submissions with more than 20 selected categories', { timeout: 10000 }, async () => {
    const categories = Array.from({ length: 21 }, (_, index) => ({
      id: 'a8098c1a-f86e-11da-bd1a-' + String(index).padStart(12, '0'),
      name: 'Danh mục ' + (index + 1),
    }))
    vi.mocked(getCategoryTree).mockResolvedValue(categories)
    const user = renderRoute('/products')

    await screen.findByRole('checkbox', { name: 'Danh mục 21' })
    for (const category of categories) {
      await user.click(screen.getByRole('checkbox', { name: category.name }))
    }
    const submit = screen.getByRole('button', { name: 'Tìm kiếm sản phẩm' })
    await user.click(submit)

    expect(screen.getByRole('alert')).toHaveTextContent('Chọn tối đa 20 danh mục.')
    expect(router.state.location.search).toBe('')
    expect(searchProducts).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('checkbox', { name: 'Danh mục 21' }))
    await user.click(submit)

    await waitFor(() =>
      expect(searchProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: categories.slice(0, 20).map(({ id }) => id) }),
      ),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('submits multiple conditions and price bounds and keeps them on the next page', async () => {
    vi.mocked(searchProducts).mockImplementation(async ({ page }) => ({
      items: [product],
      page,
      totalElements: 3,
      hasNext: page < 3,
    }))
    const user = renderRoute('/products?page=3&size=1')
    expect(await screen.findByText('Trang 3')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Mới' }))
    await user.click(screen.getByRole('checkbox', { name: 'Đã sử dụng' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Giá tối thiểu' }), '0')
    await user.type(screen.getByRole('spinbutton', { name: 'Giá tối đa' }), '200000')
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm sản phẩm' }))

    expect(await screen.findByText('Trang 1')).toBeInTheDocument()
    expect(new URLSearchParams(router.state.location.search).getAll('condition')).toEqual([
      'NEW',
      'USED',
    ])
    await user.click(screen.getByRole('button', { name: 'Sau' }))

    expect(await screen.findByText('Trang 2')).toBeInTheDocument()
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({
        condition: ['NEW', 'USED'],
        minPrice: 0,
        maxPrice: 200000,
        page: 2,
      }),
    )
    expect(screen.getByRole('checkbox', { name: 'Mới' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Đã sử dụng' })).toBeChecked()
  })

  test('blocks an inverted price range and submits after the range is corrected', async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      items: [product],
      page: 1,
      totalElements: 1,
      hasNext: false,
    })
    const user = renderRoute('/products')
    const minimum = await screen.findByRole('spinbutton', { name: 'Giá tối thiểu' })
    const maximum = screen.getByRole('spinbutton', { name: 'Giá tối đa' })
    const submit = screen.getByRole('button', { name: 'Tìm kiếm sản phẩm' })

    await user.type(minimum, '200000')
    await user.type(maximum, '100000')
    await user.click(submit)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa.',
    )
    expect(router.state.location.search).toBe('')
    expect(searchProducts).toHaveBeenCalledOnce()

    await user.clear(maximum)
    await user.type(maximum, '300000')
    await user.click(submit)

    await waitFor(() =>
      expect(searchProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ minPrice: 200000, maxPrice: 300000, page: 1 }),
      ),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('searches and paginates within the store from the path', async () => {
    vi.mocked(getPublicStore).mockResolvedValue(store)
    vi.mocked(searchProducts).mockImplementation(async ({ page, size }) => ({
      items: [product],
      page,
      size,
      totalElements: 3,
      totalPages: 3,
      hasNext: page < 3,
    }))
    const user = renderRoute(`/stores/${store.id}?page=3&size=1&storeId=other-store`)

    expect(await screen.findByRole('link', { name: /Test product/ })).toHaveAttribute(
      'href',
      `/products/${product.id}`,
    )
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ storeId: store.id, page: 3, size: 1 }),
    )

    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm sản phẩm' }), 'áo')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sắp xếp' }), 'price_asc')
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm sản phẩm' }))

    await waitFor(() =>
      expect(searchProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({
          storeId: store.id,
          q: 'áo',
          sort: 'price_asc',
          page: 1,
          size: 1,
        }),
      ),
    )
    expect(router.state.location.pathname).toBe(`/stores/${store.id}`)
    expect(await screen.findByText('Trang 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sau' }))

    expect(await screen.findByText('Trang 2')).toBeInTheDocument()
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ storeId: store.id, q: 'áo', sort: 'price_asc', page: 2, size: 1 }),
    )
    expect(router.state.location.pathname).toBe(`/stores/${store.id}`)
  })

  test('shows an empty store without pagination', async () => {
    vi.mocked(getPublicStore).mockResolvedValue(store)
    vi.mocked(searchProducts).mockResolvedValue({
      items: [],
      page: 1,
      totalElements: 0,
      hasNext: false,
    })
    renderRoute(`/stores/${store.id}`)

    expect(
      await screen.findByRole('heading', { name: 'Gian hàng chưa có sản phẩm.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: store.name })).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Phân trang sản phẩm' }),
    ).not.toBeInTheDocument()
  })

  test('retries a failed store product search while keeping store information visible', async () => {
    vi.mocked(getPublicStore).mockResolvedValue(store)
    vi.mocked(searchProducts)
      .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
      .mockResolvedValueOnce({ items: [product], page: 1, totalElements: 1, hasNext: false })
    const user = renderRoute(`/stores/${store.id}`)

    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tải được sản phẩm')
    expect(screen.getByRole('heading', { name: store.name })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('link', { name: /Test product/ })).toBeInTheDocument()
    expect(getPublicStore).toHaveBeenCalledOnce()
  })

  test.each([403, 404])('shows an unavailable store for HTTP %s', async (status) => {
    vi.mocked(getPublicStore).mockRejectedValueOnce(
      Object.assign(new Error('Store unavailable'), { status }),
    )
    renderRoute(`/stores/${store.id}`)

    expect(
      await screen.findByRole('heading', { name: 'Gian hàng tạm không khả dụng' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem danh sách sản phẩm' })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  test('retries a temporary public store page failure', async () => {
    vi.mocked(getPublicStore)
      .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
      .mockResolvedValueOnce(store)
    const user = renderRoute(`/stores/${store.id}`)

    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tải được thông tin gian hàng.')
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('heading', { name: store.name })).toBeInTheDocument()
  })

  test('allows retrying a temporary store failure without replacing product details', async () => {
    vi.mocked(getProductById).mockResolvedValue({ ...product, status: 'ACTIVE', storeId: store.id })
    vi.mocked(getPublicStore)
      .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
      .mockResolvedValueOnce(store)
    const user = renderRoute(`/products/${product.id}`)

    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tải được thông tin gian hàng.')
    expect(screen.getByRole('heading', { name: product.title })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByText(store.name)).toBeInTheDocument()
    expect(getProductById).toHaveBeenCalledOnce()
  })

  test('marks a forbidden store unavailable and keeps the product visible', async () => {
    vi.mocked(getProductById).mockResolvedValue({ ...product, status: 'ACTIVE', storeId: store.id })
    vi.mocked(getPublicStore).mockRejectedValueOnce(
      Object.assign(new Error('Forbidden'), { status: 403 }),
    )
    renderRoute(`/products/${product.id}`)

    expect(await screen.findByRole('alert')).toHaveTextContent('Gian hàng hiện không khả dụng.')
    expect(screen.getByRole('heading', { name: product.title })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument()
  })

  test('shows a way back to the catalog when a product is unavailable', async () => {
    vi.mocked(getProductById).mockRejectedValue(
      Object.assign(new Error('Not found'), { status: 404 }),
    )

    renderRoute(`/products/${product.id}`)

    expect(await screen.findByRole('heading', { name: 'Sản phẩm không còn' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem sản phẩm khác' })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  test('hides the product section when search succeeds without products', async () => {
    renderRoute('/')
    await screen.findByRole('heading', { name: 'Chưa có danh mục' })
    await waitFor(() => expect(searchProducts).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Sản phẩm mới' })).not.toBeInTheDocument()
  })

  test('keeps categories usable while products are loading independently', async () => {
    vi.mocked(getCategoryTree).mockResolvedValue([{ id: 'test-category', name: 'Test category' }])
    vi.mocked(searchProducts).mockImplementation(() => new Promise(() => {}))
    renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Test category' })).toBeInTheDocument()
    expect(await screen.findByText('Đang tải sản phẩm')).toBeInTheDocument()
  })

  test('retries a product failure without replacing the category section', async () => {
    vi.mocked(getCategoryTree).mockResolvedValue([{ id: 'test-category', name: 'Test category' }])
    vi.mocked(searchProducts)
      .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
      .mockResolvedValueOnce({ items: [product] })
    const user = renderRoute('/')

    await screen.findByRole('heading', { name: 'Chưa tải được sản phẩm mới' })
    expect(screen.getByRole('link', { name: 'Test category' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('link', { name: /Test product/ })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Chưa tải được sản phẩm mới' }),
    ).not.toBeInTheDocument()
  })

  test('shows forbidden product feedback without redirecting the page', async () => {
    vi.mocked(searchProducts).mockRejectedValue(
      Object.assign(new Error('Forbidden'), { status: 403 }),
    )
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { name: 'Không có quyền xem nội dung' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Món đồ cũ, khởi đầu mới.' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  test('uses a translated fallback for an unrecognized product condition', async () => {
    vi.mocked(searchProducts).mockResolvedValue({
      items: [{ ...product, condition: 'UNRECOGNIZED' }],
    })
    renderRoute('/')

    expect(await screen.findByText('Chưa rõ tình trạng')).toBeInTheDocument()
    expect(screen.queryByText('UNRECOGNIZED')).not.toBeInTheDocument()
  })

  test('navigates from a category card to its page inside the shared layout', async () => {
    const id = 'a8098c1a-f86e-11da-bd1a-00112444be1e'
    vi.mocked(getCategoryTree).mockResolvedValue([{ id, name: 'Test category', children: [] }])
    vi.mocked(getCategoryById).mockResolvedValue({
      id,
      name: 'Test category',
      description: 'Test description',
    })
    vi.mocked(searchProducts).mockResolvedValue({
      items: [product],
      page: 1,
      totalElements: 1,
      hasNext: false,
    })
    const user = renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Test category' })).toHaveAttribute(
      'href',
      `/categories/${id}`,
    )
    const header = screen.getByRole('banner')
    await user.click(screen.getByRole('link', { name: 'Test category' }))

    expect(await screen.findByRole('heading', { name: 'Test category' })).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Test product/ })).toBeInTheDocument()
    expect(getCategoryById).toHaveBeenCalledWith(expect.objectContaining({ categoryId: id }))
    expect(searchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: id }))
    expect(router.state.location.pathname).toBe(`/categories/${id}`)
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' }).closest('header')).toBe(
      header,
    )
  })

  test('keeps the category from the path when searching and changing pages', async () => {
    const id = 'a8098c1a-f86e-11da-bd1a-00112444be1e'
    vi.mocked(getCategoryById).mockResolvedValue({ id, name: 'Test category' })
    vi.mocked(searchProducts).mockImplementation(async ({ page }) => ({
      items: [product],
      page,
      totalElements: 3,
      hasNext: page < 3,
    }))
    const user = renderRoute(`/categories/${id}?page=3&size=1&categoryId=other`)

    expect(await screen.findByText('Trang 3')).toBeInTheDocument()
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: id, page: 3 }),
    )
    expect(screen.queryByRole('group', { name: 'Danh mục' })).not.toBeInTheDocument()
    expect(getCategoryTree).not.toHaveBeenCalled()

    await user.type(screen.getByRole('searchbox', { name: 'Tìm kiếm sản phẩm' }), 'áo')
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm sản phẩm' }))
    expect(await screen.findByText('Trang 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sau' }))
    expect(await screen.findByText('Trang 2')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/categories/${id}`)
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ categoryId: id, q: 'áo', page: 2, size: 1 }),
    )
  })

  test('offers the product list when the category does not exist', async () => {
    vi.mocked(getCategoryById).mockRejectedValueOnce(
      Object.assign(new Error('Not found'), { status: 404 }),
    )
    renderRoute('/categories/a8098c1a-f86e-11da-bd1a-00112444be1e')

    expect(
      await screen.findByRole('heading', { name: 'Không tìm thấy danh mục' }),
    ).toBeInTheDocument()
    expect(searchProducts).not.toHaveBeenCalled()
  })

  test('retries a temporary category detail failure', async () => {
    const id = 'a8098c1a-f86e-11da-bd1a-00112444be1e'
    vi.mocked(getCategoryById)
      .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
      .mockResolvedValueOnce({ id, name: 'Test category' })
    const user = renderRoute(`/categories/${id}`)

    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tải được danh mục')
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng thử lại sau ít phút.')
    expect(searchProducts).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('heading', { name: 'Test category' })).toBeInTheDocument()
  })

  test('explains when the category tree is empty', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', { name: 'Chưa có danh mục' })).toBeInTheDocument()
  })

  test('shows the category skeleton while the request is pending', async () => {
    vi.mocked(getCategoryTree).mockImplementation(() => new Promise(() => {}))
    renderRoute('/')
    expect(await screen.findByText('Đang tải danh mục')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Chưa có danh mục' })).not.toBeInTheDocument()
  })

  test('keeps forbidden feedback local to the category section', async () => {
    vi.mocked(getCategoryTree).mockRejectedValue(
      Object.assign(new Error('Forbidden'), { status: 403 }),
    )
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { name: 'Không có quyền xem nội dung' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  test('recovers a failed category request through the retry button', async () => {
    vi.mocked(getCategoryTree)
      .mockRejectedValueOnce(Object.assign(new Error('Unavailable'), { status: 503 }))
      .mockResolvedValueOnce([
        { id: 'a8098c1a-f86e-11da-bd1a-00112444be1e', name: 'Test category', children: [] },
      ])
    const user = renderRoute('/')

    await user.click(await screen.findByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('link', { name: 'Test category' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Chưa tải được danh mục' }),
    ).not.toBeInTheDocument()
  })

  test('navigates between pages while keeping the shared layout mounted', async () => {
    const user = renderRoute('/')
    await screen.findByRole('heading', { name: 'Món đồ cũ, khởi đầu mới.' })
    const header = screen.getByRole('banner')

    await user.click(screen.getByRole('link', { name: 'Khám phá ngay' }))

    expect(await screen.findByRole('heading', { name: 'Khám phá sản phẩm' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products')
    expect(screen.getByRole('banner')).toBe(header)
  })

  describe('registering an account', () => {
    async function fillRegistration(user, confirmPassword = ' password ') {
      await user.type(await screen.findByLabelText('Họ và tên'), ' Chu ')
      await user.type(screen.getByLabelText('Email'), ' chu@example.com ')
      await user.type(screen.getByLabelText('Số điện thoại (tùy chọn)'), '0901234567')
      await user.type(screen.getByLabelText('Mật khẩu'), ' password ')
      await user.type(screen.getByLabelText('Nhập lại mật khẩu'), confirmPassword)
      await user.click(screen.getByRole('button', { name: 'Đăng ký' }))
    }

    test('creates a pending account and clears the password form without signing in', async () => {
      const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-20T02:00:00Z'))
      try {
        vi.mocked(registerAccount).mockResolvedValue({
          userId: 'new-user',
          email: 'chu@example.com',
          fullName: 'Chu',
          status: 'PENDING_VERIFICATION',
        })
        const user = renderRoute('/register')
        await fillRegistration(user)

        expect(await screen.findByRole('status')).toHaveTextContent(
          'Hoàn tất xác nhận tài khoản cho chu@example.com',
        )
        expect(registerAccount).toHaveBeenCalledExactlyOnceWith({
          fullName: 'Chu',
          email: 'chu@example.com',
          phone: '0901234567',
          password: ' password ',
        })
        expect(screen.queryByLabelText('Mật khẩu')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toHaveValue('chu@example.com')
        expect(screen.getByLabelText('Mã OTP')).toHaveValue('')
        expect(
          await screen.findByRole('button', { name: 'Gửi lại sau 60 giây' }, { timeout: 2000 }),
        ).toBeDisabled()
        expect(getAccessToken()).toBeNull()
        expect(login).not.toHaveBeenCalled()
      } finally {
        clock.mockRestore()
      }
    })

    test('rejects mismatched confirmation before sending the request', async () => {
      const user = renderRoute('/register')
      await fillRegistration(user, 'different-password')
      expect(await screen.findByRole('alert')).toHaveTextContent('Hai mật khẩu không khớp.')
      expect(registerAccount).not.toHaveBeenCalled()
    })

    test('resumes verification for a pending email and allows requesting a new OTP', async () => {
      vi.mocked(registerAccount).mockRejectedValueOnce(
        Object.assign(new Error('Pending verification'), {
          status: 403,
          code: 'EMAIL_NOT_VERIFIED',
        }),
      )
      vi.mocked(resendVerification).mockResolvedValueOnce(undefined)
      const user = renderRoute('/register')
      await fillRegistration(user)

      expect(await screen.findByLabelText('Mã OTP')).toHaveValue('')
      expect(screen.getByLabelText('Email')).toHaveValue('chu@example.com')
      expect(screen.queryByLabelText('Mật khẩu')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Gửi lại mã' }))
      expect(resendVerification).toHaveBeenCalledExactlyOnceWith({ email: 'chu@example.com' })
      expect(login).not.toHaveBeenCalled()
    })

    test.each([
      ['EMAIL_ALREADY_EXISTS', 'Email', 'Email này đã được đăng ký.'],
      ['PHONE_ALREADY_EXISTS', 'Số điện thoại (tùy chọn)', 'Số điện thoại này đã được sử dụng.'],
    ])('maps %s to the appropriate input', async (code, label, message) => {
      vi.mocked(registerAccount).mockRejectedValueOnce(
        Object.assign(new Error('Duplicate'), { status: 409, code }),
      )
      const user = renderRoute('/register')
      await fillRegistration(user)
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('verifying an email', () => {
    async function fillVerification(user, code = '012345') {
      await user.type(await screen.findByLabelText('Email'), ' chu@example.com ')
      await user.type(screen.getByLabelText('Mã OTP'), code)
      await user.click(screen.getByRole('button', { name: 'Xác nhận email' }))
    }

    test('verifies the email and lets the user proceed to login', async () => {
      vi.mocked(verifyEmail).mockResolvedValueOnce(undefined)
      const user = renderRoute('/verify-email')
      await fillVerification(user)

      expect(await screen.findByRole('status')).toHaveTextContent('Email đã được xác nhận.')
      expect(verifyEmail).toHaveBeenCalledExactlyOnceWith({
        email: 'chu@example.com',
        code: '012345',
      })
      expect(screen.queryByLabelText('Mã OTP')).not.toBeInTheDocument()
      expect(getAccessToken()).toBeNull()
      await user.click(screen.getByRole('link', { name: 'Đăng nhập' }))
      expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    })

    test('rejects an incomplete code before sending the request', async () => {
      const user = renderRoute('/verify-email')
      await fillVerification(user, '12345')
      expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng nhập mã gồm 6 chữ số.')
      expect(verifyEmail).not.toHaveBeenCalled()
    })

    test.each([
      ['OTP_INVALID', 'Mã xác nhận không đúng.'],
      ['OTP_EXPIRED', 'Mã đã hết hạn'],
      ['OTP_ATTEMPTS_EXCEEDED', 'Bạn đã nhập sai quá nhiều lần.'],
    ])('handles %s and keeps the verification form available', async (code, message) => {
      vi.mocked(verifyEmail).mockRejectedValueOnce(
        Object.assign(new Error('Verification failed'), {
          status: 400,
          code,
        }),
      )
      const user = renderRoute('/verify-email')
      await fillVerification(user)
      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(screen.getByLabelText('Email')).toHaveValue('chu@example.com')
    })

    test('resends using the email without requiring an OTP and starts cooldown', async () => {
      vi.mocked(resendVerification).mockResolvedValueOnce(undefined)
      const user = renderRoute('/verify-email')
      await user.type(await screen.findByLabelText('Email'), ' chu@example.com ')
      await user.click(screen.getByRole('button', { name: 'Gửi lại mã' }))

      expect(await screen.findByRole('status')).toHaveTextContent('mã mới đã được gửi.')
      expect(resendVerification).toHaveBeenCalledExactlyOnceWith({ email: 'chu@example.com' })
      expect(screen.getByRole('button', { name: 'Gửi lại sau 60 giây' })).toBeDisabled()
      expect(verifyEmail).not.toHaveBeenCalled()
    })
  })

  test('uses the auth layout and navigates to registration', async () => {
    const user = renderRoute('/login')
    await screen.findByRole('heading', { name: 'Đăng nhập' })
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Đăng ký' }))

    expect(await screen.findByRole('heading', { name: 'Đăng ký' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/register')
  })

  test('redirects a guest from the profile route to login', async () => {
    renderRoute('/profile')

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(router.state.location).toMatchObject({
      pathname: '/login',
      state: { from: '/profile' },
    })
    expect(getMe).not.toHaveBeenCalled()
  })

  test('opens the signed-in user’s profile from the main navigation', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getMe).mockResolvedValue({
      id: 'test-user',
      fullName: 'Nguyễn Văn Chu',
      email: 'chu@example.com',
      roles: ['USER'],
    })
    const user = renderRoute('/')
    const profileLink = await screen.findByRole('link', { name: 'Hồ sơ của tôi' })
    await user.click(profileLink)

    const main = await screen.findByRole('main')
    expect(await screen.findByRole('heading', { name: 'Hồ sơ của tôi' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/profile')
    expect(main).toHaveTextContent('Họ và tên')
    expect(main).toHaveTextContent('Nguyễn Văn Chu')
    expect(main).toHaveTextContent('Email')
    expect(main).toHaveTextContent('chu@example.com')
  })

  describe('opening a store', () => {
    const myStore = { id: 'my-store', name: 'Tiệm sách cũ' }
    const noStore = Object.assign(new Error('Store not found'), {
      status: 404,
      code: 'STORE_NOT_FOUND',
    })

    test('redirects a guest to login before checking for a store', async () => {
      renderRoute('/open-store')

      expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
      expect(router.state.location).toMatchObject({
        pathname: '/login',
        state: { from: '/open-store' },
      })
      expect(getMyStore).not.toHaveBeenCalled()
    })

    test('opens the store form from the header and shows the newly created store', async () => {
      setAccessToken('test-access-token')
      vi.mocked(getMyStore).mockRejectedValueOnce(noStore).mockResolvedValue(myStore)
      vi.mocked(createStore).mockResolvedValue(myStore)
      const user = renderRoute('/')
      await user.click(await screen.findByRole('link', { name: 'Mở gian hàng' }))

      await user.type(
        await screen.findByRole('textbox', { name: 'Tên gian hàng' }),
        ' Tiệm sách cũ ',
      )
      await user.click(screen.getByRole('button', { name: 'Tạo gian hàng' }))

      expect(await screen.findByRole('heading', { name: myStore.name })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/store')
      expect(createStore).toHaveBeenCalledOnce()
      expect(vi.mocked(createStore).mock.calls[0][0]).toEqual({
        name: myStore.name,
        description: undefined,
        pickupAddress: undefined,
      })
    })

    test('skips the creation form when the account already owns a store', async () => {
      setAccessToken('test-access-token')
      vi.mocked(getMyStore).mockResolvedValue(myStore)
      renderRoute('/open-store')

      expect(await screen.findByRole('heading', { name: myStore.name })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/store')
      expect(screen.queryByRole('button', { name: 'Tạo gian hàng' })).not.toBeInTheDocument()
      expect(createStore).not.toHaveBeenCalled()
    })

    test('loads the existing store when another tab created it before submit', async () => {
      setAccessToken('test-access-token')
      vi.mocked(getMyStore).mockRejectedValueOnce(noStore).mockResolvedValue(myStore)
      vi.mocked(createStore).mockRejectedValueOnce(
        Object.assign(new Error('Store already exists'), {
          status: 409,
          code: 'STORE_ALREADY_EXISTS',
        }),
      )
      const user = renderRoute('/open-store')
      queryClient.setQueryDefaults(['stores', 'mine'], { staleTime: 30_000 })

      await user.type(await screen.findByRole('textbox', { name: 'Tên gian hàng' }), 'Tiệm sách')
      await user.click(screen.getByRole('button', { name: 'Tạo gian hàng' }))

      expect(await screen.findByRole('heading', { name: myStore.name })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/store')
    })
  })

  describe('navigating to a linked store', () => {
    const staffProfile = {
      id: 'staff-user',
      roles: ['USER', 'STAFF'],
      permissions: ['STORE_WORKSPACE_ACCESS'],
      storeId: store.id,
    }

    beforeEach(() => {
      setAccessToken('test-access-token')
      vi.mocked(getMe).mockResolvedValue(staffProfile)
      vi.mocked(getPublicStore).mockResolvedValue(store)
    })

    test('shows the linked store in the staff workspace without looking up an owned store', async () => {
      const user = renderRoute('/')
      const workspace = await screen.findByRole('link', { name: 'Gian hàng làm việc' })
      expect(workspace).toHaveAttribute('href', '/store')
      expect(screen.queryByRole('link', { name: 'Mở gian hàng' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Đăng sản phẩm' })).not.toBeInTheDocument()
      await user.click(workspace)

      expect(await screen.findByRole('region', { name: store.name })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Xem trang công khai' })).toHaveAttribute(
        'href',
        `/stores/${store.id}`,
      )
      expect(screen.queryByRole('link', { name: 'Nhân viên gian hàng' })).not.toBeInTheDocument()
      expect(getPublicStore).toHaveBeenCalledWith(expect.objectContaining({ storeId: store.id }))
      expect(getMyStore).not.toHaveBeenCalled()
    })

    test('redirects a staff member from the open-store page to the workspace', async () => {
      renderRoute('/open-store')

      expect(await screen.findByRole('heading', { name: store.name })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/store')
      expect(screen.queryByRole('button', { name: 'Tạo gian hàng' })).not.toBeInTheDocument()
      expect(getMyStore).not.toHaveBeenCalled()
    })

    test('opens the private staff product list using delegated membership and no public search filters', async () => {
      vi.mocked(getMe).mockResolvedValue({
        ...staffProfile,
        storeId: 'stale-shop',
        permissions: [...staffProfile.permissions, 'PRODUCT_MANAGE_OWN', 'ORDER_PROCESS'],
      })
      vi.mocked(getMyStaffProfile).mockResolvedValue({
        userId: staffProfile.id,
        storeId: store.id,
        permissions: ['STORE_WORKSPACE_ACCESS', 'PRODUCT_MANAGE_OWN'],
      })
      vi.mocked(getStoreProducts).mockResolvedValue({
        items: [
          {
            id: 'staff-product',
            title: 'Private staff listing',
            price: 1000,
            status: 'HIDDEN',
            condition: 'USED',
          },
        ],
        page: 1,
        hasNext: false,
      })
      const user = renderRoute('/store')
      const main = await screen.findByRole('main')
      await user.click(await within(main).findByRole('link', { name: 'Sản phẩm của gian hàng' }))
      await screen.findByText('Private staff listing')
      expect(getStoreProducts).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: store.id, page: 1, signal: expect.any(AbortSignal) }),
      )
      expect(getMyStoreProducts).not.toHaveBeenCalled()
      expect(getMyStore).not.toHaveBeenCalled()
      expect(searchProducts).not.toHaveBeenCalled()
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    test('merged USER management permission does not expose staff product management', async () => {
      vi.mocked(getMe).mockResolvedValue({
        ...staffProfile,
        permissions: [...staffProfile.permissions, 'PRODUCT_MANAGE_OWN'],
      })
      vi.mocked(getMyStaffProfile).mockResolvedValue({
        userId: staffProfile.id,
        storeId: store.id,
        permissions: ['STORE_WORKSPACE_ACCESS', 'PRODUCT_CREATE'],
      })
      renderRoute('/store/products')
      await screen.findByRole('heading', { name: 'Không có quyền xem nội dung' })
      expect(getStoreProducts).not.toHaveBeenCalled()
      expect(getMyStoreProducts).not.toHaveBeenCalled()
    })

    test('shows an unavailable message when the linked store is blocked', async () => {
      vi.mocked(getPublicStore).mockRejectedValueOnce(
        Object.assign(new Error('Store blocked'), { status: 403, code: 'STORE_BLOCKED' }),
      )
      renderRoute('/store')

      expect(await screen.findByRole('alert')).toHaveTextContent('Gian hàng tạm không khả dụng')
      expect(router.state.location.pathname).toBe('/store')
      expect(getMyStore).not.toHaveBeenCalled()
    })

    test('does not offer store creation when a staff member lacks workspace permission', async () => {
      vi.mocked(getMe).mockResolvedValue({ ...staffProfile, permissions: [] })
      renderRoute('/open-store')

      expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem nội dung')
      expect(screen.queryByRole('link', { name: 'Mở gian hàng' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Gian hàng làm việc' })).not.toBeInTheDocument()
      expect(getPublicStore).not.toHaveBeenCalled()
      expect(getMyStore).not.toHaveBeenCalled()
    })

    test('opens the owned store when the account has both owner and staff roles', async () => {
      const ownedStore = { id: 'owned-store', name: 'Tiệm của tôi', status: 'ACTIVE' }
      vi.mocked(getMe).mockResolvedValue({
        ...staffProfile,
        roles: [...staffProfile.roles, 'OWNER'],
        permissions: [...staffProfile.permissions, 'STORE_STAFF_MANAGE'],
      })
      vi.mocked(getMyStore).mockResolvedValue(ownedStore)
      const user = renderRoute('/')

      await user.click(await screen.findByRole('link', { name: 'Gian hàng của tôi' }))

      expect(await screen.findByRole('heading', { name: ownedStore.name })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Nhân viên gian hàng' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Gian hàng làm việc' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Mở gian hàng' })).not.toBeInTheDocument()
      expect(getPublicStore).not.toHaveBeenCalled()
    })
  })

  describe('editing the store profile', () => {
    const myStore = {
      id: 'my-store',
      name: 'Tiệm sách cũ',
      description: 'Sách đã qua sử dụng',
      pickupAddress: '123 Main St',
      status: 'ACTIVE',
    }

    beforeEach(() => {
      setAccessToken('test-access-token')
      vi.mocked(getMyStore).mockResolvedValue(myStore)
    })

    test('prefills the profile, saves changes, and refreshes both store caches', async () => {
      const changes = {
        name: 'Tiệm sách mới',
        description: null,
        pickupAddress: myStore.pickupAddress,
      }
      vi.mocked(updateMyStore).mockResolvedValue({ ...myStore, ...changes })
      const user = renderRoute('/store')
      const publicStoreKey = ['stores', 'detail', myStore.id]
      queryClient.setQueryDefaults(['stores', 'mine'], { staleTime: 30_000 })
      queryClient.setQueryData(publicStoreKey, myStore)

      await user.click(await screen.findByRole('link', { name: 'Hồ sơ gian hàng' }))
      const name = await screen.findByRole('textbox', { name: 'Tên gian hàng' })
      const description = screen.getByRole('textbox', { name: 'Mô tả (tùy chọn)' })
      const save = screen.getByRole('button', { name: 'Lưu' })
      expect(name).toHaveValue(myStore.name)
      expect(description).toHaveValue(myStore.description)
      expect(screen.getByRole('textbox', { name: 'Địa chỉ lấy hàng (tùy chọn)' })).toHaveValue(
        myStore.pickupAddress,
      )
      expect(save).toBeDisabled()

      await user.clear(name)
      await user.type(name, ` ${changes.name} `)
      await user.clear(description)
      await user.click(save)

      expect(await screen.findByRole('heading', { name: changes.name })).toBeInTheDocument()
      expect(await screen.findByText('Đã lưu hồ sơ gian hàng.')).toHaveAttribute('role', 'status')
      expect(router.state.location.pathname).toBe('/store')
      expect(vi.mocked(updateMyStore).mock.calls[0][0]).toEqual(changes)
      expect(updateMyStore).toHaveBeenCalledOnce()
      expect(queryClient.getQueryState(publicStoreKey)?.isInvalidated).toBe(true)
    })

    test('shows a duplicate-name error and preserves the draft', async () => {
      vi.mocked(updateMyStore).mockRejectedValueOnce(
        Object.assign(new Error('Name taken'), { status: 409, code: 'STORE_NAME_TAKEN' }),
      )
      const user = renderRoute('/store/profile')
      const name = await screen.findByRole('textbox', { name: 'Tên gian hàng' })
      await user.clear(name)
      await user.type(name, 'Tên đã được dùng')
      await user.click(screen.getByRole('button', { name: 'Lưu' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Tên gian hàng này đã được sử dụng.',
      )
      expect(name).toHaveValue('Tên đã được dùng')
      expect(name).toHaveAttribute('aria-invalid', 'true')
      expect(router.state.location.pathname).toBe('/store/profile')
    })

    test('blocks edits when the store is locked', async () => {
      vi.mocked(getMyStore).mockResolvedValue({ ...myStore, status: 'BLOCKED' })
      renderRoute('/store/profile')

      expect(await screen.findByRole('alert')).toHaveTextContent('Gian hàng đang bị khóa.')
      expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
      expect(updateMyStore).not.toHaveBeenCalled()
    })

    test('can retry a failed store lookup', async () => {
      vi.mocked(getMyStore).mockRejectedValueOnce(new Error('Store lookup failed'))
      const user = renderRoute('/store/profile')

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Chưa tải được thông tin gian hàng.',
      )
      await user.click(screen.getByRole('button', { name: 'Thử lại' }))

      expect(await screen.findByRole('textbox', { name: 'Tên gian hàng' })).toHaveValue(
        myStore.name,
      )
    })
  })

  describe('listing store staff', () => {
    beforeEach(() => {
      setAccessToken('test-access-token')
      vi.mocked(getMe).mockResolvedValue({
        id: 'test-user',
        roles: ['OWNER'],
        permissions: ['STORE_STAFF_MANAGE'],
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('opens the staff list from the store overview and shows member details', async () => {
      vi.mocked(getMyStore).mockResolvedValue({ ...store, status: 'ACTIVE' })
      vi.mocked(getStoreStaff).mockResolvedValue([
        {
          id: 'staff-1',
          fullName: 'Nguyễn An',
          email: 'staff@example.com',
          permissions: ['PRODUCT_CREATE', 'STORE_WORKSPACE_ACCESS'],
        },
      ])
      const user = renderRoute('/store')

      await user.click(await screen.findByRole('link', { name: 'Nhân viên gian hàng' }))

      expect(await screen.findByRole('heading', { name: 'Nguyễn An' })).toBeInTheDocument()
      expect(screen.getByText('staff@example.com')).toBeInTheDocument()
      expect(screen.getByText('PRODUCT_CREATE, STORE_WORKSPACE_ACCESS')).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/store/staff')
    })

    test('shows an empty state when there are no staff members', async () => {
      vi.mocked(getStoreStaff).mockResolvedValue([])
      renderRoute('/store/staff')

      expect(await screen.findByRole('heading', { name: 'Chưa có nhân viên' })).toBeInTheDocument()
    })

    test('adds a staff member and reloads the list', async () => {
      const member = {
        id: 'staff-1',
        fullName: 'Nguyễn An',
        email: 'staff@example.com',
        permissions: ['STORE_WORKSPACE_ACCESS'],
      }
      vi.mocked(getStoreStaff).mockResolvedValueOnce([]).mockResolvedValue([member])
      vi.mocked(addStoreStaff).mockResolvedValueOnce(member)
      const user = renderRoute('/store/staff')

      const email = await screen.findByRole('textbox', { name: 'Email tài khoản nhân viên' })
      await user.type(email, member.email)
      await user.click(screen.getByRole('button', { name: 'Thêm nhân viên' }))

      expect(await screen.findByRole('heading', { name: member.fullName })).toBeInTheDocument()
      expect(await screen.findByText('Đã thêm nhân viên.')).toHaveAttribute('role', 'status')
      expect(email).toHaveValue('')
      expect(vi.mocked(addStoreStaff).mock.calls[0][0]).toEqual({ email: member.email })
      expect(addStoreStaff).toHaveBeenCalledOnce()
      expect(getStoreStaff).toHaveBeenCalledTimes(2)
    })

    test('rejects an invalid email before sending an add-staff request', async () => {
      vi.mocked(getStoreStaff).mockResolvedValue([])
      const user = renderRoute('/store/staff')
      const email = await screen.findByRole('textbox', { name: 'Email tài khoản nhân viên' })

      await user.type(email, 'invalid-email')
      await user.click(screen.getByRole('button', { name: 'Thêm nhân viên' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Vui lòng nhập email hợp lệ.')
      expect(addStoreStaff).not.toHaveBeenCalled()
    })

    test.each([
      { grantChat: true, permissions: ['CHAT_SEND'] },
      { grantChat: false, permissions: [] },
      { grantChat: false, permissions: ['PRODUCT_MANAGE_OWN'] },
    ])(
      'saves the selected permissions and reloads the staff list ($permissions)',
      async ({ grantChat, permissions }) => {
        const member = {
          id: 'staff-1',
          fullName: 'Nguyễn An',
          email: 'staff@example.com',
          permissions: ['PRODUCT_CREATE', 'STORE_WORKSPACE_ACCESS'],
        }
        const updated = { ...member, permissions: [...permissions, 'STORE_WORKSPACE_ACCESS'] }
        vi.mocked(getStoreStaff).mockResolvedValueOnce([member]).mockResolvedValue([updated])
        vi.mocked(updateStoreStaffPermissions).mockResolvedValueOnce(updated)
        const user = renderRoute('/store/staff')

        await user.click(await screen.findByRole('button', { name: 'Đổi quyền' }))
        expect(screen.getByRole('group', { name: 'Đổi quyền' })).toBeInTheDocument()
        const createListings = screen.getByRole('checkbox', { name: 'Đăng sản phẩm' })
        const sendMessages = screen.getByRole('checkbox', { name: 'Gửi tin nhắn' })
        const save = screen.getByRole('button', { name: 'Lưu' })
        expect(createListings).toBeChecked()
        expect(sendMessages).not.toBeChecked()
        expect(save).toBeDisabled()

        await user.click(createListings)
        await user.click(screen.getByRole('button', { name: 'Hủy' }))
        expect(updateStoreStaffPermissions).not.toHaveBeenCalled()
        await user.click(screen.getByRole('button', { name: 'Đổi quyền' }))
        expect(screen.getByRole('checkbox', { name: 'Đăng sản phẩm' })).toBeChecked()

        await user.click(screen.getByRole('checkbox', { name: 'Đăng sản phẩm' }))
        if (grantChat) await user.click(screen.getByRole('checkbox', { name: 'Gửi tin nhắn' }))
        if (permissions.includes('PRODUCT_MANAGE_OWN'))
          await user.click(screen.getByRole('checkbox', { name: 'Quản lý sản phẩm gian hàng' }))
        await user.click(screen.getByRole('button', { name: 'Lưu' }))

        expect(await screen.findByText('Đã cập nhật quyền nhân viên.')).toHaveAttribute(
          'role',
          'status',
        )
        expect(screen.getByText(updated.permissions.join(', '))).toBeInTheDocument()
        expect(screen.queryByRole('group', { name: 'Đổi quyền' })).not.toBeInTheDocument()
        expect(vi.mocked(updateStoreStaffPermissions).mock.calls[0][0]).toEqual({
          staffId: member.id,
          permissions,
        })
        expect(updateStoreStaffPermissions).toHaveBeenCalledOnce()
        expect(getStoreStaff).toHaveBeenCalledTimes(2)
      },
    )

    test('shows a field error and keeps the email when the account is already employed', async () => {
      vi.mocked(getStoreStaff).mockResolvedValue([])
      vi.mocked(addStoreStaff).mockRejectedValueOnce(
        Object.assign(new Error('Already employed'), {
          status: 409,
          code: 'STAFF_ALREADY_EMPLOYED',
        }),
      )
      const user = renderRoute('/store/staff')
      const email = await screen.findByRole('textbox', { name: 'Email tài khoản nhân viên' })

      await user.type(email, 'staff@example.com')
      await user.click(screen.getByRole('button', { name: 'Thêm nhân viên' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Tài khoản này đã là nhân viên của một gian hàng.',
      )
      expect(email).toHaveAttribute('aria-invalid', 'true')
      expect(email).toHaveValue('staff@example.com')
      expect(getStoreStaff).toHaveBeenCalledOnce()
    })

    test('blocks a user without staff management permission before making a request', async () => {
      vi.mocked(getMe).mockResolvedValue({ id: 'test-user', roles: ['USER'], permissions: [] })
      renderRoute('/store/staff')

      expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem nội dung')
      expect(getStoreStaff).not.toHaveBeenCalled()
    })

    test('handles a backend denial even when the session has staff management permission', async () => {
      vi.mocked(getStoreStaff).mockRejectedValueOnce(
        Object.assign(new Error('Forbidden'), {
          status: 403,
        }),
      )
      renderRoute('/store/staff')

      expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem nội dung')
      expect(getStoreStaff).toHaveBeenCalledOnce()
    })

    test('removes a staff member only after confirmation and reloads the list', async () => {
      const member = {
        id: 'staff-1',
        fullName: 'Nguyễn An',
        email: 'staff@example.com',
        permissions: ['STORE_WORKSPACE_ACCESS'],
      }
      vi.mocked(getStoreStaff).mockResolvedValueOnce([member]).mockResolvedValue([])
      vi.mocked(removeStoreStaff).mockResolvedValueOnce(undefined)
      const confirm = vi
        .spyOn(window, 'confirm')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
      const user = renderRoute('/store/staff')
      const button = await screen.findByRole('button', { name: 'Xóa nhân viên' })

      await user.click(button)
      expect(removeStoreStaff).not.toHaveBeenCalled()
      expect(screen.getByRole('heading', { name: member.fullName })).toBeInTheDocument()

      await user.click(button)
      expect(await screen.findByRole('heading', { name: 'Chưa có nhân viên' })).toBeInTheDocument()
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining(member.fullName))
      expect(vi.mocked(removeStoreStaff).mock.calls[0][0]).toEqual({ staffId: member.id })
      expect(removeStoreStaff).toHaveBeenCalledOnce()
      expect(getStoreStaff).toHaveBeenCalledTimes(2)
    })

    test('keeps the staff member visible when removal fails', async () => {
      const member = {
        id: 'staff-1',
        fullName: 'Nguyễn An',
        email: 'staff@example.com',
        permissions: ['STORE_WORKSPACE_ACCESS'],
      }
      vi.mocked(getStoreStaff).mockResolvedValue([member])
      vi.mocked(removeStoreStaff).mockRejectedValueOnce(new Error('Removal failed'))
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const user = renderRoute('/store/staff')
      const button = await screen.findByRole('button', { name: 'Xóa nhân viên' })

      await user.click(button)

      expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa nhân viên.')
      expect(screen.getByRole('heading', { name: member.fullName })).toBeInTheDocument()
      expect(button).toBeEnabled()
      expect(getStoreStaff).toHaveBeenCalledOnce()
    })

    test('shows the locked store warning for STORE_BLOCKED', async () => {
      vi.mocked(getStoreStaff).mockRejectedValueOnce(
        Object.assign(new Error('Blocked'), { status: 403, code: 'STORE_BLOCKED' }),
      )
      renderRoute('/store/staff')

      expect(await screen.findByRole('alert')).toHaveTextContent('Gian hàng tạm không khả dụng')
    })
  })

  describe('changing the account password', () => {
    async function fillPasswords(user) {
      const current = await screen.findByLabelText('Mật khẩu hiện tại')
      await user.type(current, 'old password')
      await user.type(screen.getByLabelText('Mật khẩu mới'), 'new password')
      await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'new password')
      await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
      return current
    }

    test('opens account settings from the profile and clears the form after saving', async () => {
      setAccessToken('test-access-token')
      vi.mocked(changePassword).mockResolvedValueOnce(undefined)
      const user = renderRoute('/profile')

      await user.click(await screen.findByRole('link', { name: 'Cài đặt tài khoản' }))
      const current = await fillPasswords(user)

      expect(await screen.findByRole('status')).toHaveTextContent('Đã đổi mật khẩu.')
      expect(router.state.location.pathname).toBe('/account/settings')
      expect(changePassword).toHaveBeenCalledOnce()
      expect(current).toHaveValue('')
      expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('')
      expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toHaveValue('')
    })

    test('shows the wrong-password error on the current password field and stays signed in', async () => {
      setAccessToken('test-access-token')
      vi.mocked(changePassword).mockRejectedValueOnce(
        Object.assign(new Error('Invalid credentials'), {
          status: 401,
          code: 'INVALID_CREDENTIALS',
        }),
      )
      const user = renderRoute('/account/settings')
      const current = await fillPasswords(user)

      expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu hiện tại không đúng.')
      expect(current).toHaveAccessibleDescription('Mật khẩu hiện tại không đúng.')
      expect(screen.queryByText('Đã đổi mật khẩu.')).not.toBeInTheDocument()
      expect(getAccessToken()).toBe('test-access-token')
      expect(router.state.location.pathname).toBe('/account/settings')
    })
  })

  describe('editing the current profile', () => {
    const profile = {
      id: 'test-user',
      fullName: 'Nguyễn Văn Chu',
      email: 'chu@example.com',
      phone: '0912345678',
      roles: ['USER'],
      permissions: ['PROFILE_MANAGE'],
    }

    beforeEach(() => {
      setAccessToken('test-access-token')
      vi.mocked(getMe).mockResolvedValue(profile)
    })

    test('opens the prefilled form, saves the profile and displays the updated name', async () => {
      const updatedProfile = { ...profile, fullName: 'Chu Nguyễn' }
      vi.mocked(updateMyProfile).mockImplementationOnce(async () => {
        vi.mocked(getMe).mockResolvedValue(updatedProfile)
        return updatedProfile
      })
      const user = renderRoute('/profile')

      await user.click(await screen.findByRole('link', { name: 'Chỉnh sửa hồ sơ' }))
      const name = await screen.findByRole('textbox', { name: 'Họ và tên' })
      expect(name).toHaveValue(profile.fullName)
      expect(screen.getByRole('textbox', { name: 'Số điện thoại' })).toHaveValue(profile.phone)

      await user.clear(name)
      await user.type(name, ' Chu Nguyễn ')
      await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

      expect(await screen.findByText('Đã lưu thay đổi hồ sơ.')).toHaveAttribute('role', 'status')
      expect(
        await screen.findByText(updatedProfile.fullName, { selector: 'dd' }),
      ).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/profile')
      expect(updateMyProfile).toHaveBeenCalledOnce()
      expect(vi.mocked(updateMyProfile).mock.calls[0][0]).toEqual({
        fullName: updatedProfile.fullName,
        phone: profile.phone,
      })
    })

    test('does not save a profile when the form is unchanged', async () => {
      const user = renderRoute('/profile/edit')
      const name = await screen.findByRole('textbox', { name: 'Họ và tên' })
      const save = screen.getByRole('button', { name: 'Lưu thay đổi' })

      expect(save).toBeDisabled()
      await user.type(name, 'x')
      expect(save).toBeEnabled()
      await user.keyboard('{Backspace}')
      expect(save).toBeDisabled()
      await user.click(save)

      expect(updateMyProfile).not.toHaveBeenCalled()
    })

    test('shows a duplicate phone error on the phone field', async () => {
      vi.mocked(updateMyProfile).mockRejectedValueOnce(
        Object.assign(new Error('Phone already exists'), {
          status: 409,
          code: 'PHONE_ALREADY_EXISTS',
        }),
      )
      const user = renderRoute('/profile/edit')
      const phone = await screen.findByRole('textbox', { name: 'Số điện thoại' })
      await user.clear(phone)
      await user.type(phone, '0987654321')
      await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Số điện thoại này đã được sử dụng.',
      )
      expect(phone).toHaveAttribute('aria-invalid', 'true')
      expect(phone).toHaveValue('0987654321')
      expect(router.state.location.pathname).toBe('/profile/edit')
    })

    test('shows forbidden feedback for a user without permission to edit', async () => {
      vi.mocked(getMe).mockResolvedValue({ ...profile, permissions: [] })
      renderRoute('/profile/edit')

      expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem nội dung')
      expect(screen.queryByRole('button', { name: 'Lưu thay đổi' })).not.toBeInTheDocument()
      expect(updateMyProfile).not.toHaveBeenCalled()
    })
  })

  test('retries loading the profile when session verification fails', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getMe)
      .mockRejectedValueOnce(new Error('Profile unavailable'))
      .mockResolvedValue({
        id: 'test-user',
        fullName: 'Nguyễn Văn Chu',
        email: 'chu@example.com',
        roles: ['USER'],
      })
    const user = renderRoute('/profile')

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể hiển thị trang')
    expect(screen.queryByRole('heading', { name: 'Hồ sơ của tôi' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(await screen.findByRole('heading', { name: 'Hồ sơ của tôi' })).toBeInTheDocument()
  })

  test('redirects a guest to login and returns to the complete protected URL after sign-in', async () => {
    vi.mocked(login).mockResolvedValue({ accessToken: 'test-access-token' })
    const path = '/test-private?tab=orders#recent'
    const user = renderRoute(path, routesWithPrivatePage)

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toEqual({ from: path })
    expect(screen.queryByRole('heading', { name: 'Test private page' })).not.toBeInTheDocument()
    expect(getMe).not.toHaveBeenCalled()

    await submitLogin(user)

    expect(await screen.findByRole('heading', { name: 'Test private page' })).toBeInTheDocument()
    expect(router.state.location).toMatchObject({
      pathname: '/test-private',
      search: '?tab=orders',
      hash: '#recent',
    })
  })

  test('waits for profile verification before showing protected content', async () => {
    setAccessToken('test-access-token')
    const profile = Promise.withResolvers()
    vi.mocked(getMe).mockReturnValueOnce(profile.promise)
    renderRoute('/test-private', routesWithPrivatePage)

    expect(await screen.findByRole('status')).toHaveTextContent('Đang tải trang…')
    expect(screen.queryByRole('heading', { name: 'Test private page' })).not.toBeInTheDocument()

    profile.resolve({ id: 'test-user', roles: ['USER'] })

    expect(await screen.findByRole('heading', { name: 'Test private page' })).toBeInTheDocument()
  })

  test('shows forbidden feedback without clearing the session when profile verification returns 403', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getMe).mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }))
    renderRoute('/test-private', routesWithPrivatePage)

    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xem nội dung')
    expect(screen.queryByRole('heading', { name: 'Test private page' })).not.toBeInTheDocument()
    expect(getAccessToken()).toBe('test-access-token')
  })

  test('waits to verify a saved session before redirecting away from login', async () => {
    setAccessToken('test-access-token')
    const profile = Promise.withResolvers()
    vi.mocked(getMe).mockReturnValueOnce(profile.promise)
    renderRoute('/login')

    await waitFor(() => expect(getMe).toHaveBeenCalledOnce())
    expect(screen.getByText('Đang tải trang…')).toHaveAttribute('role', 'status')
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')

    profile.resolve({ id: 'test-user', roles: ['USER'] })

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument()
  })

  test('keeps the saved token and allows retry when checking the session fails', async () => {
    setAccessToken('test-access-token')
    vi.mocked(getMe).mockRejectedValueOnce(new Error('Profile unavailable'))
    const user = renderRoute('/login')

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể hiển thị trang')
    expect(getAccessToken()).toBe('test-access-token')
    expect(router.state.location.pathname).toBe('/login')

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  test('shows the login form when the saved access token is cleared during verification', async () => {
    setAccessToken('test-access-token')
    const profile = Promise.withResolvers()
    vi.mocked(getMe).mockReturnValueOnce(profile.promise)
    renderRoute('/login')

    await waitFor(() => expect(getMe).toHaveBeenCalledOnce())
    expect(router.state.location.pathname).toBe('/login')

    act(() => clearAccessToken())

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')

    await act(async () => {
      profile.resolve({ id: 'test-user', roles: ['USER'] })
    })
    expect(router.state.location.pathname).toBe('/login')
  })

  test('validates login fields on blur and clears a corrected email error', async () => {
    const user = renderRoute('/login')
    const email = await screen.findByRole('textbox', { name: 'Email' })
    const password = screen.getByLabelText('Mật khẩu')

    await user.type(email, 'abc')
    await user.tab()

    expect(await screen.findByText('Email không đúng định dạng.')).toBeInTheDocument()
    expect(email).toHaveAccessibleDescription('Email không đúng định dạng.')
    expect(password).toHaveFocus()

    await user.tab()
    expect(await screen.findByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()

    await user.clear(email)
    await user.type(email, 'chu@example.com')
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'false'))
    expect(screen.queryByText('Email không đúng định dạng.')).not.toBeInTheDocument()
  })

  test('stores the access token and waits for the profile before returning to the requested route', async () => {
    const profile = { id: 'test-user', roles: ['USER'] }
    let resolveProfile
    vi.mocked(login).mockResolvedValue({ accessToken: 'test-access-token' })
    vi.mocked(getMe).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProfile = resolve
        }),
    )
    const user = renderRoute({ pathname: '/login', state: { from: '/products' } })

    await submitLogin(user)

    expect(login).toHaveBeenCalledExactlyOnceWith(loginCredentials)
    await waitFor(() => expect(getMe).toHaveBeenCalledOnce())
    expect(getAccessToken()).toBe('test-access-token')
    expect(screen.getByRole('button', { name: 'Đang đăng nhập…' })).toBeDisabled()
    expect(router.state.location.pathname).toBe('/login')

    resolveProfile(profile)

    await waitFor(() => expect(router.state.location.pathname).toBe('/products'))
    expect(queryClient.getQueryData(['users', 'me'])).toEqual(profile)
  })

  test('shows invalid credentials and preserves the entered email', async () => {
    vi.mocked(login).mockRejectedValue(
      Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' }),
    )
    const user = renderRoute('/login')

    await submitLogin(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(loginCredentials.email)
    expect(getMe).not.toHaveBeenCalled()
    expect(getAccessToken()).toBeNull()
    expect(router.state.location.pathname).toBe('/login')
  })

  test('clears the local session when loading the profile fails after login', async () => {
    vi.mocked(login).mockResolvedValue({ accessToken: 'test-access-token' })
    vi.mocked(getMe).mockRejectedValue(new Error('Profile unavailable'))
    const user = renderRoute('/login')

    await submitLogin(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chưa thể đăng nhập. Vui lòng thử lại.',
    )
    expect(getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['users', 'me'])).toBeUndefined()
    expect(router.state.location.pathname).toBe('/login')
  })

  test('restores the current user profile on entry when an access token is stored', async () => {
    setAccessToken('test-access-token')
    renderRoute('/')

    await waitFor(() => {
      expect(queryClient.getQueryData(['users', 'me'])).toEqual({
        id: 'test-user',
        roles: ['USER'],
      })
    })
    expect(getMe).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument()
  })

  test('does not request a profile when entering as a guest', async () => {
    renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Hồ sơ của tôi' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Mở gian hàng' })).not.toBeInTheDocument()
    expect(getMe).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(['users', 'me'])).toBeUndefined()
  })

  test('clears local session, waits for refresh, and signs out from the main navigation', async () => {
    setAccessToken('test-access-token')
    const refresh = Promise.withResolvers()
    const logoutResponse = Promise.withResolvers()
    vi.mocked(waitForPendingRefresh).mockReturnValue(refresh.promise)
    vi.mocked(logout).mockReturnValue(logoutResponse.promise)
    const user = renderRoute('/')
    queryClient.setQueryData(['users', 'me'], { id: 'test-user' })

    const button = await screen.findByRole('button', { name: 'Đăng xuất' })
    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).not.toBeInTheDocument()
    await user.click(button)

    expect(getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['users', 'me'])).toBeUndefined()
    expect(screen.getByRole('button', { name: 'Đang đăng xuất…' })).toBeDisabled()
    expect(waitForPendingRefresh).toHaveBeenCalledOnce()
    expect(logout).not.toHaveBeenCalled()

    refresh.resolve()
    await waitFor(() => expect(logout).toHaveBeenCalledOnce())
    expect(router.state.location.pathname).toBe('/')

    logoutResponse.resolve()
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  test('returns to login and clears local session even when logout fails', async () => {
    setAccessToken('test-access-token')
    vi.mocked(logout).mockRejectedValue(new Error('Offline'))
    const user = renderRoute('/')
    queryClient.setQueryData(['users', 'me'], { id: 'test-user' })

    await user.click(await screen.findByRole('button', { name: 'Đăng xuất' }))

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledOnce()
    expect(getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(['users', 'me'])).toBeUndefined()
    expect(router.state.location.pathname).toBe('/login')
  })

  test('shows an unknown URL as 404 and lets the user navigate home', async () => {
    const user = renderRoute('/unknown-page')
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/unknown-page')

    await user.click(screen.getByRole('link', { name: 'Về trang chủ' }))

    expect(
      await screen.findByRole('heading', { name: 'Món đồ cũ, khởi đầu mới.' }),
    ).toBeInTheDocument()
  })

  test('navigates from the 404 search form with the term in the URL', async () => {
    const user = renderRoute('/missing')
    const search = await screen.findByRole('searchbox', { name: 'Tìm kiếm sản phẩm' })

    await user.type(search, 'áo cũ')
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm sản phẩm' }))

    expect(await screen.findByRole('heading', { name: 'Khám phá sản phẩm' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products')
    expect(new URLSearchParams(router.state.location.search).get('q')).toBe('áo cũ')
  })

  test('switches translated content and the document language together', async () => {
    const user = renderRoute('/')
    await screen.findByRole('heading', { name: 'Món đồ cũ, khởi đầu mới.' })

    await user.click(screen.getByRole('button', { name: 'Ngôn ngữ: English' }))

    expect(
      await screen.findByRole('heading', { name: 'Pre-loved finds, new beginnings.' }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')

    await user.click(screen.getByRole('button', { name: 'Language: Tiếng Việt' }))
    expect(
      await screen.findByRole('heading', { name: 'Món đồ cũ, khởi đầu mới.' }),
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'vi')
  })

  test('catches lazy loading failures without exposing internal error details', async () => {
    renderRoute('/broken', [
      {
        ...routes[0],
        children: [
          {
            path: 'broken',
            lazy: async () => {
              throw new Error('Internal chunk loading details')
            },
          },
        ],
      },
    ])

    expect(
      await screen.findByRole('heading', { name: 'Không thể hiển thị trang' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('Internal chunk loading details')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải lại trang' })).toBeInTheDocument()
  })

  test('keeps the keyword and sort order when moving to the next page', async () => {
    vi.mocked(searchProducts).mockImplementation(async ({ page }) => ({
      items: [{ ...product, title: `Product on page ${page}` }],
      page,
      size: 1,
      totalElements: 2,
      totalPages: 2,
      totalCapped: false,
      facets: null,
      hasNext: page === 1,
    }))

    const user = renderRoute('/products?q=ao&sort=price_asc&size=1')

    await screen.findByText('Trang 1')
    expect(screen.getByRole('button', { name: 'Trước' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Sau' }))

    expect(await screen.findByText('Product on page 2')).toBeInTheDocument()
    expect(searchProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'ao', sort: 'price_asc', size: 1, page: 2 }),
    )
    expect(screen.getByRole('button', { name: 'Sau' })).toBeDisabled()
  })
})
