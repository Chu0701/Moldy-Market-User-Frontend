import { z } from 'zod'
const vietnamesePhonePattern = /^(?:\+84|0)[0-9]{9}$/

export const editProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'profile.edit.fullNameRequired')
    .max(100, 'profile.edit.fullNameTooLong'),

  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || vietnamesePhonePattern.test(value),
      'profile.edit.phoneInvalid',
    )
    .transform((value) => (value === '' ? undefined : value)),

  avatarUrl: z
    .string()
    .trim()
    .max(1000, 'profile.edit.avatarUrlTooLong')
    .refine(
      (value) =>
        value === '' ||
        /^https?:\/\//i.test(value) ||
        /^\/api\/v1\/files\/public\/[0-9a-fA-F-]+(?:\/[^/\s]+)?$/.test(value),
      'profile.edit.avatarUrlInvalid',
    )
    .optional()
    .transform((value) => (!value ? undefined : value)),

  address: z
    .string()
    .trim()
    .max(500, 'profile.edit.addressTooLong')
    .optional()
    .transform((value) => (value === undefined ? undefined : value)),
})
