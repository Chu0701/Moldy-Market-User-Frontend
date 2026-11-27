import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { History, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { OfferStatusBadge } from '@/features/offers/components/OfferStatusBadge'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'
import { createCounterOfferSchema } from '@/features/offers/schemas/offerSchema'
import { OrderDate } from '@/features/orders/components/OrderDate'

/**
 * @param {{
 *   offer: import('@/services/offers/offerService').OfferResponse,
 *   viewerRole: 'BUYER' | 'SELLER',
 *   busyOfferId: string | null,
 *   onAccept: (offerId: string) => void,
 *   onReject: (offerId: string) => void,
 *   onCancel?: (offerId: string) => void,
 *   onCounter: (payload: { offerId: string, price: number }) => Promise<void>,
 *   onCheckoutAccepted?: (productId: string) => void,
 *   onOpenHistory: (offerId: string) => void,
 * }} props
 */
export function OfferRow({
  offer,
  viewerRole,
  busyOfferId,
  onAccept,
  onReject,
  onCancel,
  onCounter,
  onCheckoutAccepted,
  onOpenHistory,
}) {
  const { t } = useTranslation()
  const [counterOpen, setCounterOpen] = useState(false)
  const [counterApiError, setCounterApiError] = useState(null)

  const schema = useMemo(() => createCounterOfferSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { price: '' },
  })

  const isBusy = busyOfferId === offer.id
  const isMyTurn = offer.status === 'PENDING' && offer.side !== viewerRole
  const canBuyerCancel = viewerRole === 'BUYER' && offer.status === 'PENDING'
  const canBuyerCheckout = viewerRole === 'BUYER' && offer.status === 'ACCEPTED'

  const submitCounter = handleSubmit(async (values) => {
    setCounterApiError(null)
    try {
      await onCounter({ offerId: offer.id, price: Number(values.price) })
      reset()
      setCounterOpen(false)
    } catch (error) {
      setCounterApiError(getOfferErrorMessage(error, t))
    }
  })

  return (
    <li className="offer-row">
      <div className="offer-row-main">
        <div className="offer-row-top">
          <OfferStatusBadge status={offer.status} />
          <span className="text-xs font-medium text-muted-foreground">
            {t(`offers.side.${offer.side}`)}
          </span>
          <Link
            to={`/products/${encodeURIComponent(offer.productId)}`}
            className="font-mono text-xs text-foreground underline-offset-4 hover:underline"
          >
            {t('offers.productRef', { id: offer.productId.slice(0, 8) })}
          </Link>
        </div>

        <div className="offer-price-pair">
          <ProductPrice value={offer.price} className="offer-price-current" />
          <ProductPrice value={offer.originalPrice} className="offer-price-original" />
        </div>

        <div className="offer-meta">
          <span>
            {t('offers.createdAt')}: <OrderDate value={offer.createdAt} />
          </span>
          {offer.status === 'PENDING' && offer.expiresAt && (
            <span>
              {t('offers.expiresAt')}: <OrderDate value={offer.expiresAt} />
            </span>
          )}
          {offer.status === 'ACCEPTED' && offer.acceptedExpiresAt && (
            <span className="font-medium text-success">
              {t('offers.checkoutBefore')}: <OrderDate value={offer.acceptedExpiresAt} />
            </span>
          )}
        </div>

        {counterOpen && (
          <form onSubmit={submitCounter} className="offer-counter-form" noValidate>
            <div className="offer-counter-field">
              <label htmlFor={`counter-${offer.id}`} className="sr-only">
                {t('offers.counter.priceLabel')}
              </label>
              <input
                id={`counter-${offer.id}`}
                type="number"
                inputMode="numeric"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? `counter-error-${offer.id}` : undefined}
                placeholder={t('offers.counter.placeholder')}
                className="kn-input tabular-nums"
                {...register('price')}
              />
              {errors.price && (
                <p id={`counter-error-${offer.id}`} role="alert" className="offer-field-error">
                  {errors.price.message}
                </p>
              )}
              {counterApiError && (
                <p role="alert" className="offer-field-error">
                  {counterApiError}
                </p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={isBusy}>
              {t('offers.counter.send')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isBusy}
              onClick={() => {
                setCounterApiError(null)
                setCounterOpen(false)
              }}
            >
              {t('actions.cancel')}
            </Button>
          </form>
        )}
      </div>

      <div className="offer-row-actions">
        {isMyTurn && (
          <>
            <Button type="button" size="sm" disabled={isBusy} onClick={() => onAccept(offer.id)}>
              {t('offers.actions.accept')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => setCounterOpen((prev) => !prev)}
            >
              {t('offers.actions.counter')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onClick={() => onReject(offer.id)}
            >
              {t('offers.actions.reject')}
            </Button>
          </>
        )}

        {canBuyerCancel && onCancel && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isBusy}
            onClick={() => onCancel(offer.id)}
          >
            {t('offers.actions.cancel')}
          </Button>
        )}

        {canBuyerCheckout && onCheckoutAccepted && (
          <Button
            type="button"
            size="sm"
            disabled={isBusy}
            onClick={() => onCheckoutAccepted(offer.productId)}
          >
            <Zap aria-hidden="true" className="size-3.5" />
            <span>{t('offers.actions.buyAtOfferPrice')}</span>
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={t('offers.actions.history')}
          onClick={() => onOpenHistory(offer.id)}
        >
          <History aria-hidden="true" className="size-3.5" />
          <span>{t('offers.actions.history')}</span>
        </Button>
      </div>
    </li>
  )
}
