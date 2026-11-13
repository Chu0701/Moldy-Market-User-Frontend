import { expect, test } from 'vitest'

import { readProductSearchParams } from './productSearchParams'

test('reads repeated filters from a shared URL and preserves a zero price bound', () => {
  const first = 'a8098c1a-f86e-11da-bd1a-00112444be1e'
  const second = 'a8098c1a-f86e-11da-bd1a-00112444be1f'
  const params = new URLSearchParams([
    ['categoryId', first],
    ['categoryId', 'invalid'],
    ['categoryId', second],
    ['categoryId', first],
    ['condition', 'NEW'],
    ['condition', 'INVALID'],
    ['condition', 'USED'],
    ['condition', 'NEW'],
    ['minPrice', '0'],
    ['maxPrice', '125000.50'],
  ])

  expect(readProductSearchParams(params)).toMatchObject({
    categoryId: [first, second],
    condition: ['NEW', 'USED'],
    minPrice: 0,
    maxPrice: 125000.5,
  })
})

test.each(['minPrice=300&maxPrice=100', 'minPrice=-100&maxPrice=abc'])(
  'ignores invalid price bounds in %s',
  (search) => {
    expect(readProductSearchParams(new URLSearchParams(search))).toMatchObject({
      minPrice: undefined,
      maxPrice: undefined,
    })
  },
)
