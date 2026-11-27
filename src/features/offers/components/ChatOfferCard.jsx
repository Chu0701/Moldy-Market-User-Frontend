import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Package, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useAddCartItem } from '@/features/cart/hooks/useCart'
import { OfferCountdown } from '@/features/offers/components/OfferCountdown'
import { OfferStatusBadge } from '@/features/offers/components/OfferStatusBadge'
import {
  useAcceptOffer,
  useCancelOffer,
  useCounterOffer,
  useOfferDetail,
  useRejectOffer,
} from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'
import {
  createCounterOfferSchema,
  formatVndInput,
  getDiscountPercent,
  OFFER_MAX_ROUNDS,
  parseVndInput,
} from '@/features/offers/schemas/offerSchema'

const DIMMED_STATUSES = new Set(['SUPERSEDED', 'REJECTED', 'CANCELLED', 'EXPIRED'])

/**
 * Structured interactive Offer Card rendered inside the Chat thread.
 * @param {{
 *   offerId: string,
 *   userId: string,
 *   peerName?: string | null,
 *   isMine: boolean,
 *   fallbackText?: string,
 * }} props
 */
export function ChatOfferCard({ offerId, userId, peerName, isMine, fallbackText }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [counterOpen, setCounterOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [counterError, setCounterError] = useState(null)
  const [busy, setBusy] = useState(false)

  const offerQuery = useOfferDetail(offerId)
  const acceptMutation = useAcceptOffer()
  const rejectMutation = useRejectOffer()
  const cancelMutation = useCancelOffer()
  const counterMutation = useCounterOffer()
  const addCartMutation = useAddCartItem()

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

  if (offerQuery.isPending) {
    return (
      <div className="chat-offer-card" data-mine={isMine} aria-busy="true">
        <div className="skeleton-shimmer h-16 rounded-lg" />
      </div>
    )
  }

  const offer = offerQuery.data
  if (!offer) {
    return (
      <div className="chat-offer-card" data-mine={isMine} data-dimmed="true">
        <p className="text-xs text-muted-foreground">{fallbackText || t('offers.loadError')}</p>
      </div>
    )
  }

  const viewerRole = offer.buyerId === userId ? 'BUYER' : 'SELLER'
  const isMyTurn = offer.status === 'PENDING' && offer.side !== viewerRole
  const isDimmed = DIMMED_STATUSES.has(offer.status)
  const isAccepted = offer.status === 'ACCEPTED'
  const canBuyerCancel = viewerRole === 'BUYER' && offer.status === 'PENDING'
  const canBuyerCheckout = viewerRole === 'BUYER' && isAccepted && !offer.checkoutGroupId
  const discountPercent = getDiscountPercent(offer.originalPrice, offer.price)
  const headerLabel = isMine
    ? t('offers.chatCard.yourOffer')
    : t('offers.chatCard.offerFrom', { name: peerName || offer.buyerName || t('chat.peer') })
  const pendingContextLabel = isMyTurn
    ? t('offers.contextualPending.yourTurn')
    : viewerRole === 'BUYER'
      ? t('offers.contextualPending.waitingSeller')
      : t('offers.contextualPending.waitingBuyer')

  async function runAction(task, successKey) {
    setBusy(true)
    try {
      await task()
      pushToast(t(successKey), 'success')
      setConfirmCancelOpen(false)
    } catch (error) {
      pushToast(getOfferErrorMessage(error, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleCheckout() {
    setBusy(true)
    try {
      await addCartMutation.mutateAsync({ productId: offer.productId })
      void navigate(`/checkout?productId=${encodeURIComponent(offer.productId)}`)
    } catch (error) {
      pushToast(getOfferErrorMessage(error, t), 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitCounter = handleSubmit(async (values) => {
    setCounterError(null)
    setBusy(true)
    try {
      await counterMutation.mutateAsync({
        offerId: offer.id,
        price: parseVndInput(values.price),
        note: values.note,
      })
      pushToast(t('offers.toast.countered'), 'success')
      reset()
      setCounterOpen(false)
    } catch (error) {
      setCounterError(getOfferErrorMessage(error, t))
    } finally {
      setBusy(false)
    }
  })

  return (
    <article
      id={`chat-offer-${offer.id}`}
      className="chat-offer-card"
      data-mine={isMine}
      data-dimmed={isDimmed}
      data-accepted={isAccepted}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wide text-foreground/80 uppercase">
            {headerLabel}
          </span>
          {offer.roundNumber > 0 && (
            <span
              className="offer-round-pill cursor-help"
              title={t('offers.roundTooltip', { max: OFFER_MAX_ROUNDS })}
            >
              {t('offers.roundLabel', { current: offer.roundNumber, max: OFFER_MAX_ROUNDS })}
            </span>
          )}
        </div>
        {offer.status === 'PENDING' ? (
          <span className={isMyTurn ? 'offer-turn-pill' : 'offer-status-badge'} data-tone="warning">
            <span aria-hidden="true" className="offer-status-dot" />
            <span>{pendingContextLabel}</span>
          </span>
        ) : (
          <OfferStatusBadge status={offer.status} />
        )}
      </div>

      <Link to={`/products/${encodeURIComponent(offer.productId)}`} className="chat-offer-product">
        <div className="offer-product-thumb size-11 shrink-0">
          {offer.productImage ? (
            <img
              src={offer.productImage}
              alt={offer.productTitle ?? ''}
              className="size-full object-cover"
            />
          ) : (
            <Package aria-hidden="true" className="size-4 text-muted-foreground/60" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
            {offer.productTitle || t('offers.productRef', { id: offer.productId.slice(0, 8) })}
          </p>
          <div className="offer-price-pair mt-0.5">
            <ProductPrice value={offer.price} className="text-sm font-bold text-foreground" />
            <ProductPrice value={offer.originalPrice} className="offer-price-original" />
            {discountPercent > 0 && (
              <span className="offer-discount-pill">−{discountPercent}%</span>
            )}
          </div>
        </div>
      </Link>

      {offer.note && <p className="offer-note-quote">“{offer.note}”</p>}

      {offer.status === 'PENDING' && offer.expiresAt && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>{pendingContextLabel}</span>
          <OfferCountdown
            targetIso={offer.expiresAt}
            prefix={t('offers.countdown.remaining')}
            className="offer-countdown-subtle"
            onExpire={() => void offerQuery.refetch()}
          />
        </div>
      )}

      {isAccepted && !offer.checkoutGroupId && (
        <div className="space-y-2 rounded-xl border border-success/30 bg-success/10 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
              {viewerRole === 'BUYER'
                ? t('offers.chatCard.acceptedForBuyer')
                : t('offers.chatCard.acceptedForSeller')}
            </span>
            <OfferCountdown
              targetIso={offer.acceptedExpiresAt}
              prefix={t('offers.countdown.remaining')}
              onExpire={() => void offerQuery.refetch()}
            />
          </div>
          {canBuyerCheckout && (
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => void handleCheckout()}
            >
              <Zap aria-hidden="true" className="size-3.5" />
              <span>
                {t('offers.actions.orderNowAtOffer')} · <ProductPrice value={offer.price} />
              </span>
            </Button>
          )}
        </div>
      )}

      {offer.checkoutGroupId && (
        <Link
          to="/orders"
          className="inline-flex text-xs font-semibold text-primary underline underline-offset-4"
        >
          {t('offers.viewOrderLink')}
        </Link>
      )}

      {isMyTurn && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() =>
              void runAction(
                () => acceptMutation.mutateAsync({ offerId: offer.id }),
                'offers.toast.accepted',
              )
            }
          >
            {t('offers.actions.accept')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setCounterOpen((prev) => !prev)}
          >
            {t('offers.actions.counter')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void runAction(
                () => rejectMutation.mutateAsync({ offerId: offer.id }),
                'offers.toast.rejected',
              )
            }
          >
            {t('offers.actions.reject')}
          </Button>
        </div>
      )}

      {canBuyerCancel && !isMyTurn && (
        <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
          {confirmCancelOpen ? (
            <>
              <span className="text-xs text-muted-foreground">
                {t('offers.actions.cancelConfirmPrompt')}
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    () => cancelMutation.mutateAsync({ offerId: offer.id }),
                    'offers.toast.cancelled',
                  )
                }
              >
                {t('offers.actions.confirmCancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setConfirmCancelOpen(false)}
              >
                {t('common.no')}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              className="offer-cancel-btn"
              onClick={() => setConfirmCancelOpen(true)}
            >
              {t('offers.actions.cancel')}
            </Button>
          )}
        </div>
      )}

      {counterOpen && isMyTurn && (
        <form onSubmit={submitCounter} className="offer-counter-form" noValidate>
          <div className="offer-counter-field">
            <input
              type="text"
              inputMode="numeric"
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
              <p role="alert" className="offer-field-error">
                {errors.price.message}
              </p>
            )}
            {counterError && (
              <p role="alert" className="offer-field-error">
                {counterError}
              </p>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button type="submit" size="sm" disabled={busy}>
              {t('offers.counter.send')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setCounterOpen(false)}
            >
              {t('actions.cancel')}
            </Button>
          </div>
        </form>
      )}
    </article>
  )
}
