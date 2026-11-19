import { expect, test } from 'vitest'

import { checkoutSchema } from './checkoutSchema'

const details = {
  receiverName: ' Chu ',
  phoneNumber: ' 0901234567 ',
  shippingAddress: ' Ha Noi ',
  method: 'COD',
  note: ' Careful ',
}

test('normalizes delivery text and keeps the payment method enum', () => {
  expect(checkoutSchema.parse(details)).toEqual({
    receiverName: 'Chu',
    phoneNumber: '0901234567',
    shippingAddress: 'Ha Noi',
    method: 'COD',
    note: 'Careful',
  })
})

test.each([
  ['receiverName', ' '],
  ['receiverName', 'a'.repeat(256)],
  ['phoneNumber', '123'],
  ['shippingAddress', ' '],
  ['shippingAddress', 'a'.repeat(501)],
  ['note', 'a'.repeat(501)],
  ['method', 'CASH'],
])('rejects invalid %s using the documented checkout limits', (field, value) => {
  expect(checkoutSchema.safeParse({ ...details, [field]: value }).success).toBe(false)
})

test('accepts bank transfer and an international Vietnamese number', () => {
  expect(
    checkoutSchema.safeParse({ ...details, phoneNumber: '+84901234567', method: 'ONLINE_BANKING' })
      .success,
  ).toBe(true)
})
