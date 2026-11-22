import { orderStatusKeys } from '@/features/orders/orderStatus'
import { getStoreContext } from '@/features/stores/getStoreContext'

export function getStoreOrderAccess(profile, ownerStore, staffProfile) {
  const { kind, storeId: staffStoreId, canReadOrders } = getStoreContext(profile, staffProfile)
  const storeId = kind === 'owner' ? (ownerStore?.id ?? null) : (staffStoreId ?? null)
  const canRead = Boolean(
    storeId && (kind === 'owner' ? ownerStore.status !== 'BLOCKED' : canReadOrders),
  )
  return { kind, storeId, canRead, canConfirm: kind === 'owner' && canRead }
}

export function readStoreOrderParams(params) {
  const pageText = params.get('page') ?? '1'
  const page = Number(pageText)
  const status = params.get('status') ?? ''
  const valid =
    /^[1-9]\d*$/.test(pageText) &&
    Number.isSafeInteger(page) &&
    (page - 1) * 20 <= 2147483647 &&
    params.getAll('page').length <= 1 &&
    params.getAll('status').length <= 1 &&
    (!status || Object.hasOwn(orderStatusKeys, status))
  return { page, status, valid }
}

export const storeOrdersKeys = {
  all: (userId, storeId) => ['orders', 'store', userId, storeId],
  page: (userId, storeId, { page, status }) => [
    'orders',
    'store',
    userId,
    storeId,
    { page, status },
  ],
}

export function getStoreOrderConfirmErrorKey(error) {
  if (!error?.status || error.status >= 500) return 'storeOrders.confirmUncertain'
  if (error.code === 'INVALID_ORDER_STATE') return 'storeOrders.stateChanged'
  if ([403, 404].includes(error.status)) return 'storeOrders.confirmForbidden'
  return 'storeOrders.confirmError'
}
