import { useState } from 'react'
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { AddToCartButton } from '@/features/cart/components/AddToCartButton'
import { BuyNowButton } from '@/features/cart/components/BuyNowButton'
import { useAddCartItem } from '@/features/cart/hooks/useCart'
import { StoreChatButton } from '@/features/chat/components/StoreChatButton'
import { MakeOfferButton } from '@/features/offers/components/MakeOfferButton'
import { OfferCountdown } from '@/features/offers/components/OfferCountdown'
import { useActiveProductOffer } from '@/features/offers/hooks/useOffers'
import { getOfferErrorMessage } from '@/features/offers/offerErrorMessage'
import { CompareToggleButton } from '@/features/products/components/CompareToggleButton'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'
import { WishlistButton } from '@/features/wishlist/components/WishlistButton'

/**
 * 3-tier product purchase box:
 * Price header -> Tier 1 (Buy/Cart) -> Tier 2 (Make Offer) -> Tier 3 (Wishlist/Compare/Chat) -> Escrow protection.
 *
 * @param {{ product: object, canManage?: boolean }} props
 */
export function ProductPurchaseBox({ product, canManage = false }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const { hasAccessToken, profileQuery } = useSession()
  const addCartMutation = useAddCartItem()
  const [buyingOffer, setBuyingOffer] = useState(false)
  const profile = profileQuery.data

  const isOwnProduct = Boolean(
    canManage ||
    (profile &&
      (product.sellerId === profile.id ||
        (product.storeId && product.storeId === profile.storeId))),
  )
  const isActive = product.status === 'ACTIVE'
  const canQueryOffer = Boolean(
    hasAccessToken && profile?.id && !isOwnProduct && isActive && product.allowOffer !== false,
  )
  const activeOfferQuery = useActiveProductOffer(product.id, { enabled: canQueryOffer })
  const activeOffer = activeOfferQuery.data ?? null
  const acceptedOffer =
    activeOffer?.status === 'ACCEPTED' && !activeOffer.checkoutGroupId ? activeOffer : null
  const imageUrl = getProductMediaUrls(product)[0]

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

  if (isOwnProduct) {
    return (
      <div id="product-purchase-box" className="purchase-box">
        <ProductPrice value={product.price} className="purchase-box-price" />
        {product.storeId && (
          <div className="purchase-tier3-bar">
            <StoreChatButton key={`chat-${product.id}`} storeId={product.storeId} subtle />
          </div>
        )}
      </div>
    )
  }

  if (!isActive) {
    return (
      <div id="product-purchase-box" className="purchase-box">
        <ProductPrice
          value={product.price}
          className="purchase-box-price text-muted-foreground line-through"
        />
        <p className="purchase-unavailable-banner">
          {product.status === 'SOLD'
            ? t('products.detail.soldNotice')
            : t('products.detail.hiddenNotice')}
        </p>
        <div className="purchase-tier3-bar">
          <WishlistButton key={`wishlist-${product.id}`} productId={product.id} subtle />
        </div>
      </div>
    )
  }

  return (
    <div id="product-purchase-box" className="purchase-box">
      <div className="purchase-price-header">
        {acceptedOffer ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                {t('offers.productBanner.acceptedLabel')}
              </span>
              <OfferCountdown
                targetIso={acceptedOffer.acceptedExpiresAt}
                prefix={t('offers.countdown.remaining')}
                onExpire={() => void activeOfferQuery.refetch()}
              />
            </div>
            <div className="offer-price-pair">
              <ProductPrice
                value={acceptedOffer.price}
                className="purchase-box-price text-success"
              />
              <ProductPrice value={product.price} className="offer-price-original text-sm" />
            </div>
          </div>
        ) : (
          <ProductPrice value={product.price} className="purchase-box-price" />
        )}
      </div>

      {/* Tier 1: Primary purchase actions */}
      {acceptedOffer ? (
        <Button
          type="button"
          className="purchase-tier1-primary w-full"
          disabled={buyingOffer}
          onClick={() => void handleCheckoutAtOfferPrice()}
        >
          <Zap aria-hidden="true" className="size-4" />
          <span>
            {t('offers.actions.orderNowAtOffer')} · <ProductPrice value={acceptedOffer.price} />
          </span>
        </Button>
      ) : (
        <div className="purchase-tier1-row">
          <BuyNowButton
            key={`buy-${product.id}`}
            product={product}
            className="purchase-tier1-primary"
          />
          <AddToCartButton
            key={product.id}
            product={product}
            variant="outline"
            className="purchase-tier1-secondary"
          />
        </div>
      )}

      {/* Tier 2: Negotiation */}
      {!acceptedOffer && product.allowOffer !== false && (
        <MakeOfferButton
          key={`offer-${product.id}`}
          product={product}
          className="purchase-tier2-offer"
        />
      )}

      {/* Tier 3: Secondary actions */}
      <div className="purchase-tier3-bar">
        <WishlistButton key={`wishlist-${product.id}`} productId={product.id} subtle />
        <CompareToggleButton
          subtle
          product={{
            id: product.id,
            title: product.title,
            price: product.price,
            imageUrl,
            condition: product.condition,
            status: product.status,
            storeId: product.storeId,
            attributes: product.attributes,
          }}
        />
        {product.storeId && (
          <StoreChatButton
            key={`chat-${product.id}`}
            storeId={product.storeId}
            subtle
            product={{
              id: product.id,
              title: product.title,
              price: product.price,
              imageUrl,
            }}
          />
        )}
      </div>

      {/* Escrow protection */}
      <div className="purchase-escrow-box">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-foreground">{t('products.detail.protectionTitle')}</p>
          <p>{t('products.detail.protectionShort')}</p>
          <details className="purchase-escrow-details">
            <summary>{t('products.detail.learnMore')}</summary>
            <ul>
              <li>{t('homeTrust.items.hold.desc')}</li>
              <li>{t('homeTrust.items.inspect.desc')}</li>
              <li>{t('homeTrust.items.dispute.desc')}</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}
