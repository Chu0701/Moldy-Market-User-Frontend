import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useUpdateMyStore } from '@/features/stores/hooks/useUpdateMyStore'
import { editStoreSchema } from '@/features/stores/schemas/editStoreSchema'

/**
 * @param {{
 *   userId: string,
 *   store: { name: string, description?: string | null, pickupAddress?: string | null },
 *   onSaved: () => void
 * }} props
 */
export function StoreProfileForm({ userId, store, onSaved }) {
  const { t } = useTranslation()
  const { mutateAsync, error } = useUpdateMyStore(userId)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(editStoreSchema),
    defaultValues: {
      name: store.name,
      description: store.description ?? '',
      pickupAddress: store.pickupAddress ?? '',
    },
    mode: 'onTouched',
  })

  const canSubmit = isDirty && !isSubmitting && error?.status !== 403

  async function onSubmit(values) {
    if (!isDirty || error?.status === 403) return

    try {
      await mutateAsync(values)
    } catch (saveError) {
      if (saveError?.status === 409 && saveError.code === 'STORE_NAME_TAKEN') {
        setError('name', { message: 'stores.profile.nameTaken' }, { shouldFocus: true })
      } else if (saveError?.status === 403) {
        setError('root.server', {
          message:
            saveError.code === 'STORE_BLOCKED'
              ? 'stores.profile.blocked'
              : 'feedback.forbiddenMessage',
        })
      } else {
        setError('root.server', { message: 'stores.profile.submitError' })
      }
      return
    }
    onSaved()
  }

  return (
    <form
      className="open-store-form"
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="open-store-field">
        <label htmlFor="store-profile-name">{t('stores.open.name')}</label>
        <input
          id="store-profile-name"
          required
          readOnly={isSubmitting}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'store-profile-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="store-profile-name-error" className="open-store-error" role="alert">
            {t(errors.name.message)}
          </p>
        )}
      </div>

      <div className="open-store-field">
        <label htmlFor="store-profile-description">{t('stores.open.description')}</label>
        <textarea
          id="store-profile-description"
          rows={4}
          readOnly={isSubmitting}
          {...register('description')}
        />
      </div>

      <div className="open-store-field">
        <label htmlFor="store-profile-address">{t('stores.open.pickupAddress')}</label>
        <input id="store-profile-address" readOnly={isSubmitting} {...register('pickupAddress')} />
      </div>

      {errors.root?.server?.message && (
        <p className="open-store-error" role="alert">
          {t(errors.root.server.message)}
        </p>
      )}

      <div className="profile-edit-actions">
        <Button type="submit" disabled={!canSubmit}>
          {t(isSubmitting ? 'stores.profile.saving' : 'actions.save')}
        </Button>
        <Button asChild variant="outline">
          <Link to="/store">{t('actions.cancel')}</Link>
        </Button>
      </div>
    </form>
  )
}
