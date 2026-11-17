import { expect, test } from 'vitest'

import { editStoreSchema } from './editStoreSchema'

test('trims store fields and converts blank optional text to null', () => {
  expect(
    editStoreSchema.parse({
      name: ' Tiệm sách cũ ',
      description: ' Sách đã qua sử dụng ',
      pickupAddress: '   ',
    }),
  ).toEqual({
    name: 'Tiệm sách cũ',
    description: 'Sách đã qua sử dụng',
    pickupAddress: null,
  })
})

test.each([
  [' ', 'stores.open.nameRequired'],
  ['a'.repeat(256), 'stores.open.nameTooLong'],
])('rejects an invalid store name with %s', (name, message) => {
  const result = editStoreSchema.safeParse({ name, description: '', pickupAddress: '' })

  expect(result.error?.issues).toEqual([expect.objectContaining({ path: ['name'], message })])
})
