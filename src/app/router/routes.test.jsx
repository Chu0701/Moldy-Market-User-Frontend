import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { routes } from '@/app/router/routes'
import i18n from '@/i18n'
import { getCategoryTree } from '@/services/categories/categoryService'

vi.mock('@/services/categories/categoryService', () => ({ getCategoryTree: vi.fn() }))

let router
let queryClient

beforeEach(() => {
  vi.mocked(getCategoryTree).mockReset().mockResolvedValue([])
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
  router?.dispose()
  queryClient?.clear()
  await i18n.changeLanguage('vi')
  document.documentElement.lang = 'vi'
})

describe('user app routing', () => {
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
    await screen.findByRole('heading', { name: 'Trang chủ' })
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

  test('shows an unknown URL as 404 and lets the user navigate home', async () => {
    const user = renderRoute('/unknown-page')
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy trang' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/unknown-page')

    await user.click(screen.getByRole('link', { name: 'Về trang chủ' }))

    expect(await screen.findByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument()
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
    await screen.findByRole('heading', { name: 'Trang chủ' })

    await user.click(screen.getByRole('button', { name: 'Ngôn ngữ: English' }))

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')

    await user.click(screen.getByRole('button', { name: 'Language: Tiếng Việt' }))
    expect(await screen.findByRole('heading', { name: 'Trang chủ' })).toBeInTheDocument()
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
})
