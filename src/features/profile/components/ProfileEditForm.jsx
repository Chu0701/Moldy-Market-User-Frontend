import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile'
import { editProfileSchema } from '@/features/profile/schemas/editProfileSchema'

/**
 * @param {{
 *  profile: { fullName: string, phone?: string | null },
 *  onSaved: () => void
 * }}
 */
export function ProfileEditForm({ profile, onSaved }) {
  const { t } = useTranslation()
  const { mutateAsync, error } = useUpdateProfile()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: profile.fullName ?? '',
      phone: profile.phone ?? '',
    },
    mode: 'onTouched',
  })

  async function onSubmit(values) {
    if (!isDirty) return

    try {
      await mutateAsync(values)
    } catch (error) {
      if (error?.status === 409 && error.code === 'PHONE_ALREADY_EXISTS') {
        setError(
          'phone',
          { message: 'profile.edit.phoneTaken' },
          {
            shouldFocus: true,
          },
        )
      } else if (error?.status !== 403) {
        setError('root.server', { message: 'profile.edit.submitError' })
      }
      return
    }

    onSaved()
  }

  if (error?.status === 403) {
    return (
      <>
        <ForbiddenState />
        <Button asChild variant="outline">
          <Link to="/profile">{t('profile.edit.back')}</Link>
        </Button>
      </>
    )
  }

  return (
    <form
      className="profile-edit-form"
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="profile-edit-field">
        <label htmlFor="profile-full-name">{t('profile.fullName')}</label>
        <input
          id="profile-full-name"
          autoComplete="name"
          required
          readOnly={isSubmitting}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? 'profile-full-name-error' : undefined}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p id="profile-full-name-error" className="profile-edit-error" role="alert">
            {t(errors.fullName.message)}
          </p>
        )}
      </div>

      <div className="profile-edit-field">
        <label htmlFor="profile-phone">{t('profile.edit.phone')}</label>
        <input
          id="profile-phone"
          type="tel"
          autoComplete="tel"
          readOnly={isSubmitting}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={
            errors.phone ? 'profile-phone-hint profile-phone-error' : 'profile-phone-hint'
          }
          {...register('phone')}
        />
        <p id="profile-phone-hint" className="profile-edit-hint">
          {t('profile.edit.phoneHint')}
        </p>
        {errors.phone && (
          <p id="profile-phone-error" className="profile-edit-error" role="alert">
            {t(errors.phone.message)}
          </p>
        )}
      </div>

      {errors.root?.server?.message && (
        <p className="profile-edit-error" role="alert">
          {t(errors.root.server.message)}
        </p>
      )}

      <div className="profile-edit-actions">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {t(isSubmitting ? 'profile.edit.saving' : 'profile.edit.save')}
        </Button>
        <Button asChild variant="outline">
          <Link to="/profile">{t('profile.edit.back')}</Link>
        </Button>
      </div>
    </form>
  )
}
