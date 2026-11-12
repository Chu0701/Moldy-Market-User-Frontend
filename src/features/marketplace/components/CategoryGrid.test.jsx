import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import '@/i18n'
import { CategoryCard } from '@/features/marketplace/components/CategoryCard'
import { CategoryGrid } from '@/features/marketplace/components/CategoryGrid'
import { CategorySkeleton } from '@/features/marketplace/components/CategorySkeleton'
import { ErrorState } from '@/components/feedback/ErrorState'

describe('category presentation', () => {
  test('displays the supplied category name as a navigable card', () => {
    render(
      <MemoryRouter>
        <CategoryGrid>
          <CategoryCard
            name="Test category"
            to="/categories/a8098c1a-f86e-11da-bd1a-00112444be1e"
          />
        </CategoryGrid>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Khám phá danh mục' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Test category' })).toHaveAttribute(
      'href',
      '/categories/a8098c1a-f86e-11da-bd1a-00112444be1e',
    )
  })

  test('announces loading without exposing decorative skeletons as content', () => {
    render(<CategorySkeleton />)
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải danh mục')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('allows retrying a failed section and prevents duplicate retries while pending', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = render(
      <ErrorState title="Load failed" description="Please try again" onRetry={onRetry} />,
    )

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(onRetry).toHaveBeenCalledTimes(1)

    rerender(
      <ErrorState
        title="Load failed"
        description="Please try again"
        onRetry={onRetry}
        isRetrying
      />,
    )
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'true')
  })
})
