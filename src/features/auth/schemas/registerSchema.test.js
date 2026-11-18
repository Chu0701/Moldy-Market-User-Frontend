import { expect, test } from 'vitest'
import { registerSchema } from './registerSchema'

const account = {
  fullName: ' Chu ',
  email: ' chu@example.com ',
  phone: '',
  password: ' password ',
  confirmPassword: ' password ',
}

test('trims account fields, omits blank phone, and preserves the password', () => {
  expect(registerSchema.parse(account)).toEqual({
    ...account,
    fullName: 'Chu',
    email: 'chu@example.com',
    phone: undefined,
  })
})

test.each(['short', 'a'.repeat(101)])(
  'rejects passwords outside the supported length',
  (password) => {
    expect(
      registerSchema.safeParse({ ...account, password, confirmPassword: password }).success,
    ).toBe(false)
  },
)
