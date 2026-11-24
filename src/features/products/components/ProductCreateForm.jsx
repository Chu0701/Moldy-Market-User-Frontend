import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import { AutoPricingPanel } from '@/features/pricing/components/AutoPricingPanel'
import {
  createProductSchema,
  productConditions,
} from '@/features/products/schemas/createProductSchema'
import { createStoreProduct } from '@/services/products/productService'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

export function ProductCreateForm({ storeId, categoryGroups, onCreated }) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      price: '',
      condition: '',
      images: '',
    },
  })

  async function onSubmit(values) {
    let product

    try {
      product = await createStoreProduct({ ...values, storeId })
    } catch (error) {
      if (['CATEGORY_INACTIVE', 'CATEGORY_NOT_LEAF', 'CATEGORY_NOT_FOUND'].includes(error?.code)) {
        setError('categoryId', { message: 'products.create.categoryUnavailable' })
        return
      }

      let message = 'products.create.submitError'
      if (error?.code === 'PRODUCT_LIMIT_REACHED') {
        message = 'products.create.limitReached'
      } else if (error?.status === 429) {
        message = 'products.create.rateLimited'
      } else if (error?.status === 403) {
        message = 'feedback.forbiddenMessage'
      }
      setError('root.server', { message })
      return
    }

    onCreated(product)
  }

  function fieldProps(name) {
    const id = `product-create-${name}`

    return {
      id,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${id}-error` : undefined,
      ...register(name),
    }
  }

  function fieldError(name, error = errors[name]) {
    return error?.message ? (
      <p id={`product-create-${name}-error`} className="product-create-error" role="alert">
        {t(error.message)}
      </p>
    ) : null
  }

  return (
    <form
      className="product-create-form"
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="product-create-field">
        <label htmlFor="product-create-categoryId">{t('products.filters.category')}</label>
        <select {...fieldProps('categoryId')} required disabled={isSubmitting}>
          <option value="">{t('products.create.categoryRequired')}</option>
          {categoryGroups.map(({ id, name, options }) => (
            <optgroup key={id} label={name}>
              {options.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {fieldError('categoryId')}
      </div>

      <div className="product-create-field">
        <label htmlFor="product-create-title">{t('products.create.titleLabel')}</label>
        <input {...fieldProps('title')} required readOnly={isSubmitting} />
        {fieldError('title')}
      </div>

      <div className="product-create-field">
        <label htmlFor="product-create-description">{t('products.create.descriptionLabel')}</label>
        <textarea {...fieldProps('description')} rows={4} readOnly={isSubmitting} />
        {fieldError('description')}
      </div>

      <div className="product-create-field">
        <label htmlFor="product-create-price">{t('products.create.priceLabel')}</label>
        <input {...fieldProps('price')} inputMode="decimal" required readOnly={isSubmitting} />
        {fieldError('price')}
      </div>

      <AutoPricingPanel
        categoryId={watch('categoryId')}
        disabled={isSubmitting}
        onApplyPrice={(suggested) =>
          setValue('price', String(suggested), { shouldValidate: true, shouldDirty: true })
        }
      />

      <div className="product-create-field">
        <label htmlFor="product-create-condition">{t('products.filters.condition')}</label>
        <select {...fieldProps('condition')} required disabled={isSubmitting}>
          <option value="">{t('products.create.conditionRequired')}</option>
          {productConditions.map((condition) => (
            <option key={condition} value={condition}>
              {t(conditionKeys[condition])}
            </option>
          ))}
        </select>
        {fieldError('condition')}
      </div>

      <div className="product-create-field">
        <label htmlFor="product-create-images">{t('products.create.imagesLabel')}</label>
        <textarea
          {...fieldProps('images')}
          aria-invalid={Boolean(errors.images)}
          aria-describedby={
            errors.images
              ? 'product-create-images-hint product-create-images-error'
              : 'product-create-images-hint'
          }
          rows={3}
          readOnly={isSubmitting}
        />
        <MediaUploadButton
          purpose="PRODUCT_IMAGE"
          disabled={isSubmitting}
          onUploaded={(url) => {
            const current = getValues('images')?.trim()
            setValue('images', current ? `${current}\n${url}` : url, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }}
        />
        <p id="product-create-images-hint" className="profile-edit-hint">
          {t('products.create.imagesHint')}
        </p>
        {fieldError(
          'images',
          errors.images?.root ?? errors.images?.find?.(Boolean) ?? errors.images,
        )}
      </div>

      {fieldError('server', errors.root?.server)}

      <Button type="submit" disabled={isSubmitting}>
        {t(isSubmitting ? 'products.create.submitting' : 'products.create.submit')}
      </Button>
    </form>
  )
}
