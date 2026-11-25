import { z } from 'zod'

import { createProductSchema } from './createProductSchema'

export const editProductSchema = createProductSchema.omit({ categoryId: true }).extend({
  description: z.string().trim().max(2000, 'products.create.descriptionTooLong'),
  version: z.number().int().nonnegative(),
})

export function getEditProductDefaults(product) {
  return {
    title: product.title,
    description: product.description ?? '',
    price: String(product.price),
    condition: product.condition,
    version: product.version,
  }
}
