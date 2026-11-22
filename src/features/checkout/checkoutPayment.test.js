import { expect, test } from 'vitest'
import {
  getCheckoutStage,
  getCheckoutErrorKey,
  getSafeQrUrl,
  isAmbiguousCheckoutError,
  remainingSeconds,
} from './checkoutPayment'

const snapshot = (status, paymentStatus, method = 'ONLINE_BANKING') => ({
  status,
  paymentResponse: { paymentStatus, method },
})
test.each([
  ['PENDING_PAYMENT', 'PENDING', 'ONLINE_BANKING', 'bankPending'],
  ['PAY_ON_DELIVERY', 'PENDING', 'COD', 'codPending'],
  ['PAID', 'SUCCESSFUL', 'COD', 'paid'],
  ['PAID', 'SUCCESSFUL', 'ONLINE_BANKING', 'paid'],
  ['EXPIRED', 'FAILED', 'ONLINE_BANKING', 'expired'],
  ['CANCELLED', 'FAILED', 'COD', 'cancelled'],
  ['PENDING_PAYMENT', 'FAILED', 'ONLINE_BANKING', 'failed'],
  ['PENDING_PAYMENT', 'SUCCESSFUL', 'ONLINE_BANKING', 'syncing'],
  ['PAID', 'PENDING', 'COD', 'syncing'],
  ['FUTURE', 'PENDING', 'COD', 'unknown'],
])('maps only server states %s/%s/%s to %s', (status, payment, method, expected) => {
  expect(getCheckoutStage(snapshot(status, payment, method))).toBe(expected)
})
test('missing payment or method does not imply a paid or COD checkout', () => {
  expect(getCheckoutStage({ status: 'PAID' })).toBe('unknown')
  expect(getCheckoutStage(snapshot('PENDING_PAYMENT', 'PENDING', null))).toBe('unknown')
})
test('remaining seconds is a clock hint with an exact deadline and no invented time', () => {
  const deadline = '2026-11-20T03:00:00Z'
  const now = Date.parse(deadline)
  expect(remainingSeconds(deadline, now - 1001)).toBe(2)
  expect(remainingSeconds(deadline, now)).toBe(0)
  expect(remainingSeconds(deadline, now + 1)).toBe(0)
  expect(remainingSeconds(null, now)).toBeNull()
  expect(remainingSeconds('invalid', now)).toBeNull()
})
test('QR uses the untouched backend HTTPS image URL and rejects executable or insecure URLs', () => {
  const url = 'https://vietqr.app/img?amount=120000&des=MM12345678'
  expect(getSafeQrUrl(url)).toBe(url)
  for (const value of [
    null,
    '/image',
    'http://example.com/a',
    'javascript:alert(1)',
    'data:image/svg+xml,test',
  ])
    expect(getSafeQrUrl(value)).toBeNull()
})
test('unconfirmed write failures require checking existing orders instead of auto-resubmitting', () => {
  expect(isAmbiguousCheckoutError({ status: null })).toBe(true)
  expect(isAmbiguousCheckoutError({ status: 502 })).toBe(true)
  expect(isAmbiguousCheckoutError({ status: 409 })).toBe(false)
  expect(getCheckoutErrorKey({ code: 'PRODUCT_RESERVED', status: 409 })).toBe('checkout.reserved')
  expect(getCheckoutErrorKey({ code: 'CHECKOUT_OWN_PRODUCT', status: 403 })).toBe(
    'checkout.ownProduct',
  )
})
