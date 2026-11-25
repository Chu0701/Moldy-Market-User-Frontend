import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { useAddCartItem } from '@/features/cart/hooks/useCart'

/**
 * Direct purchase CTA: adds the listing to the active cart (idempotent on backend)
 * and navigates straight to `/checkout?productId=<id>`.
 *
 * @param {{ product: object, className?: string }} props
 */
export function BuyNowButton({ product, className }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data
  const mutation = useAddCartItem()

  const isOwnProduct =
    profile &&
    (product.sellerId === profile.id || (product.storeId && product.storeId === profile.storeId))

  if (product.status !== 'ACTIVE' || isOwnProduct) return null

  if (!hasAccessToken) {
    return (
      <Button asChild className={className}>
        <Link to="/login" state={{ from: `/products/${encodeURIComponent(product.id)}` }}>
          <Zap aria-hidden="true" className="size-4" />
          <span>{t('actions.buyNow')}</span>
        </Link>
      </Button>
    )
  }

  if (!profile) return null

  return (
    <Button
      type="button"
      className={className}
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          { productId: product.id },
          {
            onSuccess: () => {
              void navigate(`/checkout?productId=${encodeURIComponent(product.id)}`)
            },
            onError: (err) =>
              pushToast(
                t(err?.code === 'CART_OWN_PRODUCT' ? 'cart.ownProduct' : 'cart.addError'),
                'error',
              ),
          },
        )
      }
    >
      <Zap aria-hidden="true" className="size-4" />
      <span>{t(mutation.isPending ? 'cart.buyingNow' : 'actions.buyNow')}</span>
    </Button>
  )
}
