import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { useAddCartItem } from '@/features/cart/hooks/useCart'

export function AddToCartButton({ product }) {
  const { t } = useTranslation()
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data
  const mutation = useAddCartItem()

  const isOwnProduct =
    profile &&
    (product.sellerId === profile.id || (product.storeId && product.storeId === profile.storeId))

  if (product.status !== 'ACTIVE' || isOwnProduct) return null

  if (!hasAccessToken) {
    return (
      <Button asChild>
        <Link to="/login" state={{ from: `/products/${encodeURIComponent(product.id)}` }}>
          {t('cart.add')}
        </Link>
      </Button>
    )
  }

  if (!profile) return null

  return (
    <div className="grid justify-items-start gap-2">
      <Button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ productId: product.id })}
      >
        {t(mutation.isPending ? 'cart.adding' : 'cart.add')}
      </Button>

      {mutation.isSuccess && (
        <p role="status">
          {t('cart.added')}{' '}
          <Link to="/cart" className="underline underline-offset-4">
            {t('cart.title')}
          </Link>
        </p>
      )}

      {mutation.error && (
        <p role="alert" className="text-sm text-destructive">
          {t(mutation.error.code === 'CART_OWN_PRODUCT' ? 'cart.ownProduct' : 'cart.addError')}
        </p>
      )}
    </div>
  )
}
