import { render, screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import i18n from '@/i18n'
import { StoreOrderProgress } from './StoreOrderProgress'

beforeEach(() => i18n.changeLanguage('vi'))

test('shows recorded milestones in chronological order without inventing later steps', () => {
  render(
    <StoreOrderProgress
      order={{
        id: 'one',
        status: 'CONFIRMED',
        createdAt: '2026-11-22T02:00:00Z',
        confirmedAt: '2026-11-22T03:00:00Z',
        returnDeadline: '2026-12-01T03:00:00Z',
      }}
      canConfirm
    />,
  )
  const list = screen.getByRole('list', { name: 'Các mốc đã ghi nhận' })
  const rows = within(list).getAllByRole('listitem')
  expect(rows).toHaveLength(2)
  expect(rows[0]).toHaveTextContent('Đã tạo đơn')
  expect(rows[1]).toHaveTextContent('Đã xác nhận')
  expect(list.querySelectorAll('time')[1]).toHaveAttribute('datetime', '2026-11-22T03:00:00Z')
  expect(screen.queryByText('Đã bắt đầu giao')).not.toBeInTheDocument()
  expect(screen.getByText(/Admin cập nhật giao hàng/)).toBeInTheDocument()
})

test('staff waits for owner confirmation while owner can confirm COD', () => {
  const { rerender } = render(
    <StoreOrderProgress
      order={{
        id: 'one',
        status: 'PENDING_CONFIRMED',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
      }}
      canConfirm={false}
    />,
  )
  expect(screen.getByText(/Chờ chủ gian hàng xác nhận đơn COD/)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(
    <StoreOrderProgress
      order={{
        id: 'one',
        status: 'PENDING_CONFIRMED',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
      }}
      canConfirm
    />,
  )
  expect(screen.getByText(/Chủ gian hàng có thể xác nhận đơn COD/)).toBeInTheDocument()
})

test('delivery does not imply completion or COD collection', () => {
  render(
    <StoreOrderProgress
      order={{ id: 'one', status: 'DELIVERED', deliveredAt: '2026-11-22T05:00:00Z' }}
    />,
  )
  expect(screen.getByText(/chưa đồng nghĩa đã hoàn tất hoặc đã thu tiền COD/)).toBeInTheDocument()
  expect(screen.queryByText('Đã hoàn tất')).not.toBeInTheDocument()
})

test('cancelled orders retain earlier real milestones without claiming a refund', () => {
  render(
    <StoreOrderProgress
      order={{
        id: 'one',
        status: 'CANCELLED',
        createdAt: '2026-11-22T01:00:00Z',
        cancelledAt: '2026-11-22T03:00:00Z',
      }}
    />,
  )
  const rows = screen.getAllByRole('listitem')
  expect(rows).toHaveLength(2)
  expect(rows[1]).toHaveTextContent('Đã hủy')
  expect(screen.getByText(/không tự suy ra đã hoàn tiền/)).toBeInTheDocument()
})

test('missing or malformed dates do not become completed milestones', () => {
  render(
    <StoreOrderProgress
      order={{
        id: 'one',
        status: 'SHIPPING',
        createdAt: null,
        confirmedAt: '',
        shippedAt: 'broken date',
      }}
    />,
  )
  expect(screen.getByText('Chưa có mốc thời gian được ghi nhận.')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

test.each(['NEW_STATUS', 'toString'])(
  'unknown status %s has no assumed workflow action',
  (status) => {
    render(<StoreOrderProgress order={{ id: 'one', status }} />)
    expect(
      screen.getByText(
        'Trạng thái này chưa có hướng dẫn xử lý. Làm mới để kiểm tra dữ liệu mới nhất.',
      ),
    ).toBeInTheDocument()
  },
)

test('a recorded completion uses its own timestamp and never labels it COD payment', () => {
  render(
    <StoreOrderProgress
      order={{
        id: 'one',
        status: 'COMPLETED',
        createdAt: '2026-11-22T01:00:00Z',
        completedAt: '2026-11-22T06:00:00Z',
      }}
    />,
  )
  expect(screen.getByText('Đã hoàn tất')).toBeInTheDocument()
  expect(screen.queryByText('Đã thu tiền COD')).not.toBeInTheDocument()
})
