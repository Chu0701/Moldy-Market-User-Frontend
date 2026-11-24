import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useCreateStore } from '@/features/stores/hooks/useCreateStore'
import { openStoreSchema } from '@/features/stores/schemas/openStoreSchema'

/** @param {{ userId: string, onCreated: () => void, onExistingStore: () => void, onPreviewChange?: (values: object) => void }} props */
export function OpenStoreForm({ userId, onCreated, onExistingStore, onPreviewChange }) {
  const { t } = useTranslation()
  const { mutateAsync } = useCreateStore(userId)
  const [descLength, setDescLength] = useState(0)
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

  const nameReg = register('name')
  const descriptionReg = register('description')
  const pickupReg = register('pickupAddress')

  function notifyPreview(field, value) {
    if (!onPreviewChange) return
    onPreviewChange((current) => ({ ...current, [field]: value }))
  }

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
      className="open-store-form max-w-none"
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="open-store-field">
        <label htmlFor="open-store-name">{t('stores.open.name')}</label>
        <input
          id="open-store-name"
          required
          maxLength={100}
          readOnly={isSubmitting}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'open-store-name-error' : undefined}
          {...nameReg}
          onChange={(event) => {
            void nameReg.onChange(event)
            notifyPreview('name', event.target.value)
          }}
        />
        {errors.name && (
          <p id="open-store-name-error" className="open-store-error" role="alert">
            {t(errors.name.message)}
          </p>
        )}
      </div>

      <div className="open-store-field">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="open-store-description" className="text-[13px] font-medium">
            {t('stores.open.description')}
          </label>
          <span className="text-[11px] text-muted-foreground tabular-nums">{descLength}/500</span>
        </div>
        <textarea
          id="open-store-description"
          rows={4}
          maxLength={500}
          readOnly={isSubmitting}
          {...descriptionReg}
          onChange={(event) => {
            void descriptionReg.onChange(event)
            setDescLength(event.target.value.length)
            notifyPreview('description', event.target.value)
          }}
        />
      </div>

      <div className="open-store-field">
        <label htmlFor="open-store-address">{t('stores.open.pickupAddress')}</label>
        <input
          id="open-store-address"
          readOnly={isSubmitting}
          {...pickupReg}
          onChange={(event) => {
            void pickupReg.onChange(event)
            notifyPreview('pickupAddress', event.target.value)
          }}
        />
        <p className="text-xs text-muted-foreground">{t('stores.open.pickupAddressHint')}</p>
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
