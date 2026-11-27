import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { useAddCartItem } from '@/features/cart/hooks/useCart'

export function AddToCartButton({ product, variant = 'default', className }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data
  const mutation = useAddCartItem()

  const isOwnProduct =
    profile &&
    (product.sellerId === profile.id || (product.storeId && product.storeId === profile.storeId))

  if (product.status !== 'ACTIVE' || isOwnProduct) return null

  if (!hasAccessToken) {
    return (
      <Button asChild variant={variant} className={className}>
        <Link to="/login" state={{ from: `/products/${encodeURIComponent(product.id)}` }}>
          {t('cart.add')}
        </Link>
      </Button>
    )
  }

  if (!profile) return null

  return (
    <div className="grid gap-1.5">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate(
            { productId: product.id },
            {
              onSuccess: () => pushToast(t('cart.added'), 'success'),
              onError: (err) =>
                pushToast(
                  t(err?.code === 'CART_OWN_PRODUCT' ? 'cart.ownProduct' : 'cart.addError'),
                  'error',
                ),
            },
          )
        }
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
