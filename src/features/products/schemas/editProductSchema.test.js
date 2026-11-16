import { expect, test } from 'vitest'

import { editProductSchema, getEditProductDefaults } from './editProductSchema'

const product = {
  title: 'Sách cũ',
  description: 'Mô tả cũ',
  price: 45000.5,
  condition: 'USED',
  images: ['https://example.com/book.jpg'],
  version: 0,
}

test('prefills the form with the loaded version and sends empty values when clearing optional fields', () => {
  const defaults = getEditProductDefaults(product)

  expect(defaults).toEqual({ ...product, price: '45000.5', images: product.images[0] })
  expect(editProductSchema.parse({ ...defaults, description: '', images: '' })).toEqual({
    ...product,
    description: '',
    images: [],
  })
})

test('rejects edits when the loaded product has no version', () => {
  const defaults = getEditProductDefaults({ ...product, version: undefined })
  const result = editProductSchema.safeParse(defaults)

  expect(result.success).toBe(false)
  expect(result.error?.issues[0].path).toEqual(['version'])
})
