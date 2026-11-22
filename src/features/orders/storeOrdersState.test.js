import { expect, test } from 'vitest'
import { getStoreOrderAccess, readStoreOrderParams } from './storeOrdersState'
import { getOrderStatusKey } from './orderStatus'

test('owner reads their fetched store even without a delegated staff permission', () => {
  expect(
    getStoreOrderAccess(
      { id: 'owner', roles: ['OWNER'], permissions: [] },
      { id: 'shop', status: 'ACTIVE' },
    ),
  ).toMatchObject({ storeId: 'shop', canRead: true, canConfirm: true })
})

test('staff needs workspace membership and ORDER_PROCESS, and viewing never grants confirmation', () => {
  const staff = {
    id: 'staff',
    roles: ['STAFF'],
    storeId: 'shop',
    permissions: ['STORE_WORKSPACE_ACCESS', 'ORDER_PROCESS'],
  }
  const membership = { userId: staff.id, storeId: 'shop', permissions: staff.permissions }
  expect(getStoreOrderAccess(staff, undefined, membership)).toMatchObject({
    storeId: 'shop',
    canRead: true,
    canConfirm: false,
  })
  expect(getStoreOrderAccess(staff).canRead).toBe(false)
  expect(
    getStoreOrderAccess(staff, undefined, {
      ...membership,
      permissions: ['STORE_WORKSPACE_ACCESS'],
    }).canRead,
  ).toBe(false)
  expect(
    getStoreOrderAccess(staff, undefined, { ...membership, userId: 'another-user' }).canRead,
  ).toBe(false)
})

test('missing store, blocked owner store and ordinary buyer are not allowed to query orders', () => {
  expect(getStoreOrderAccess({ roles: ['OWNER'] }, null).canRead).toBe(false)
  expect(
    getStoreOrderAccess({ roles: ['OWNER'] }, { id: 'blocked', status: 'BLOCKED' }).canRead,
  ).toBe(false)
  expect(
    getStoreOrderAccess({ roles: ['USER'], storeId: 'forged', permissions: ['ORDER_PROCESS'] })
      .canRead,
  ).toBe(false)
})

test('reads one-based page and optional known status from URL', () => {
  expect(readStoreOrderParams(new URLSearchParams())).toEqual({ page: 1, status: '', valid: true })
  expect(readStoreOrderParams(new URLSearchParams('page=2&status=PENDING_CONFIRMED'))).toEqual({
    page: 2,
    status: 'PENDING_CONFIRMED',
    valid: true,
  })
})

test('unknown or inherited status names use the translated fallback', () => {
  expect(getOrderStatusKey('toString')).toBe('orders.statuses.unknown')
  expect(getOrderStatusKey('NEW_STATE')).toBe('orders.statuses.unknown')
  expect(getOrderStatusKey('PENDING_CONFIRMED')).toBe('orders.statuses.pendingConfirmed')
})

test.each([
  'page=0',
  'page=-1',
  'page=1.5',
  'page=abc',
  'page=2147483647',
  'page=1&page=2',
  'status=toString',
  'status=UNKNOWN',
  'status=CONFIRMED&status=CANCELLED',
])('invalid filter prevents HTTP rather than silently submitting another query: %s', (query) => {
  expect(readStoreOrderParams(new URLSearchParams(query)).valid).toBe(false)
})
