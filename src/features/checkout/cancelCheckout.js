import { isAmbiguousCheckoutError } from '@/features/checkout/checkoutPayment'

export function getCancellableCheckoutOrder(checkout, userId) {
  if (
    !userId ||
    !checkout?.id ||
    checkout.status !== 'PENDING_PAYMENT' ||
    checkout.paymentResponse?.method !== 'ONLINE_BANKING' ||
    checkout.paymentResponse.paymentStatus !== 'PENDING' ||
    !checkout.orders?.length ||
    checkout.orders.some(
      (order) =>
        !order.id ||
        order.buyerId !== userId ||
        order.checkoutGroupId !== checkout.id ||
        order.status !== 'PENDING_PAYMENT',
    )
  )
    return null
  return checkout.orders[0].id
}

export function getCancelCheckoutErrorKey(error) {
  if (isAmbiguousCheckoutError(error)) return 'checkoutCancel.uncertain'
  if (error?.code === 'INVALID_ORDER_STATE') return 'checkoutCancel.stateChanged'
  if ([403, 404].includes(error?.status)) return 'checkoutCancel.unavailable'
  return 'checkoutCancel.error'
}
