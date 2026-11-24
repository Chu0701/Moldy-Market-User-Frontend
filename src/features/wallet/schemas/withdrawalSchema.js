import { z } from 'zod'

export const withdrawalSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'wallet.validation.amountInvalid' })
    .positive('wallet.validation.amountPositive'),
  bankName: z.string().trim().min(1, 'wallet.validation.required').max(100),
  bankAccountNumber: z
    .string()
    .trim()
    .min(4, 'wallet.validation.accountNumberInvalid')
    .max(50, 'wallet.validation.accountNumberInvalid'),
  bankAccountHolder: z.string().trim().min(1, 'wallet.validation.required').max(150),
})
