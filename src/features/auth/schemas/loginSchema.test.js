import { describe, expect, test } from 'vitest'

import { loginSchema } from './loginSchema'

describe('loginSchema', () => {
  test('trims email and preserves the exact password', () => {
    expect(loginSchema.parse({ email: ' chu@example.com ', password: ' password ' })).toEqual({
      email: 'chu@example.com',
      password: ' password ',
    })
  })

  test('rejects emails over 254 characters and blank passwords', () => {
    const result = loginSchema.safeParse({
      email: 'a'.repeat(243) + '@example.com',
      password: '   ',
    })

    expect(result.error?.issues.map(({ message }) => message)).toEqual([
      'auth.login.emailTooLong',
      'auth.login.passwordRequired',
    ])
  })
})
