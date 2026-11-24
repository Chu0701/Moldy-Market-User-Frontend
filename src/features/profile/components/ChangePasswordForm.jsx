import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { changePasswordSchema } from '@/features/profile/schemas/changePasswordSchema'
import { changePassword } from '@/services/users/userService'

const fields = [
  { name: 'currentPassword', autoComplete: 'current-password' },
  { name: 'newPassword', autoComplete: 'new-password' },
  { name: 'confirmPassword', autoComplete: 'new-password' },
]

export function ChangePasswordForm() {
  const { t } = useTranslation()
  const [visibleFields, setVisibleFields] = useState({})
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(values) {
    try {
      await changePassword(values)
      reset()
    } catch (error) {
      if (error?.status === 401 && error.code === 'INVALID_CREDENTIALS') {
        setError(
          'currentPassword',
          { message: 'account.password.currentIncorrect' },
          { shouldFocus: true },
        )
      } else if (error?.status === 400 && error.code === 'SAME_PASSWORD') {
        setError('newPassword', { message: 'account.password.samePassword' }, { shouldFocus: true })
      } else {
        setError('root.server', { message: 'account.password.submitError' })
      }
    }
  }

  return (
    <form
      className="profile-edit-form"
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      {fields.map(({ name, autoComplete }) => {
        const id = `change-password-${name}`
        const error = errors[name]
        const isVisible = Boolean(visibleFields[name])

        return (
          <div key={name} className="profile-edit-field">
            <label htmlFor={id}>{t(`account.password.${name}`)}</label>
            <div className="password-input-wrap">
              <input
                id={id}
                type={isVisible ? 'text' : 'password'}
                autoComplete={autoComplete}
                required
                readOnly={isSubmitting}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                {...register(name)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                aria-label={isVisible ? 'Hide password' : 'Show password'}
                onClick={() =>
                  setVisibleFields((prev) => ({
                    ...prev,
                    [name]: !prev[name],
                  }))
                }
              >
                {isVisible ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
            {error && (
              <p id={`${id}-error`} className="profile-edit-error" role="alert">
                {t(error.message)}
              </p>
            )}
          </div>
        )
      })}

      {errors.root?.server?.message && (
        <p className="profile-edit-error" role="alert">
          {t(errors.root.server.message)}
        </p>
      )}

      {isSubmitSuccessful && !isSubmitting && <p role="status">{t('account.password.saved')}</p>}

      <div className="profile-edit-actions">
        <Button type="submit" disabled={isSubmitting}>
          {t(isSubmitting ? 'account.password.saving' : 'account.password.submit')}
        </Button>
      </div>
    </form>
  )
}
