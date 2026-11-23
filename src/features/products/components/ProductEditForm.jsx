import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { AutoPricingPanel } from '@/features/pricing/components/AutoPricingPanel'
import { useEditProductForm } from '@/features/products/hooks/useEditProductForm'

const conditions = [
  ['NEW', 'products.conditions.new'],
  ['LIKE_NEW', 'products.conditions.likeNew'],
  ['USED', 'products.conditions.used'],
  ['DAMAGED', 'products.conditions.damaged'],
]

export function ProductEditForm({ product, refetch, isFetching, onSaved }) {
  const { t } = useTranslation()
  const { form, submit, reload, hasConflict } = useEditProductForm({ product, refetch, onSaved })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  const imagedError = errors.images?.root ?? errors.images?.find?.(Boolean) ?? errors.images

  function fieldProps(name, error = errors[name]) {
    const id = `product-edit-${name}`

    return {
      id,
      'aria-invalid': Boolean(error),
      'aria-describedby': error ? `${id}-error` : undefined,
      ...register(name),
    }
  }
  function fieldError(name, error = errors[name]) {
    return error?.message ? (
      <p id={`product-edit-${name}-error`} className="product-create-error" role="alert">
        {t(error.message)}
      </p>
    ) : null
  }

  return (
    <form className="product-create-form" noValidate aria-busy={isSubmitting} onSubmit={submit}>
      <div className="product-create-field">
        <label htmlFor="product-edit-title">{t('products.create.titleLabel')}</label>
        <input {...fieldProps('title')} required readOnly={isSubmitting} />
        {fieldError('title')}
      </div>

      <div className="product-create-field">
        <label htmlFor="product-edit-description">{t('products.create.descriptionLabel')}</label>
        <textarea {...fieldProps('description')} rows={4} readOnly={isSubmitting} />
        {fieldError('description')}
      </div>

      <div className="product-create-field">
        <label htmlFor="product-edit-price">{t('products.create.priceLabel')}</label>
        <input {...fieldProps('price')} inputMode="decimal" required readOnly={isSubmitting} />
        {fieldError('price')}
      </div>

      <AutoPricingPanel
        categoryId={product.categoryId}
        disabled={isSubmitting || hasConflict}
        onApplyPrice={(suggested) =>
          form.setValue('price', String(suggested), { shouldValidate: true, shouldDirty: true })
        }
      />

      <div className="product-create-field">
        <label htmlFor="product-edit-condition">{t('products.filters.condition')}</label>
        <select {...fieldProps('condition')} required disabled={isSubmitting}>
          {conditions.map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
        {fieldError('condition')}
      </div>

      <div className="product-create-field">
        <label htmlFor="product-edit-images">{t('products.create.imagesLabel')}</label>
        <textarea
          {...fieldProps('images', imagedError)}
          aria-describedby={
            imagedError
              ? 'product-edit-images-hint product-edit-images-error'
              : 'product-edit-images-hint'
          }
          rows={3}
          readOnly={isSubmitting}
        />
        <p id="product-edit-images-hint" className="profile-edit-hint">
          {t('products.create.imagesHint')}
        </p>
        {fieldError('images', imagedError)}
      </div>

      {hasConflict && (
        <div>
          <p className="product-create-error" role="alert">
            {t('products.edit.conflict')}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={isFetching || isSubmitting}
            onClick={() => void reload()}
          >
            {t('products.edit.reload')}
          </Button>
        </div>
      )}

      {fieldError('server', errors.root?.server)}

      <div className="profile-edit-actions">
        <Button type="submit" disabled={isSubmitting || hasConflict}>
          {t(isSubmitting ? 'products.edit.saving' : 'actions.save')}
        </Button>
        <Button asChild variant="outline">
          <Link to={`/products/${encodeURIComponent(product.id)}`}>{t('actions.cancel')}</Link>
        </Button>
      </div>
    </form>
  )
}
