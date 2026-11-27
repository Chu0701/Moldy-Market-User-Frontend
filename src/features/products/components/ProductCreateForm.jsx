import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
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
  const [uploadedImages, setUploadedImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const uploadedImagesRef = useRef(uploadedImages)
  const imageFileIds = uploadedImages.map(({ fileId }) => fileId)
  uploadedImagesRef.current = uploadedImages
  useEffect(
    () => () =>
      uploadedImagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl)),
    [],
  )
  const {
    register,
    handleSubmit,
    setError,
    setValue,
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
      allowOffer: true,
    },
  })

  async function onSubmit(values) {
    let product

    try {
      product = await createStoreProduct({ ...values, storeId, imageFileIds })
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="product-create-field">
          <label htmlFor="product-create-price">{t('products.create.priceLabel')}</label>
          <input {...fieldProps('price')} inputMode="decimal" required readOnly={isSubmitting} />
          {Number(watch('price')) > 0 && (
            <p className="text-xs font-medium text-muted-foreground tabular-nums">
              ≈ <ProductPrice value={Number(watch('price'))} />
            </p>
          )}
          {fieldError('price')}
        </div>

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
      </div>

      <AutoPricingPanel
        categoryId={watch('categoryId')}
        disabled={isSubmitting}
        onApplyPrice={(suggested) =>
          setValue('price', String(suggested), { shouldValidate: true, shouldDirty: true })
        }
      />

      <div className="product-create-field">
        <span className="product-create-field-label">{t('products.create.imagesLabel')}</span>
        <MediaUploadButton
          purpose="PRODUCT_IMAGE"
          resolveDownloadUrl={false}
          disabled={isSubmitting || isUploading || uploadedImages.length >= 10}
          onUploadingChange={setIsUploading}
          onUploadResult={({ fileId }, file) => {
            setUploadedImages((current) =>
              current.some((image) => image.fileId === fileId)
                ? current
                : [
                    ...current,
                    { fileId, fileName: file.name, previewUrl: URL.createObjectURL(file) },
                  ],
            )
          }}
        />
        {uploadedImages.length > 0 && (
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {uploadedImages.map((image, index) => (
              <li key={image.fileId} className="relative">
                <img
                  src={image.previewUrl}
                  alt={image.fileName}
                  className="aspect-square w-full rounded-md object-cover"
                />
                <span className="text-xs text-muted-foreground">
                  {index + 1}. {image.fileName}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => {
                    URL.revokeObjectURL(image.previewUrl)
                    setUploadedImages((current) =>
                      current.filter((item) => item.fileId !== image.fileId),
                    )
                  }}
                >
                  {t('products.create.removeImage', 'Xóa ảnh')}
                </Button>
              </li>
            ))}
          </ol>
        )}
        <p id="product-create-images-hint" className="profile-edit-hint">
          {t('products.create.uploadedImagesCount', { count: uploadedImages.length })}
        </p>
      </div>

      <label className="offer-checkbox-field" htmlFor="product-create-allowOffer">
        <input
          id="product-create-allowOffer"
          type="checkbox"
          disabled={isSubmitting}
          {...register('allowOffer')}
        />
        <span className="grid gap-0.5 text-sm">
          <span className="font-medium text-foreground">
            {t('products.create.allowOfferLabel')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('products.create.allowOfferHint')}
          </span>
        </span>
      </label>

      {fieldError('server', errors.root?.server)}

      <Button type="submit" disabled={isSubmitting || isUploading}>
        {t(isSubmitting ? 'products.create.submitting' : 'products.create.submit')}
      </Button>
    </form>
  )
}
