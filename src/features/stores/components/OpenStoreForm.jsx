import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useCreateStore } from '@/features/stores/hooks/useCreateStore'
import { openStoreSchema } from '@/features/stores/schemas/openStoreSchema'

/** @param {{ userId: string, onCreated: () => void, onExistingStore: () => void }} props */
export function OpenStoreForm({ userId, onCreated, onExistingStore }) {
  const { t } = useTranslation()
  const { mutateAsync } = useCreateStore(userId)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(openStoreSchema),
    defaultValues: { name: '', description: '', pickupAddress: '' },
    mode: 'onTouched',
  })

  async function onSubmit(values) {
    try {
      await mutateAsync(values)
    } catch (error) {
      if (error?.status === 409 && error?.code === 'STORE_ALREADY_EXISTS') {
        onExistingStore()
        return
      }

      setError('root.server', { message: 'stores.open.submitError' })
      return
    }

    onCreated()
  }

  return (
    <form
      className="open-store-form"
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="open-store-field">
        <label htmlFor="open-store-name">{t('stores.open.name')}</label>
        <input
          id="open-store-name"
          required
          readOnly={isSubmitting}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'open-store-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="open-store-name-error" className="open-store-error" role="alert">
            {t(errors.name.message)}
          </p>
        )}
      </div>

      <div className="open-store-field">
        <label htmlFor="open-store-description">{t('stores.open.description')}</label>
        <textarea
          id="open-store-description"
          rows={4}
          readOnly={isSubmitting}
          {...register('description')}
        />
      </div>

      <div className="open-store-field">
        <label htmlFor="open-store-address">{t('stores.open.pickupAddress')}</label>
        <input id="open-store-address" readOnly={isSubmitting} {...register('pickupAddress')} />
      </div>

      {errors.root?.server?.message && (
        <p className="open-store-error" role="alert">
          {t(errors.root.server.message)}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {t(isSubmitting ? 'stores.open.submitting' : 'stores.open.submit')}
      </Button>
    </form>
  )
}
