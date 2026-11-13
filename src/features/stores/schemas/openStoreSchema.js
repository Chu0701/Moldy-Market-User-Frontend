import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))

export const openStoreSchema = z.object({
  name: z.string().trim().min(1, 'stores.open.nameRequired').max(255, 'stores.open.nameTooLong'),
  description: optionalText,
  pickupAddress: optionalText,
})
