import { useState } from 'react'
import { BadgeDollarSign, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { MakeOfferModal } from '@/features/offers/components/MakeOfferModal'
import { useActiveProductOffer } from '@/features/offers/hooks/useOffers'

/**
 * Sticky bottom bar on mobile screens keeping price, offer shortcut, and purchase action one tap away.
 * @param {{ price: number, product?: object, targetId?: string }} props
 */
export function MobileBuyBar({ price, product, targetId = 'product-purchase-box' }) {
  const { t } = useTranslation()
  const [offerOpen, setOfferOpen] = useState(false)
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data
  const isOwnProduct = Boolean(
    product &&
    profile &&
    (product.sellerId === profile.id || (product.storeId && product.storeId === profile.storeId)),
  )
  const canQueryOffer = Boolean(
    product &&
    hasAccessToken &&
    profile?.id &&
    !isOwnProduct &&
    product.status === 'ACTIVE' &&
    product.allowOffer !== false,
  )
  const activeOfferQuery = useActiveProductOffer(product?.id, { enabled: canQueryOffer })
  const activeOffer = activeOfferQuery.data ?? null
  const acceptedOffer =
    activeOffer?.status === 'ACCEPTED' && !activeOffer.checkoutGroupId ? activeOffer : null
  const displayPrice = acceptedOffer ? acceptedOffer.price : price
  const showOfferIcon = Boolean(
    product &&
    hasAccessToken &&
    profile?.id &&
    !isOwnProduct &&
    product.allowOffer !== false &&
    !activeOffer,
  )

  if (isOwnProduct) return null

  function scrollToPurchase() {
    const target = document.getElementById(targetId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-md md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {acceptedOffer
                ? t('offers.checkout.agreedPriceBadge')
                : t('products.detail.mobilePriceLabel')}
            </p>
            <div className="flex items-baseline gap-2">
              <ProductPrice
                value={displayPrice}
                className="block truncate text-lg font-bold text-foreground"
              />
              {acceptedOffer && <ProductPrice value={price} className="offer-price-original" />}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showOfferIcon && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11"
                aria-label={t('offers.actions.makeOffer')}
                title={t('offers.actions.makeOffer')}
                onClick={() => setOfferOpen(true)}
              >
                <BadgeDollarSign aria-hidden="true" className="size-5" />
              </Button>
            )}
            <Button
              type="button"
              onClick={scrollToPurchase}
              className="min-h-11 shrink-0 gap-2 px-5"
            >
              <ShoppingBag aria-hidden="true" className="size-4" />
              <span>
                {acceptedOffer
                  ? t('offers.actions.orderNowAtOffer')
                  : t('products.detail.jumpToPurchase')}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {offerOpen && product && (
        <MakeOfferModal product={product} onClose={() => setOfferOpen(false)} />
      )}
    </>
  )
}
