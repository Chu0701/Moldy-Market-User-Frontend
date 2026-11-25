import { z } from 'zod'

export const productConditions = ['NEW', 'LIKE_NEW', 'USED', 'DAMAGED']

const pricePattern = /^[0-9]+(?:[.,][0-9]{1,2})?$/

const publicMediaPathPattern = /^\/api\/v1\/files\/public\/[0-9a-fA-F-]+(?:\/[^/\s]+)?$/

const imageUrlSchema = z
  .string()
  .max(500, 'products.create.imageTooLong')
  .refine(
    (value) => {
      if (publicMediaPathPattern.test(value)) return true
      try {
        return new URL(value).protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'products.create.imageInvalid' },
  )

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
  images: z
    .string()
    .transform((value) =>
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .pipe(z.array(imageUrlSchema).max(10, 'products.create.imagesTooMany')),
})
