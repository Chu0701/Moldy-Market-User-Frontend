import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import '@/i18n'
import { RequireRole } from '@/app/router/RequireRole'
import { useSession } from '@/features/auth/hooks/useSession'

vi.mock('@/features/auth/hooks/useSession', () => ({ useSession: vi.fn() }))

function renderProtectedPage() {
  const router = createMemoryRouter(
    [
      {
        Component: RequireRole,
        children: [{ path: '/appraiser/queue', element: <h1>Appraiser content</h1> }],
      },
    ],
    { initialEntries: ['/appraiser/queue'] },
  )

  return render(<RouterProvider router={router} />)
}

describe('RequireRole', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      profileQuery: { isPending: false, data: { roles: ['USER'] } },
    })
  })

  test('blocks users without the APPRAISER role', () => {
    renderProtectedPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Không có quyền xem nội dung')
    expect(screen.queryByRole('heading', { name: 'Appraiser content' })).not.toBeInTheDocument()
  })

  test('allows users with the APPRAISER role', () => {
    vi.mocked(useSession).mockReturnValue({
      profileQuery: { isPending: false, data: { roles: ['USER', 'APPRAISER'] } },
    })
    renderProtectedPage()

    expect(screen.getByRole('heading', { name: 'Appraiser content' })).toBeInTheDocument()
  })
})
