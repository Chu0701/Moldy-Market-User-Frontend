import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, ShieldCheck, X } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { useStartStoreChat } from '@/features/chat/hooks/useStartStoreChat'
import { useCreateOffer } from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'
import {
  createInitialOfferSchema,
  formatVndInput,
  getDiscountPercent,
  OFFER_MIN_PRICE_RATIO,
  parseVndInput,
} from '@/features/offers/schemas/offerSchema'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { getPublicStore } from '@/services/stores/storeService'

const QUICK_DISCOUNTS = [
  { label: '−5%', ratio: 0.95 },
  { label: '−10%', ratio: 0.9 },
  { label: '−15%', ratio: 0.85 },
]

/** @param {{ product: object, onClose: () => void }} props */
export function MakeOfferModal({ product, onClose }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const storeQuery = usePublicStore(product.storeId)
  const startStoreChat = useStartStoreChat(userId)
  const createOfferMutation = useCreateOffer()
  const [openingChat, setOpeningChat] = useState(false)

  const originalPrice = Number(product.price) || 0
  const minPrice = Math.ceil(originalPrice * OFFER_MIN_PRICE_RATIO)
  const maxPrice = Math.max(minPrice, originalPrice - 1)
  const imageUrl = getProductMediaUrls(product)[0]
  const schema = useMemo(() => createInitialOfferSchema(t, originalPrice), [t, originalPrice])
  const isBusy = createOfferMutation.isPending || openingChat

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { price: '', note: '' },
  })

  const rawPrice = useWatch({ control, name: 'price' })
  const parsedPrice = parseVndInput(rawPrice)
  const discountPercent = getDiscountPercent(originalPrice, parsedPrice)

  let instantBlockReason = errors.price?.message ?? null
  if (!instantBlockReason && rawPrice) {
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      instantBlockReason = t('offers.validation.pricePositive')
    } else if (parsedPrice < minPrice) {
      instantBlockReason = t('offers.validation.priceBelowMin')
    } else if (parsedPrice >= originalPrice) {
      instantBlockReason = t('offers.validation.priceMustBeBelowOriginal')
    }
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isBusy, onClose])

  async function resolveRecipientId(createdOffer) {
    if (product.storeId) {
      if (storeQuery.data?.id === product.storeId && storeQuery.data?.ownerId) {
        return storeQuery.data.ownerId
      }
      try {
        const store = await getPublicStore({ storeId: product.storeId })
        if (store?.ownerId) return store.ownerId
      } catch {
        // Fallback below
      }
    }
    return createdOffer?.sellerId ?? product.sellerId ?? null
  }

  async function onSubmit(values) {
    const offerPrice = parseVndInput(values.price)
    try {
      const createdOffer = await createOfferMutation.mutateAsync({
        productId: product.id,
        price: offerPrice,
        note: values.note,
      })
      pushToast(t('offers.toast.created'), 'success')
      setOpeningChat(true)
      const targetUserId = await resolveRecipientId(createdOffer)
      const room =
        targetUserId && targetUserId !== userId ? await startStoreChat.open(targetUserId) : null
      onClose()
      if (room) {
        void navigate(`/chat/${encodeURIComponent(room.id)}`)
      }
    } catch {
      // Rendered inline via createOfferMutation.error
    } finally {
      setOpeningChat(false)
    }
  }

  const serverError = createOfferMutation.isError
    ? getOfferErrorMessage(createOfferMutation.error, t)
    : null
  const isSubmitDisabled = isBusy || !rawPrice || Boolean(instantBlockReason)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="make-offer-title"
      className="offer-modal-backdrop"
      onClick={() => {
        if (!isBusy) onClose()
      }}
    >
      <div className="offer-modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="offer-modal-header">
          <h2 id="make-offer-title" className="offer-modal-title">
            {t('offers.modal.title')}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.close')}
            disabled={isBusy}
            onClick={onClose}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <form className="offer-modal-body" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="offer-product-summary">
            <div className="offer-product-thumb">
              {imageUrl ? (
                <img src={imageUrl} alt={product.title} className="size-full object-cover" />
              ) : (
                <Package aria-hidden="true" className="size-5 text-muted-foreground/60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{product.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('offers.modal.listedPrice')}:{' '}
                <ProductPrice value={originalPrice} className="font-medium text-muted-foreground" />
              </p>
            </div>
          </div>

          <div className="offer-field">
            <label htmlFor="offer-price-input">{t('offers.modal.priceLabel')}</label>
            <div className="offer-price-input-wrap" data-invalid={Boolean(instantBlockReason)}>
              <input
                id="offer-price-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder={formatVndInput(Math.floor(originalPrice * 0.9))}
                className="offer-price-input"
                aria-invalid={Boolean(instantBlockReason)}
                aria-describedby={instantBlockReason ? 'offer-price-error' : 'offer-price-hint'}
                disabled={isBusy}
                {...register('price', {
                  onChange: (event) => {
                    event.target.value = formatVndInput(event.target.value)
                  },
                })}
              />
              <span aria-hidden="true" className="offer-price-unit">
                ₫
              </span>
            </div>

            {instantBlockReason ? (
              <p id="offer-price-error" role="alert" className="offer-field-error">
                {instantBlockReason}
              </p>
            ) : (
              <p id="offer-price-hint" className="offer-field-hint">
                {t('offers.modal.rangeHintPrefix')} <ProductPrice value={minPrice} /> –{' '}
                <ProductPrice value={maxPrice} />
                {discountPercent > 0 && (
                  <span className="offer-discount-pill ml-2">−{discountPercent}%</span>
                )}
              </p>
            )}
          </div>

          {originalPrice > 0 && (
            <div className="offer-quick-pills" aria-label={t('offers.modal.quickSuggestions')}>
              {QUICK_DISCOUNTS.map(({ label, ratio }) => {
                const suggested = Math.max(minPrice, Math.floor(originalPrice * ratio))
                if (suggested >= originalPrice) return null
                const isActive = parsedPrice === suggested
                return (
                  <button
                    key={label}
                    type="button"
                    className="offer-quick-pill"
                    data-active={isActive}
                    disabled={isBusy}
                    onClick={() =>
                      setValue('price', formatVndInput(suggested), {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <span>{label}</span>
                    <span className="text-muted-foreground">·</span>
                    <ProductPrice value={suggested} />
                  </button>
                )
              })}
            </div>
          )}

          <div className="offer-field">
            <label htmlFor="offer-note-input">{t('offers.modal.noteLabel')}</label>
            <input
              id="offer-note-input"
              type="text"
              maxLength={300}
              placeholder={t('offers.modal.notePlaceholder')}
              className="kn-input"
              disabled={isBusy}
              {...register('note')}
            />
            {errors.note && (
              <p role="alert" className="offer-field-error">
                {errors.note.message}
              </p>
            )}
          </div>

          <div className="offer-escrow-note">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            <span>{t('offers.modal.escrowHint')}</span>
          </div>

          {serverError && (
            <p role="alert" className="offer-alert-error">
              {serverError}
            </p>
          )}

          <div className="offer-modal-footer">
            <Button type="button" variant="outline" disabled={isBusy} onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isBusy ? t('offers.modal.submitting') : t('offers.modal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
