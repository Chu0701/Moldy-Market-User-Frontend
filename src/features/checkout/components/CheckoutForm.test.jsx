import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { CheckoutForm } from './CheckoutForm'
import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import i18n from '@/i18n'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { getMe } from '@/services/users/userService'

vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))

const profile = { id: 'checkout-buyer', fullName: 'Chu', phone: '0901234567' }
let queryClient

beforeEach(async () => {
  setAccessToken('test-access-token')
  vi.mocked(getMe).mockReset().mockResolvedValue(profile)
  await i18n.changeLanguage('vi')
})

afterEach(() => {
  clearAccessToken()
  queryClient?.clear()
})

function renderForm() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <CheckoutForm />
      <ProfileProbe />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

function ProfileProbe() {
  const { profileQuery } = useSession()
  return <span data-testid="profile-name">{profileQuery.data?.fullName}</span>
}

test('prefills name and phone from the session while leaving the address empty', async () => {
  renderForm()
  await waitFor(() => expect(screen.getByLabelText('Họ tên người nhận')).toHaveValue('Chu'))
  expect(screen.getByLabelText('Số điện thoại người nhận')).toHaveValue(profile.phone)
  expect(screen.getByLabelText('Địa chỉ nhận hàng')).toHaveValue('')
  expect(screen.getByRole('radio', { name: 'Thanh toán khi nhận hàng (COD)' })).toBeChecked()
  expect(screen.getByRole('button', { name: 'Đặt hàng' })).toBeDisabled()
})

test('keeps a recipient name typed before the profile arrives and fills only untouched phone', async () => {
  let finishProfile
  vi.mocked(getMe).mockReturnValue(
    new Promise((resolve) => {
      finishProfile = resolve
    }),
  )
  const user = renderForm()
  await user.type(screen.getByLabelText('Họ tên người nhận'), 'Recipient')
  await user.type(screen.getByLabelText('Địa chỉ nhận hàng'), 'Delivery address')
  await act(async () => {
    finishProfile(profile)
  })

  await waitFor(() =>
    expect(screen.getByLabelText('Số điện thoại người nhận')).toHaveValue(profile.phone),
  )
  expect(screen.getByLabelText('Họ tên người nhận')).toHaveValue('Recipient')
  expect(screen.getByLabelText('Địa chỉ nhận hàng')).toHaveValue('Delivery address')
})

test('keeps recipient edits and a deliberately cleared phone across profile updates', async () => {
  const user = renderForm()
  await waitFor(() => expect(screen.getByLabelText('Họ tên người nhận')).toHaveValue('Chu'))
  await user.clear(screen.getByLabelText('Họ tên người nhận'))
  await user.type(screen.getByLabelText('Họ tên người nhận'), 'Another recipient')
  await user.clear(screen.getByLabelText('Số điện thoại người nhận'))

  act(() => {
    queryClient.setQueryData(meQueryKey, {
      ...profile,
      fullName: 'Updated name',
      phone: '0987654321',
    })
  })

  await waitFor(() => expect(screen.getByTestId('profile-name')).toHaveTextContent('Updated name'))

  expect(screen.getByLabelText('Họ tên người nhận')).toHaveValue('Another recipient')
  expect(screen.getByLabelText('Số điện thoại người nhận')).toHaveValue('')
  expect(queryClient.getQueryData(meQueryKey)).toEqual({
    ...profile,
    fullName: 'Updated name',
    phone: '0987654321',
  })
})

test('respects typing and clearing a field before the first profile response', async () => {
  let finishProfile
  vi.mocked(getMe).mockReturnValue(
    new Promise((resolve) => {
      finishProfile = resolve
    }),
  )
  const user = renderForm()
  await user.type(screen.getByLabelText('Họ tên người nhận'), 'Temporary')
  await user.clear(screen.getByLabelText('Họ tên người nhận'))
  await act(async () => {
    finishProfile(profile)
  })

  await waitFor(() =>
    expect(screen.getByLabelText('Số điện thoại người nhận')).toHaveValue(profile.phone),
  )
  expect(screen.getByLabelText('Họ tên người nhận')).toHaveValue('')
  expect(queryClient.getQueryData(meQueryKey)).toEqual(profile)
})

test('does not invent a phone number when the account has none', async () => {
  vi.mocked(getMe).mockResolvedValue({ ...profile, phone: null })
  renderForm()
  await waitFor(() => expect(screen.getByLabelText('Họ tên người nhận')).toHaveValue('Chu'))
  expect(screen.getByLabelText('Số điện thoại người nhận')).toHaveValue('')
})
