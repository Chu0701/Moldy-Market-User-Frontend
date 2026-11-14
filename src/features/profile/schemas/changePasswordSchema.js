import { z } from 'zod'
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .refine((value) => value.trim().length > 0, 'account.password.currentRequired'),
    newPassword: z
      .string()
      .min(8, 'account.password.newTooShort')
      .refine((value) => value.trim().length > 0, 'account.password.newRequired'),
    confirmPassword: z.string().min(1, 'account.password.confirmRequired'),
  })
  .refine(({ currentPassword, newPassword }) => currentPassword !== newPassword, {
    path: ['newPassword'],
    message: 'account.password.samePassword',
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    path: ['confirmPassword'],
    message: 'account.password.confirmMismatch',
  })
