import { z } from 'zod'
const vietnamesePhonePattern = /^(?:\+84|0)[0-9]{9}$/

export const editProfileSchema = z.object({
  avatarFileId: z.string().optional(),
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

  address: z
    .string()
    .trim()
    .max(500, 'profile.edit.addressTooLong')
    .optional()
    .transform((value) => (value === undefined ? undefined : value)),
})
