import { z } from 'zod'

import { loginSchema } from './loginSchema'

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'profile.edit.fullNameRequired')
      .max(100, 'profile.edit.fullNameTooLong'),
    email: loginSchema.shape.email,
    phone: z
      .string()
      .trim()
      .refine((value) => value === '' || /^(?:0|\+84)[0-9]{9}$/.test(value), {
        message: 'profile.edit.phoneInvalid',
      })
      .transform((value) => value || undefined),
    password: z
      .string()
      .min(8, 'auth.register.passwordTooShort')
      .max(100, 'auth.register.passwordTooLong')
      .refine((value) => value.trim().length > 0, 'auth.login.passwordRequired'),
    confirmPassword: z.string(),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.register.passwordMismatch',
  })
