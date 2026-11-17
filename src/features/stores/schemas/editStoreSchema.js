import { z } from 'zod'

const nullableText = z
  .string()
  .trim()
  .transform((value) => value || null)

export const editStoreSchema = z.object({
  name: z.string().trim().min(1, 'stores.open.nameRequired').max(255, 'stores.open.nameTooLong'),
  description: nullableText,
  pickupAddress: nullableText,
})
