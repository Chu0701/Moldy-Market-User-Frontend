import { useState } from 'react'
import { BadgeDollarSign, CheckCircle2, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { useAddCartItem } from '@/features/cart/hooks/useCart'
import { MakeOfferModal } from '@/features/offers/components/MakeOfferModal'
import { OfferCountdown } from '@/features/offers/components/OfferCountdown'
import { OfferStatusBadge } from '@/features/offers/components/OfferStatusBadge'
import { useActiveProductOffer } from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'

/** @param {{ product: object, className?: string }} props */
export function MakeOfferButton({ product, className }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [buyingOffer, setBuyingOffer] = useState(false)
  const { hasAccessToken, profileQuery } = useSession()
  const addCartMutation = useAddCartItem()
  const profile = profileQuery.data

  const isOwnProduct =
    profile &&
    (product.sellerId === profile.id || (product.storeId && product.storeId === profile.storeId))

  const canQueryOffer = Boolean(
    hasAccessToken &&
    profile?.id &&
    !isOwnProduct &&
    product.status === 'ACTIVE' &&
    product.allowOffer !== false,
  )
  const activeOfferQuery = useActiveProductOffer(product.id, { enabled: canQueryOffer })
  const activeOffer = activeOfferQuery.data ?? null

  if (product.status !== 'ACTIVE' || product.allowOffer === false || isOwnProduct) {
    return null
  }

  if (!hasAccessToken) {
    return (
      <Button asChild variant="outline" className={className}>
        <Link to="/login" state={{ from: `/products/${encodeURIComponent(product.id)}` }}>
          <BadgeDollarSign aria-hidden="true" className="size-4" />
          <span>{t('offers.actions.makeOffer')}</span>
        </Link>
      </Button>
    )
  }

  if (!profile) return null

  async function handleCheckoutAtOfferPrice() {
    setBuyingOffer(true)
    try {
      await addCartMutation.mutateAsync({ productId: product.id })
      void navigate(`/checkout?productId=${encodeURIComponent(product.id)}`)
    } catch (error) {
      pushToast(getOfferErrorMessage(error, t), 'error')
    } finally {
      setBuyingOffer(false)
    }
  }

  if (activeOffer?.status === 'ACCEPTED' && !activeOffer.checkoutGroupId) {
    return (
      <div className="offer-accepted-cta-box">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {t('offers.productBanner.acceptedLabel')}{' '}
            <ProductPrice value={activeOffer.price} className="font-bold text-success" />
          </span>
          <OfferCountdown
            targetIso={activeOffer.acceptedExpiresAt}
            prefix={t('offers.countdown.remaining')}
            onExpire={() => void activeOfferQuery.refetch()}
          />
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={buyingOffer}
          onClick={() => void handleCheckoutAtOfferPrice()}
        >
          <Zap aria-hidden="true" className="size-4" />
          <span>
            {t('offers.actions.orderNowAtOffer')} · <ProductPrice value={activeOffer.price} />
          </span>
        </Button>
      </div>
    )
  }

  if (activeOffer?.status === 'PENDING') {
    return (
      <Button
        asChild
        variant="outline"
        className={className ? `${className} justify-between` : 'w-full justify-between'}
      >
        <Link to="/offers">
          <span className="inline-flex items-center gap-2">
            <BadgeDollarSign aria-hidden="true" className="size-4" />
            <span>{t('offers.actions.viewYourOffer')}</span>
          </span>
          <OfferStatusBadge status="PENDING" />
        </Link>
      </Button>
    )
  }

  return (
    <>
      <Button type="button" variant="outline" className={className} onClick={() => setOpen(true)}>
        <BadgeDollarSign aria-hidden="true" className="size-4" />
        <span>{t('offers.actions.makeOffer')}</span>
      </Button>

      {open && <MakeOfferModal product={product} onClose={() => setOpen(false)} />}
    </>
  )
}
