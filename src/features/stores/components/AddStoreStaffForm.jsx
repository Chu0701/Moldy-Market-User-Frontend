import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useAddStoreStaff } from '@/features/stores/hooks/useAddStoreStaff'
import { addStoreStaffSchema } from '@/features/stores/schemas/addStoreStaffSchema'

const emailErrorMessages = new Map([
  ['USER_NOT_FOUND', 'stores.staff.add.accountNotFound'],
  ['STAFF_ACCOUNT_NOT_ACTIVE', 'stores.staff.add.accountNotActive'],
  ['STAFF_ALREADY_EXISTS', 'stores.staff.add.alreadyEmployed'],
  ['STAFF_ALREADY_EMPLOYED', 'stores.staff.add.alreadyEmployed'],
  ['CANNOT_ADD_SELF_AS_STAFF', 'stores.staff.add.ineligibleAccount'],
  ['CANNOT_ADD_STORE_OWNER_AS_STAFF', 'stores.staff.add.ineligibleAccount'],
  ['CANNOT_ADD_ADMIN_AS_STAFF', 'stores.staff.add.ineligibleAccount'],
  ['CANNOT_ADD_APPRAISER_AS_STAFF', 'stores.staff.add.ineligibleAccount'],
])
/** @param {{ userId: string }} props */
export function AddStoreStaffForm({ userId }) {
  const { t } = useTranslation()
  const { mutateAsync, error, isSuccess } = useAddStoreStaff(userId)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(addStoreStaffSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  })

  const isForbidden = error?.status === 403

  async function onSubmit(values) {
    if (isForbidden) return

    try {
      await mutateAsync(values)
      reset()
    } catch (saveError) {
      const emailMessage = emailErrorMessages.get(saveError?.code)

      if (emailMessage) {
        setError('email', { message: emailMessage }, { shouldFocus: true })
        return
      }

      const message =
        saveError?.code === 'STORE_BLOCKED'
          ? 'stores.unavailableTitle'
          : saveError?.status === 403
            ? 'feedback.forbiddenMessage'
            : saveError?.code === 'STORE_STAFF_LIMIT_REACHED'
              ? 'stores.staff.add.limitReached'
              : 'stores.staff.add.submitError'

      setError('root.server', { message })
    }
  }

  return (
    <form
      className="open-store-form"
      aria-labelledby="add-store-staff-title"
      aria-busy={isSubmitting}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 id="add-store-staff-title">{t('stores.staff.add.title')}</h2>

      <div className="open-store-field">
        <label htmlFor="store-staff-email">{t('stores.staff.add.email')}</label>
        <input
          id="store-staff-email"
          type="email"
          required
          readOnly={isSubmitting || isForbidden}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'store-staff-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="store-staff-email-error" className="open-store-error" role="alert">
            {t(errors.email.message)}
          </p>
        )}
      </div>

      {errors.root?.server?.message && (
        <p className="open-store-error" role="alert">
          {t(errors.root.server.message)}
        </p>
      )}

      {isSuccess && !isDirty && <p role="status">{t('stores.staff.add.success')}</p>}

      <Button type="submit" disabled={isSubmitting || isForbidden}>
        {t(isSubmitting ? 'stores.staff.add.submitting' : 'stores.staff.add.title')}
      </Button>
    </form>
  )
}
