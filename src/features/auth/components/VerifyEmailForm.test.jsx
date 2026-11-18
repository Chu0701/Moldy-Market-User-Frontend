import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'

import { VerifyEmailForm } from './VerifyEmailForm'
import i18n from '@/i18n'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('enables resending after the initial sixty-second cooldown', async () => {
  await i18n.changeLanguage('vi')
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-18T00:00:00Z'))
  render(
    <MemoryRouter>
      <VerifyEmailForm initialEmail="chu@example.com" codeSent />
    </MemoryRouter>,
  )
  expect(screen.getByRole('button', { name: 'Gửi lại sau 60 giây' })).toBeDisabled()

  act(() => {
    vi.setSystemTime(new Date('2026-11-18T00:01:00Z'))
    vi.advanceTimersByTime(1000)
  })

  expect(screen.getByRole('button', { name: 'Gửi lại mã' })).toBeEnabled()
})
