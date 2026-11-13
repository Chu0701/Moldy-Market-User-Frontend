import { expect, test } from 'vitest'

import { openStoreSchema } from './openStoreSchema'

test('trims the store fields and omits blank optional text from JSON', () => {
  const result = openStoreSchema.parse({
    name: '  Tiệm sách cũ  ',
    description: '  Sách đã qua sử dụng  ',
    pickupAddress: '   ',
  })

  expect(JSON.parse(JSON.stringify(result))).toEqual({
    name: 'Tiệm sách cũ',
    description: 'Sách đã qua sử dụng',
  })
})

test.each([
  ['   ', 'stores.open.nameRequired'],
  ['a'.repeat(256), 'stores.open.nameTooLong'],
])('rejects an invalid store name with %s', (name, message) => {
  const result = openStoreSchema.safeParse({ name, description: '', pickupAddress: '' })

  expect(result.error?.issues).toEqual([expect.objectContaining({ path: ['name'], message })])
})
