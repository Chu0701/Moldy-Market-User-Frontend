import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
  OFFER_MIN_PRICE_RATIO,
} from '@/features/offers/schemas/offerSchema'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { getPublicStore } from '@/services/stores/storeService'

const QUICK_RATIOS = [0.8, 0.85, 0.9]

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
  const schema = useMemo(() => createInitialOfferSchema(t, originalPrice), [t, originalPrice])
  const isBusy = createOfferMutation.isPending || openingChat

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { price: '' },
  })

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
        // Fall through to offer/product sellerId
      }
    }
    return createdOffer?.sellerId ?? product.sellerId ?? null
  }

  async function onSubmit(values) {
    const offerPrice = Number(values.price)
    try {
      const createdOffer = await createOfferMutation.mutateAsync({
        productId: product.id,
        price: offerPrice,
      })
      pushToast(t('offers.toast.created'), 'success')
      setOpeningChat(true)
      const targetUserId = await resolveRecipientId(createdOffer)
      const room =
        targetUserId && targetUserId !== userId ? await startStoreChat.open(targetUserId) : null
      onClose()
      if (room) {
        const imageUrl = getProductMediaUrls(product)[0]
        void navigate(`/chat/${encodeURIComponent(room.id)}`, {
          state: {
            productContext: {
              id: product.id,
              title: product.title,
              price: originalPrice,
              imageUrl,
            },
            offerContext: {
              id: createdOffer?.id ?? `${product.id}-${offerPrice}`,
              productId: product.id,
              productTitle: product.title,
              productImageUrl: imageUrl,
              originalPrice,
              offerPrice,
            },
          },
        })
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
          <div className="min-w-0">
            <h2 id="make-offer-title" className="offer-modal-title">
              {t('offers.modal.title')}
            </h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.title}</p>
          </div>
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
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-subtle px-3.5 py-2.5 text-sm">
            <span className="text-muted-foreground">{t('offers.modal.listedPrice')}</span>
            <ProductPrice value={originalPrice} className="font-semibold text-foreground" />
          </div>

          {originalPrice > 0 && (
            <div className="space-y-1.5">
              <p className="offer-field-hint">{t('offers.modal.quickSuggestions')}</p>
              <div className="offer-quick-pills">
                {QUICK_RATIOS.map((ratio) => {
                  const suggested = Math.max(minPrice, Math.floor(originalPrice * ratio))
                  if (suggested >= originalPrice) return null
                  return (
                    <button
                      key={ratio}
                      type="button"
                      className="offer-quick-pill"
                      onClick={() =>
                        setValue('price', String(suggested), {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      {Math.round(ratio * 100)}% · <ProductPrice value={suggested} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="offer-field">
            <label htmlFor="offer-price-input">{t('offers.modal.priceLabel')}</label>
            <input
              id="offer-price-input"
              type="number"
              inputMode="numeric"
              min={minPrice}
              max={Math.max(minPrice, originalPrice - 1)}
              step="1000"
              className="kn-input"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? 'offer-price-error' : 'offer-price-hint'}
              disabled={isBusy}
              {...register('price')}
            />
            {errors.price ? (
              <p id="offer-price-error" role="alert" className="offer-field-error">
                {errors.price.message}
              </p>
            ) : (
              <p id="offer-price-hint" className="offer-field-hint">
                {t('offers.modal.rangeHintPrefix')} <ProductPrice value={minPrice} /> –{' '}
                <ProductPrice value={Math.max(minPrice, originalPrice - 1)} />
              </p>
            )}
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
            <Button type="submit" disabled={isBusy}>
              {isBusy ? t('offers.modal.submitting') : t('offers.modal.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
