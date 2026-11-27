import { z } from 'zod'

export const productConditions = ['NEW', 'LIKE_NEW', 'USED', 'DAMAGED']

const pricePattern = /^[0-9]+(?:[.,][0-9]{1,2})?$/

export const createProductSchema = z.object({
  categoryId: z.uuid('products.create.categoryRequired'),
  title: z
    .string()
    .trim()
    .min(1, 'products.create.titleRequired')
    .max(150, 'products.create.titleTooLong'),
  description: z
    .string()
    .trim()
    .max(2000, 'products.create.descriptionTooLong')
    .transform((value) => value || undefined),
  price: z
    .string()
    .trim()
    .min(1, 'products.create.priceRequired')
    .regex(pricePattern, 'products.create.priceFormat')
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(
      z.number().gt(0, 'products.create.priceMin').max(1_000_000_000, 'products.create.priceMax'),
    ),
  condition: z.enum(productConditions, 'products.create.conditionRequired'),
  allowOffer: z.boolean().optional().default(true),
})
