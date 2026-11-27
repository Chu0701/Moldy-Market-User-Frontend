import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { History, MessageCircle, Package, User, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { OfferCountdown } from '@/features/offers/components/OfferCountdown'
import { OfferStatusBadge } from '@/features/offers/components/OfferStatusBadge'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'
import {
  createCounterOfferSchema,
  formatVndInput,
  getDiscountPercent,
  OFFER_MAX_ROUNDS,
  parseVndInput,
} from '@/features/offers/schemas/offerSchema'
import { OrderDate } from '@/features/orders/components/OrderDate'

/**
 * @param {{
 *   offer: import('@/services/offers/offerService').OfferResponse,
 *   viewerRole: 'BUYER' | 'SELLER',
 *   busyOfferId: string | null,
 *   onAccept: (offerId: string) => void,
 *   onReject: (offerId: string) => void,
 *   onCancel?: (offerId: string) => void,
 *   onCounter: (payload: { offerId: string, price: number, note?: string }) => Promise<void>,
 *   onCheckoutAccepted?: (productId: string) => void,
 *   onOpenHistory: (offerId: string) => void,
 *   onOpenChat?: (offer: import('@/services/offers/offerService').OfferResponse) => void,
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
  onOpenChat,
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
    defaultValues: { price: '', note: '' },
  })

  const isBusy = busyOfferId === offer.id
  const isMyTurn = offer.status === 'PENDING' && offer.side !== viewerRole
  const canBuyerCancel = viewerRole === 'BUYER' && offer.status === 'PENDING'
  const canBuyerCheckout =
    viewerRole === 'BUYER' && offer.status === 'ACCEPTED' && !offer.checkoutGroupId
  const discountPercent = getDiscountPercent(offer.originalPrice, offer.price)

  const submitCounter = handleSubmit(async (values) => {
    setCounterApiError(null)
    try {
      await onCounter({
        offerId: offer.id,
        price: parseVndInput(values.price),
        note: values.note,
      })
      reset()
      setCounterOpen(false)
    } catch (error) {
      setCounterApiError(getOfferErrorMessage(error, t))
    }
  })

  return (
    <li className="offer-row" data-needs-action={isMyTurn}>
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <Link
          to={`/products/${encodeURIComponent(offer.productId)}`}
          className="offer-product-thumb shrink-0"
          aria-hidden="true"
          tabIndex={-1}
        >
          {offer.productImage ? (
            <img
              src={offer.productImage}
              alt={offer.productTitle ?? ''}
              className="size-full object-cover"
            />
          ) : (
            <Package aria-hidden="true" className="size-5 text-muted-foreground/60" />
          )}
        </Link>

        <div className="offer-row-main">
          <div className="offer-row-top">
            <OfferStatusBadge status={offer.status} />
            {isMyTurn && <span className="offer-turn-pill">{t('offers.turn.yourTurn')}</span>}
            {offer.status === 'PENDING' && !isMyTurn && (
              <span className="text-xs font-medium text-muted-foreground">
                {t('offers.turn.waitingPeer')}
              </span>
            )}
            {offer.roundNumber > 0 && (
              <span className="offer-round-pill">
                {t('offers.roundLabel', {
                  current: offer.roundNumber,
                  max: OFFER_MAX_ROUNDS,
                })}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="offer-discount-pill">−{discountPercent}%</span>
            )}
          </div>

          <Link
            to={`/products/${encodeURIComponent(offer.productId)}`}
            className="block truncate text-sm font-semibold text-foreground underline-offset-4 hover:underline"
          >
            {offer.productTitle || t('offers.productRef', { id: offer.productId.slice(0, 8) })}
          </Link>

          <div className="offer-price-pair">
            <ProductPrice value={offer.price} className="offer-price-current" />
            <ProductPrice value={offer.originalPrice} className="offer-price-original" />
            {viewerRole === 'SELLER' && offer.buyerName && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <User aria-hidden="true" className="size-3.5" />
                {offer.buyerName}
              </span>
            )}
          </div>

          {offer.note && <p className="offer-note-quote">“{offer.note}”</p>}

          <div className="offer-meta">
            <span>
              {t('offers.createdAt')}: <OrderDate value={offer.createdAt} />
            </span>
            {offer.status === 'PENDING' && offer.expiresAt && (
              <OfferCountdown
                targetIso={offer.expiresAt}
                prefix={t('offers.countdown.remaining')}
              />
            )}
            {offer.status === 'ACCEPTED' && !offer.checkoutGroupId && offer.acceptedExpiresAt && (
              <OfferCountdown
                targetIso={offer.acceptedExpiresAt}
                prefix={t('offers.countdown.orderBefore')}
              />
            )}
            {offer.checkoutGroupId && (
              <Link to="/orders" className="font-medium text-primary underline underline-offset-4">
                {t('offers.viewOrderLink')}
              </Link>
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
                  type="text"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={errors.price ? `counter-error-${offer.id}` : undefined}
                  placeholder={t('offers.counter.placeholder')}
                  className="kn-input tabular-nums"
                  {...register('price', {
                    onChange: (event) => {
                      event.target.value = formatVndInput(event.target.value)
                    },
                  })}
                />
                <input
                  type="text"
                  maxLength={300}
                  placeholder={t('offers.modal.notePlaceholder')}
                  className="kn-input mt-1.5"
                  {...register('note')}
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
                  setCounterOpen(false)
                  setCounterApiError(null)
                }}
              >
                {t('actions.cancel')}
              </Button>
            </form>
          )}
        </div>
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
              variant="outline"
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

        {onOpenChat && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => onOpenChat(offer)}
          >
            <MessageCircle aria-hidden="true" className="size-3.5" />
            <span>{t('offers.actions.openChat')}</span>
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isBusy}
          onClick={() => onOpenHistory(offer.id)}
        >
          <History aria-hidden="true" className="size-3.5" />
          <span>{t('offers.actions.history')}</span>
        </Button>
      </div>
    </li>
  )
}
