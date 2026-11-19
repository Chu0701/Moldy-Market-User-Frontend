import { z } from 'zod'

export const checkoutSchema = z.object({
  receiverName: z.string().trim().min(1, 'checkout.required').max(255, 'checkout.nameTooLong'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^(\+84|0)\d{9,10}$/, 'checkout.phoneInvalid'),
  shippingAddress: z
    .string()
    .trim()
    .min(1, 'checkout.required')
    .max(500, 'checkout.addressTooLong'),
  method: z.enum(['COD', 'ONLINE_BANKING']),
  note: z.string().trim().max(500, 'checkout.noteTooLong'),
})
