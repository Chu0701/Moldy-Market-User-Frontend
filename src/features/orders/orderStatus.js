export const orderStatusKeys = {
  PENDING_CONFIRMED: 'orders.statuses.pendingConfirmed',
  PENDING_PAYMENT: 'orders.statuses.pendingPayment',
  CONFIRMED: 'orders.statuses.confirmed',
  SHIPPING: 'orders.statuses.shipping',
  DELIVERED: 'orders.statuses.delivered',
  COMPLETED: 'orders.statuses.completed',
  CANCELLED: 'orders.statuses.cancelled',
  EXPIRED: 'orders.statuses.expired',
  DISPUTED: 'orders.statuses.disputed',
  REFUNDED: 'orders.statuses.refunded',
}

export const orderStatuses = Object.keys(orderStatusKeys)

export const getOrderStatusKey = (status) =>
  Object.hasOwn(orderStatusKeys, status) ? orderStatusKeys[status] : 'orders.statuses.unknown'
