import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { AutoPricingPanel } from '@/features/pricing/components/AutoPricingPanel'
import { useEditProductForm } from '@/features/products/hooks/useEditProductForm'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'

const conditions = [
  ['NEW', 'products.conditions.new'],
  ['LIKE_NEW', 'products.conditions.likeNew'],
  ['USED', 'products.conditions.used'],
  ['DAMAGED', 'products.conditions.damaged'],
]

export function ProductEditForm({ product, refetch, isFetching, onSaved }) {
  const { t } = useTranslation()
  const [mediaChanged, setMediaChanged] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [mediaItems, setMediaItems] = useState(() => {
    const urls = getProductMediaUrls(product)
    return urls.map((url, index) => ({
      fileId: product.imageFileIds?.[index] ?? null,
      fileName: product.media?.[index]?.fileName ?? `Image ${index + 1}`,
      previewUrl: url,
    }))
  })
  const imageFileIds = mediaChanged ? mediaItems.map(({ fileId }) => fileId).filter(Boolean) : null
  const { form, submit, reload, hasConflict } = useEditProductForm({
    product,
    refetch,
    onSaved,
    imageFileIds,
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

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

  function moveMedia(index, offset) {
    const target = index + offset
    if (target < 0 || target >= mediaItems.length) return
    setMediaItems((items) => {
      const next = [...items]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setMediaChanged(true)
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="product-create-field">
          <label htmlFor="product-edit-price">{t('products.create.priceLabel')}</label>
          <input {...fieldProps('price')} inputMode="decimal" required readOnly={isSubmitting} />
          {Number(form.watch('price')) > 0 && (
            <p className="text-xs font-medium text-muted-foreground tabular-nums">
              ≈ <ProductPrice value={Number(form.watch('price'))} />
            </p>
          )}
          {fieldError('price')}
        </div>

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
      </div>

      <AutoPricingPanel
        categoryId={product.categoryId}
        disabled={isSubmitting || hasConflict}
        onApplyPrice={(suggested) =>
          form.setValue('price', String(suggested), { shouldValidate: true, shouldDirty: true })
        }
      />

      <div className="product-create-field">
        <span className="product-create-field-label">{t('products.create.imagesLabel')}</span>
        <MediaUploadButton
          purpose="PRODUCT_IMAGE"
          allowVideo={false}
          resolveDownloadUrl={false}
          disabled={isSubmitting || hasConflict || mediaItems.length >= 10}
          onUploadingChange={setIsUploading}
          onUploadResult={({ fileId }, file) => {
            setMediaItems((items) => [
              ...items,
              { fileId, fileName: file.name, previewUrl: URL.createObjectURL(file) },
            ])
            setMediaChanged(true)
          }}
        />
        {mediaItems.length > 0 && (
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {mediaItems.map((image, index) => (
              <li key={`${image.fileId ?? image.previewUrl}-${index}`} className="relative">
                <img
                  src={image.previewUrl}
                  alt={image.fileName}
                  className="aspect-square w-full rounded-md object-cover"
                />
                <span className="text-xs text-muted-foreground">
                  {index + 1}. {image.fileName}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0 || isSubmitting}
                    onClick={() => moveMedia(index, -1)}
                  >
                    {t('products.edit.moveUp')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === mediaItems.length - 1 || isSubmitting}
                    onClick={() => moveMedia(index, 1)}
                  >
                    {t('products.edit.moveDown')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      setMediaItems((items) => items.filter((_, itemIndex) => itemIndex !== index))
                      setMediaChanged(true)
                    }}
                  >
                    {t('products.create.removeImage', 'Xóa ảnh')}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
        {!mediaChanged &&
          (product.imageFileIds ?? []).length === 0 &&
          product.images?.length > 0 && (
            <p className="profile-edit-hint">{t('products.edit.legacyImagesHint')}</p>
          )}
        <p className="profile-edit-hint">
          {t('products.create.uploadedImagesCount', { count: mediaItems.length })}
        </p>
      </div>

      <label className="offer-checkbox-field" htmlFor="product-edit-allowOffer">
        <input
          id="product-edit-allowOffer"
          type="checkbox"
          disabled={isSubmitting || hasConflict}
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
        <Button type="submit" disabled={isSubmitting || hasConflict || isUploading}>
          {t(isSubmitting ? 'products.edit.saving' : 'actions.save')}
        </Button>
        <Button asChild variant="outline">
          <Link to={`/products/${encodeURIComponent(product.id)}`}>{t('actions.cancel')}</Link>
        </Button>
      </div>
    </form>
  )
}
