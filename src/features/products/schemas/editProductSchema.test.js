import { expect, test } from 'vitest'

import { editProductSchema, getEditProductDefaults } from './editProductSchema'

const product = {
  title: 'Sách cũ',
  description: 'Mô tả cũ',
  price: 45000.5,
  condition: 'USED',
  images: ['https://example.com/book.jpg'],
  imageFileIds: ['managed-id'],
  version: 0,
}

test('prefills editable fields and preserves the product version', () => {
  const defaults = getEditProductDefaults(product)

  expect(defaults).toEqual({
    title: product.title,
    description: product.description,
    price: '45000.5',
    condition: product.condition,
    version: 0,
  })
  expect(editProductSchema.parse(defaults)).toEqual({ ...defaults, price: 45000.5 })
})

test('rejects edits when the loaded product has no version', () => {
  const defaults = getEditProductDefaults({ ...product, version: undefined })
  const result = editProductSchema.safeParse(defaults)

  expect(result.success).toBe(false)
  expect(result.error?.issues[0].path).toEqual(['version'])
})
