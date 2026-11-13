import { expect, test } from 'vitest'

import { editProfileSchema } from './editProfileSchema'

test.each([
  [' 0912345678 ', '0912345678'],
  ['+84912345678', '+84912345678'],
  ['   ', undefined],
])('normalizes a profile with phone %j', (phone, expectedPhone) => {
  expect(editProfileSchema.parse({ fullName: ' Nguyễn Văn Chu ', phone })).toEqual({
    fullName: 'Nguyễn Văn Chu',
    phone: expectedPhone,
  })
})

test.each([
  [{ fullName: '   ', phone: '' }, 'fullName', 'profile.edit.fullNameRequired'],
  [{ fullName: 'a'.repeat(101), phone: '' }, 'fullName', 'profile.edit.fullNameTooLong'],
  [{ fullName: 'Chu', phone: '+840912345678' }, 'phone', 'profile.edit.phoneInvalid'],
  [{ fullName: 'Chu', phone: '09123a5678' }, 'phone', 'profile.edit.phoneInvalid'],
])('rejects invalid profile input %j', (input, field, message) => {
  const result = editProfileSchema.safeParse(input)

  expect(result.error?.issues).toEqual([expect.objectContaining({ path: [field], message })])
})
