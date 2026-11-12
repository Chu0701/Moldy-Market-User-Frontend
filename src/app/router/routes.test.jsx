import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { RequireAuth } from '@/app/router/RequireAuth'
import { routes } from '@/app/router/routes'
import i18n from '@/i18n'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { waitForPendingRefresh } from '@/services/api/authRefreshInterceptor'
import { login, logout } from '@/services/auth/authService'
import { getCategoryTree } from '@/services/categories/categoryService'
import { searchProducts } from '@/services/products/productService'
import { getMe } from '@/services/users/userService'

vi.mock('@/services/api/authRefreshInterceptor', () => ({ waitForPendingRefresh: vi.fn() }))
vi.mock('@/services/auth/authService', () => ({ login: vi.fn(), logout: vi.fn() }))
vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))
vi.mock('@/services/categories/categoryService', () => ({ getCategoryTree: vi.fn() }))
vi.mock('@/services/products/productService', () => ({ searchProducts: vi.fn() }))

let router
let queryClient

beforeEach(() => {
  vi.mocked(waitForPendingRefresh).mockReset().mockResolvedValue(undefined)
  vi.mocked(login).mockReset()
  vi.mocked(logout).mockReset()
  vi.mocked(getMe)
    .mockReset()
    .mockResolvedValue({ id: 'test-user', roles: ['USER'] })
  vi.mocked(getCategoryTree).mockReset().mockResolvedValue([])
  vi.mocked(searchProducts).mockReset().mockResolvedValue({ items: [] })
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
  const product = {
    id: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
    title: 'Test product',
    price: 250000,
    condition: 'LIKE_NEW',
    images: [],
  }

  test('displays the newest product and navigates to its detail placeholder', async () => {
    vi.mocked(searchProducts).mockResolvedValue({ items: [product] })
    const user = renderRoute('/')

    expect(await screen.findByRole('link', { name: /Test product/ })).toHaveAttribute(
      'href',
      `/products/${product.id}`,
    )
    expect(screen.getByText('Như mới')).toBeInTheDocument()
    expect(screen.getByText(/250\.000/)).toHaveTextContent(/250\.000\s*₫/)
    expect(screen.getByText('Chưa có ảnh sản phẩm')).toBeInTheDocument()
    const header = screen.getByRole('banner')
    await user.click(screen.getByRole('link', { name: /Test product/ }))

    expect(await screen.findByRole('heading', { name: 'Chi tiết sản phẩm' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/products/${product.id}`)
    expect(screen.getByRole('banner')).toBe(header)
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
    const user = renderRoute('/')

    expect(await screen.findByRole('link', { name: 'Test category' })).toHaveAttribute(
      'href',
      `/categories/${id}`,
    )
    const header = screen.getByRole('banner')
    await user.click(screen.getByRole('link', { name: 'Test category' }))

    expect(
      await screen.findByRole('heading', { name: 'Sản phẩm theo danh mục' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/categories/${id}`)
    expect(screen.getByRole('banner')).toBe(header)
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

    await user.click(screen.getByRole('link', { name: 'Khám phá sản phẩm' }))

    expect(await screen.findByRole('heading', { name: 'Khám phá sản phẩm' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products')
    expect(screen.getByRole('banner')).toBe(header)
    expect(screen.getByRole('link', { name: 'Khám phá sản phẩm' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('uses the auth layout and navigates to the register placeholder', async () => {
    const user = renderRoute('/login')
    await screen.findByRole('heading', { name: 'Đăng nhập' })
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Đăng ký' }))

    expect(await screen.findByRole('heading', { name: 'Đăng ký' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/register')
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
