import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'auth.login.emailRequired')
    .max(254, 'auth.login.emailTooLong')
    .pipe(z.email('auth.login.emailInvalid')),
  password: z.string().refine((value) => value.trim().length > 0, 'auth.login.passwordRequired'),
})
