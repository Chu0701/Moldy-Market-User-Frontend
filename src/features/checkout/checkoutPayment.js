export function getCheckoutStage(checkout) {
  const payment = checkout?.paymentResponse
  if (!payment || !['COD', 'ONLINE_BANKING'].includes(payment.method)) return 'unknown'
  if (payment.paymentStatus === 'SUCCESSFUL') return checkout.status === 'PAID' ? 'paid' : 'syncing'
  if (checkout.status === 'PAID') return 'syncing'
  if (checkout.status === 'EXPIRED') return 'expired'
  if (checkout.status === 'CANCELLED') return 'cancelled'
  if (payment.paymentStatus === 'FAILED') return 'failed'
  if (payment.paymentStatus === 'PENDING' || payment.paymentStatus === 'PROCESSING') {
    if (payment.method === 'COD' && checkout.status === 'PAY_ON_DELIVERY') return 'codPending'
    if (payment.method === 'ONLINE_BANKING' && checkout.status === 'PENDING_PAYMENT')
      return 'bankPending'
  }
  return 'unknown'
}

export function remainingSeconds(deadline, now) {
  if (!deadline || !Number.isFinite(Date.parse(deadline))) return null
  return Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000))
}

export function getSafeQrUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? value : null
  } catch {
    return null
  }
}

export function isAmbiguousCheckoutError(error) {
  return Boolean(error) && (!error.status || error.status >= 500)
}

const errorKeys = {
  PRODUCT_RESERVED: 'checkout.reserved',
  CHECKOUT_OWN_PRODUCT: 'checkout.ownProduct',
  PRODUCT_NOT_ACTIVE: 'checkout.productChanged',
  PRODUCT_NOT_FOUND: 'checkout.productChanged',
  DUPLICATE_PRODUCT: 'checkout.selectionDescription',
  INVALID_ORDER_ITEMS: 'checkout.selectionDescription',
  INVALID_ORDER_AMOUNT: 'checkout.invalidAmount',
  VALIDATION_ERROR: 'checkout.validationError',
  DATA_CONFLICT: 'checkout.productChanged',
}

export function getCheckoutErrorKey(error) {
  if (isAmbiguousCheckoutError(error)) return 'checkout.uncertain'
  return (
    errorKeys[error?.code] ??
    (error?.status === 403 ? 'checkout.forbidden' : 'checkout.submitError')
  )
}
