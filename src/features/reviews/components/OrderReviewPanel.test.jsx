import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import '@/i18n'
import { OrderReviewPanel } from '@/features/reviews/components/OrderReviewPanel'
import { createStoreReview, getOrderReview } from '@/services/reviews/reviewService'

vi.mock('@/services/reviews/reviewService', () => ({
  createStoreReview: vi.fn(),
  getOrderReview: vi.fn(),
  getStoreReviews: vi.fn(),
}))

function renderPanel(order) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <OrderReviewPanel order={order} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

describe('OrderReviewPanel', () => {
  beforeEach(() => {
    vi.mocked(getOrderReview).mockReset()
    vi.mocked(createStoreReview).mockReset()
  })

  test('allows buyer to rate and review a completed order', async () => {
    vi.mocked(getOrderReview).mockResolvedValue(null)
    vi.mocked(createStoreReview).mockResolvedValue({
      id: 'rev-1',
      orderId: 'order-1',
      storeId: 'store-1',
      rating: 4,
      comment: 'Đóng gói kỹ, đúng mô tả',
    })

    const user = renderPanel({ id: 'order-1', status: 'COMPLETED' })

    expect(await screen.findByRole('heading', { name: 'Đánh giá người bán' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Chọn 4 sao' }))
    await user.type(screen.getByLabelText('Nhận xét (tùy chọn)'), 'Đóng gói kỹ, đúng mô tả')
    await user.click(screen.getByRole('button', { name: 'Gửi đánh giá' }))

    expect(createStoreReview).toHaveBeenCalledWith({
      orderId: 'order-1',
      rating: 4,
      comment: 'Đóng gói kỹ, đúng mô tả',
    })
    expect(await screen.findByText('Đóng gói kỹ, đúng mô tả')).toBeInTheDocument()
    expect(screen.getByText('4 / 5')).toBeInTheDocument()
  })

  test('renders nothing when order is not completed', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <OrderReviewPanel order={{ id: 'order-2', status: 'DELIVERED' }} />
      </QueryClientProvider>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(getOrderReview).not.toHaveBeenCalled()
  })
})
