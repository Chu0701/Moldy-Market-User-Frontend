import { orderStatusKeys } from '@/features/orders/orderStatus'
import { getStoreContext } from '@/features/stores/getStoreContext'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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
  const q = (params.get('q') ?? '').trim()
  const from = (params.get('from') ?? '').trim()
  const to = (params.get('to') ?? '').trim()
  const sortParam = params.get('sort') ?? ''
  const oldestFirst = sortParam === 'oldest' || (sortParam === '' && status === 'PENDING_CONFIRMED')

  const validDates =
    (!from || ISO_DATE_RE.test(from)) &&
    (!to || ISO_DATE_RE.test(to)) &&
    (!from || !to || from <= to)

  const valid =
    /^[1-9]\d*$/.test(pageText) &&
    Number.isSafeInteger(page) &&
    (page - 1) * 20 <= 2147483647 &&
    params.getAll('page').length <= 1 &&
    params.getAll('status').length <= 1 &&
    (!status || Object.hasOwn(orderStatusKeys, status)) &&
    (!sortParam || ['newest', 'oldest'].includes(sortParam)) &&
    validDates

  return { page, status, q, from, to, oldestFirst, sort: oldestFirst ? 'oldest' : 'newest', valid }
}

export const storeOrdersKeys = {
  all: (userId, storeId) => ['orders', 'store', userId, storeId],
  summary: (userId, storeId) => ['orders', 'store', userId, storeId, 'summary'],
  page: (userId, storeId, { page, status, q = '', from = '', to = '', oldestFirst = false }) => {
    const scope = { page, status }
    if (q) scope.q = q
    if (from) scope.from = from
    if (to) scope.to = to
    if (oldestFirst) scope.oldestFirst = true
    return ['orders', 'store', userId, storeId, scope]
  },
}

export function getStoreOrderConfirmErrorKey(error) {
  if (!error?.status || error.status >= 500) return 'storeOrders.confirmUncertain'
  if (error.code === 'INVALID_ORDER_STATE') return 'storeOrders.stateChanged'
  if ([403, 404].includes(error.status)) return 'storeOrders.confirmForbidden'
  return 'storeOrders.confirmError'
}
