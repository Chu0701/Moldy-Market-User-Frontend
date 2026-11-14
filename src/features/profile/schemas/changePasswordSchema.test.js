import { expect, test } from 'vitest'

import { changePasswordSchema } from './changePasswordSchema'

const passwords = {
  currentPassword: ' old password ',
  newPassword: ' new password ',
  confirmPassword: ' new password ',
}

test('preserves spaces in valid passwords', () => {
  expect(changePasswordSchema.parse(passwords)).toEqual(passwords)
})

test.each([
  ['currentPassword', '   ', 'currentRequired'],
  ['newPassword', 'short', 'newTooShort'],
  ['newPassword', '        ', 'newRequired'],
  ['newPassword', passwords.currentPassword, 'samePassword'],
  ['confirmPassword', '', 'confirmRequired'],
  ['confirmPassword', 'new password', 'confirmMismatch'],
])('reports %s validation errors for %j', (field, value, message) => {
  const result = changePasswordSchema.safeParse({ ...passwords, [field]: value })

  expect(result.error?.issues).toContainEqual(
    expect.objectContaining({ path: [field], message: `account.password.${message}` }),
  )
})
