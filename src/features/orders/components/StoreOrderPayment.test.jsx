import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import i18n from '@/i18n'
import { StoreOrderPayment } from './StoreOrderPayment'

beforeEach(() => i18n.changeLanguage('vi'))

test('confirmed COD remains uncollected rather than being labelled paid', () => {
  render(
    <StoreOrderPayment
      order={{ status: 'CONFIRMED', paymentMethod: 'COD', paymentStatus: 'PENDING' }}
    />,
  )
  expect(screen.getByText('Thanh toán khi nhận hàng (COD)')).toBeInTheDocument()
  expect(screen.getByText('Chưa thu tiền')).toBeInTheDocument()
  expect(screen.queryByText('Đã thu tiền')).not.toBeInTheDocument()
})

test('COD collected shows the order paidAt and never a checkout timestamp', () => {
  const { container } = render(
    <StoreOrderPayment
      order={{ paymentMethod: 'COD', paymentStatus: 'SUCCESSFUL', paidAt: '2026-11-22T03:00:00Z' }}
    />,
  )
  expect(screen.getByText('Đã thu tiền')).toBeInTheDocument()
  expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-11-22T03:00:00Z')
})

test('unpaid cancelled COD is not described as a refund or banking failure', () => {
  render(
    <StoreOrderPayment
      order={{ status: 'CANCELLED', paymentMethod: 'COD', paymentStatus: 'FAILED' }}
    />,
  )
  expect(screen.getByText('Không tiếp tục thu tiền')).toBeInTheDocument()
  expect(screen.queryByText('Đã hoàn tiền')).not.toBeInTheDocument()
})

test.each([
  ['PENDING', 'Chờ thanh toán'],
  ['PROCESSING', 'Đang xử lý thanh toán'],
  ['SUCCESSFUL', 'Đã thanh toán'],
  ['FAILED', 'Thanh toán chưa thành công'],
])('online %s follows the payment field', (paymentStatus, text) => {
  render(
    <StoreOrderPayment
      order={{ status: 'CONFIRMED', paymentMethod: 'ONLINE_BANKING', paymentStatus }}
    />,
  )
  expect(screen.getByText('Chuyển khoản ngân hàng')).toBeInTheDocument()
  expect(screen.getByText(text)).toBeInTheDocument()
})

test('missing and unknown metadata never infer payment from completed status or paidAt', () => {
  const { container, rerender } = render(
    <StoreOrderPayment order={{ status: 'COMPLETED', paidAt: '2026-11-22T03:00:00Z' }} />,
  )
  expect(screen.getAllByText('Chưa có thông tin')).toHaveLength(2)
  expect(container.querySelector('time')).not.toBeInTheDocument()
  rerender(
    <StoreOrderPayment order={{ paymentMethod: 'FUTURE_METHOD', paymentStatus: 'toString' }} />,
  )
  expect(screen.getAllByText('Chưa có thông tin')).toHaveLength(2)
})
