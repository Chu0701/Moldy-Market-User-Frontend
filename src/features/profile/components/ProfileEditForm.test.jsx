import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router'

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

vi.mock('@/features/profile/hooks/useUpdateProfile', () => ({
  useUpdateProfile: () => ({ mutateAsync }),
}))
vi.mock('@/components/common/MediaUploadButton', () => ({
  MediaUploadButton: ({ onUploadResult }) => (
    <button
      type="button"
      onClick={() =>
        onUploadResult(
          { fileId: 'avatar-1', uploadUrl: 'https://s3.test/signed' },
          new File(['x'], 'avatar.png', { type: 'image/png' }),
        )
      }
    >
      Upload avatar
    </button>
  ),
}))
vi.mock('@/components/feedback/ForbiddenState', () => ({ ForbiddenState: () => null }))
vi.mock('@/components/ui/button', () => ({
  Button: ({ asChild, children, ...props }) =>
    asChild ? children : <button {...props}>{children}</button>,
}))
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  default: (await importOriginal()).default,
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }))

import { ProfileEditForm } from './ProfileEditForm'

beforeEach(() => {
  mutateAsync.mockReset().mockResolvedValue({})
})

test('saves the uploaded avatar fileId without sending its presigned URL', async () => {
  const onSaved = vi.fn()
  render(
    <MemoryRouter>
      <ProfileEditForm
        profile={{ fullName: 'Chu', phone: '', avatarUrl: 'https://cdn.test/old.png' }}
        onSaved={onSaved}
      />
    </MemoryRouter>,
  )

  expect(screen.queryByLabelText('profile.edit.avatarLabel')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Upload avatar' }))
  fireEvent.submit(document.querySelector('form.profile-edit-form'))

  await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
  const payload = mutateAsync.mock.calls[0][0]
  expect(payload).toHaveProperty('avatarFileId', 'avatar-1')
  expect(payload).not.toHaveProperty('avatarUrl')
  expect(JSON.stringify(payload)).not.toContain('https://s3.test/signed')
})
