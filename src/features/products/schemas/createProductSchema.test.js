import { expect, test } from 'vitest'

import { createProductSchema } from './createProductSchema'

const validFields = {
  categoryId: 'a8098c1a-f86e-11da-bd1a-00112444be1f',
  title: ' Sách cũ ',
  description: ' ',
  price: '45000,50',
  condition: 'USED',
  images: ' https://example.com/book.jpg\r\n\r\nhttps://example.com/back.jpg ',
}

test('normalizes form input for the create request', () => {
  expect(createProductSchema.parse(validFields)).toEqual({
    ...validFields,
    title: 'Sách cũ',
    description: undefined,
    price: 45000.5,
    images: ['https://example.com/book.jpg', 'https://example.com/back.jpg'],
  })
})

test.each([
  ['price', '0', 'priceMin'],
  ['price', '1000000000.01', 'priceMax'],
  ['price', '45.001', 'priceFormat'],
  ['images', 'http://example.com/book.jpg', 'imageInvalid'],
  ['images', Array(11).fill('https://example.com/book.jpg').join('\n'), 'imagesTooMany'],
])('rejects invalid %s with %s (%s)', (field, value, key) => {
  const result = createProductSchema.safeParse({ ...validFields, [field]: value })

  expect(result.error?.issues).toContainEqual(
    expect.objectContaining({ message: `products.create.${key}` }),
  )
})
