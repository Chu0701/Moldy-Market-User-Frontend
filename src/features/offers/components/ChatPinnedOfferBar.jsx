import { useState } from 'react'
import { Package, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useAddCartItem } from '@/features/cart/hooks/useCart'
import { OfferCountdown } from '@/features/offers/components/OfferCountdown'
import { useOfferDetail } from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'

function getContextualStatusKey(offer, viewerRole) {
  if (offer.status === 'ACCEPTED') return 'offers.status.ACCEPTED'
  if (offer.side !== viewerRole) return 'offers.contextualPending.yourTurn'
  return viewerRole === 'BUYER'
    ? 'offers.contextualPending.waitingSeller'
    : 'offers.contextualPending.waitingBuyer'
}

/**
 * Compact 2-row sticky top bar inside a chat thread showing the currently active Offer.
 * Clicking the bar smoothly scrolls to the corresponding Offer Card in the conversation.
 * @param {{ offerId?: string | null, userId: string }} props
 */
export function ChatPinnedOfferBar({ offerId, userId }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [buying, setBuying] = useState(false)
  const addCartMutation = useAddCartItem()
  const offerQuery = useOfferDetail(offerId, { enabled: Boolean(offerId) })

  const offer = offerQuery.data
  if (!offer) return null
  const isActive =
    offer.status === 'PENDING' || (offer.status === 'ACCEPTED' && !offer.checkoutGroupId)
  if (!isActive) return null

  const viewerRole = offer.buyerId === userId ? 'BUYER' : 'SELLER'
  const isMyTurn = offer.status === 'PENDING' && offer.side !== viewerRole
  const canCheckout = viewerRole === 'BUYER' && offer.status === 'ACCEPTED'
  const deadline = offer.status === 'ACCEPTED' ? offer.acceptedExpiresAt : offer.expiresAt
  const statusLabel = t(getContextualStatusKey(offer, viewerRole))

  function scrollToCard() {
    const target = document.getElementById(`chat-offer-${offer.id}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function handleCheckout(event) {
    event.stopPropagation()
    setBuying(true)
    try {
      await addCartMutation.mutateAsync({ productId: offer.productId })
      void navigate(`/checkout?productId=${encodeURIComponent(offer.productId)}`)
    } catch (error) {
      pushToast(getOfferErrorMessage(error, t), 'error')
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="chat-pinned-offer" role="region" aria-label={t('offers.chatCard.pinnedLabel')}>
      <button
        type="button"
        onClick={scrollToCard}
        title={t('offers.chatCard.scrollToOffer')}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="offer-product-thumb size-10 shrink-0">
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
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <ProductPrice value={offer.price} className="text-xs font-bold text-foreground" />
            <span
              className={
                offer.status === 'ACCEPTED'
                  ? 'offer-agreed-pill'
                  : isMyTurn
                    ? 'offer-turn-pill'
                    : 'text-[11px] font-medium text-muted-foreground'
              }
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <OfferCountdown targetIso={deadline} onExpire={() => void offerQuery.refetch()} />
        {canCheckout && (
          <Button type="button" size="sm" disabled={buying} onClick={(e) => void handleCheckout(e)}>
            <Zap aria-hidden="true" className="size-3.5" />
            <span>{t('offers.actions.orderNowAtOffer')}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
