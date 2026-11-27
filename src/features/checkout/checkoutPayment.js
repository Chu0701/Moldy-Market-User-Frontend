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
  VOUCHER_NOT_FOUND: 'checkout.voucherErrors.notFound',
  VOUCHER_EXPIRED: 'checkout.voucherErrors.expired',
  VOUCHER_OUT_OF_STOCK: 'checkout.voucherErrors.outOfStock',
  VOUCHER_NOT_APPLICABLE: 'checkout.voucherErrors.notApplicable',
  VOUCHER_MINIMUM_ORDER_NOT_MET: 'checkout.voucherErrors.minimumOrderNotMet',
  VOUCHER_STORE_MISMATCH: 'checkout.voucherErrors.storeMismatch',
  OFF_010: 'offers.errors.OFF_010',
  OFFER_VOUCHER_NOT_ALLOWED: 'offers.errors.OFF_010',
}

export function getCheckoutErrorKey(error) {
  if (isAmbiguousCheckoutError(error)) return 'checkout.uncertain'
  return (
    errorKeys[error?.code] ??
    (error?.status === 403 ? 'checkout.forbidden' : 'checkout.submitError')
  )
}

/**
 * Computes client-side preview discount matching Backend VoucherService + CheckoutGroupService.
 * @param {object | null | undefined} voucher
 * @param {Array<{ price: number, storeId?: string | null }>} items
 * @returns {{ applicable: boolean, reason: string | null, discount: number }}
 */
export function estimateVoucherDiscount(voucher, items) {
  if (!voucher || !voucher.valid) {
    return { applicable: false, reason: 'notApplicable', discount: 0 }
  }
  let eligibleTotal
  if (voucher.issuer === 'STORE') {
    const matching = items.filter((item) => voucher.storeId && item.storeId === voucher.storeId)
    if (matching.length === 0) {
      return { applicable: false, reason: 'storeMismatch', discount: 0 }
    }
    eligibleTotal = matching.reduce((sum, item) => sum + Number(item.price || 0), 0)
  } else {
    eligibleTotal = items.reduce((sum, item) => sum + Number(item.price || 0), 0)
  }
  if (voucher.minimumOrderValue != null && eligibleTotal < Number(voucher.minimumOrderValue)) {
    return { applicable: false, reason: 'minimumOrderNotMet', discount: 0 }
  }
  let discount =
    voucher.discountType === 'PERCENT'
      ? Math.floor((eligibleTotal * Number(voucher.discountValue || 0)) / 100)
      : Math.floor(Number(voucher.discountValue || 0))
  if (voucher.maximumDiscount != null) {
    discount = Math.min(discount, Math.floor(Number(voucher.maximumDiscount)))
  }
  discount = Math.max(0, Math.min(discount, Math.floor(eligibleTotal)))
  return { applicable: true, reason: null, discount }
}
