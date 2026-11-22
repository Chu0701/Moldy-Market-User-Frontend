import { expect, test } from 'vitest'
import { getCancellableCheckoutOrder, getCancelCheckoutErrorKey } from './cancelCheckout'

const pending = {
  id: 'group',
  status: 'PENDING_PAYMENT',
  paymentResponse: { method: 'ONLINE_BANKING', paymentStatus: 'PENDING' },
  orders: ['first', 'second'].map((id) => ({
    id,
    checkoutGroupId: 'group',
    buyerId: 'buyer',
    status: 'PENDING_PAYMENT',
  })),
}

test('selects one order to cancel the whole unpaid bank checkout, even after the local countdown ends', () => {
  expect(getCancellableCheckoutOrder({ ...pending, expiredAt: '2000-01-01' }, 'buyer')).toBe(
    'first',
  )
})

test.each([
  { ...pending, status: 'CANCELLED' },
  { ...pending, status: 'EXPIRED' },
  { ...pending, status: 'PAID' },
  {
    ...pending,
    status: 'PAY_ON_DELIVERY',
    paymentResponse: { method: 'COD', paymentStatus: 'PENDING' },
  },
  { ...pending, paymentResponse: { method: 'ONLINE_BANKING', paymentStatus: 'PROCESSING' } },
  { ...pending, paymentResponse: { method: 'ONLINE_BANKING', paymentStatus: 'SUCCESSFUL' } },
  { ...pending, orders: [] },
  { ...pending, orders: [{ ...pending.orders[0], status: 'CONFIRMED' }] },
  { ...pending, orders: [{ ...pending.orders[0], checkoutGroupId: 'other' }] },
  { ...pending, orders: [{ ...pending.orders[0], id: null }] },
])('rejects ineligible or inconsistent server snapshots %#', (checkout) => {
  expect(getCancellableCheckoutOrder(checkout, 'buyer')).toBeNull()
})

test('requires the current buyer for every order', () => {
  expect(getCancellableCheckoutOrder(pending, 'other')).toBeNull()
  expect(getCancellableCheckoutOrder(pending, undefined)).toBeNull()
})

test('distinguishes an uncertain network result from a changed server state', () => {
  expect(getCancelCheckoutErrorKey({ status: 500 })).toBe('checkoutCancel.uncertain')
  expect(getCancelCheckoutErrorKey({ code: 'FE_NETWORK_ERROR' })).toBe('checkoutCancel.uncertain')
  expect(getCancelCheckoutErrorKey({ status: 400, code: 'INVALID_ORDER_STATE' })).toBe(
    'checkoutCancel.stateChanged',
  )
  expect(getCancelCheckoutErrorKey({ status: 404 })).toBe('checkoutCancel.unavailable')
})
