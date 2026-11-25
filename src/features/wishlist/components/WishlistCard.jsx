import { ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'

/**
 * Renders one saved product card in the user's wishlist grid.
 * @param {{
 *   item: { id: string, productId: string, createdAt: string },
 *   product?: { id: string, title: string, price: number, images?: string[], status?: string },
 *   isLoadingProduct?: boolean,
 *   isRemoving?: boolean,
 *   isAddingToCart?: boolean,
 *   onAddToCart?: (productId: string) => void,
 *   onRemove: (productId: string) => void
 * }} props
 */
export function WishlistCard({
  item,
  product,
  isLoadingProduct,
  isRemoving,
  isAddingToCart = false,
  onAddToCart,
  onRemove,
}) {
  const { t, i18n } = useTranslation()
  const savedDate = item.createdAt
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(
        new Date(item.createdAt),
      )
    : null
  const canAddToCart = Boolean(product && product.status === 'ACTIVE' && onAddToCart)

  return (
    <li className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30">
      <div className="flex items-start gap-3.5">
        <div className="size-22 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
          <ImageWithFallback
            src={getProductMediaUrls(product)[0]}
            alt={product?.title || t('wishlist.unavailableProduct')}
            className="size-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {isLoadingProduct ? (
            <div role="status" className="space-y-2">
              <span className="sr-only">{t('products.loading')}</span>
              <div className="skeleton-shimmer h-4 w-3/4 rounded" />
              <div className="skeleton-shimmer h-5 w-1/3 rounded" />
            </div>
          ) : product ? (
            <>
              <Link
                to={`/products/${encodeURIComponent(product.id)}`}
                className="line-clamp-2 block text-sm leading-5 font-medium break-words underline-offset-4 hover:underline"
              >
                {product.title}
              </Link>
              <ProductPrice
                value={product.price}
                className="block text-base font-semibold tabular-nums"
              />
              {product.status && product.status !== 'ACTIVE' && (
                <p className="text-xs text-muted-foreground">{t('wishlist.productNotActive')}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('wishlist.unavailableProduct')}</p>
          )}

          {savedDate && (
            <p className="text-xs text-muted-foreground">
              {t('wishlist.savedAt', { date: savedDate })}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-3">
        {canAddToCart && (
          <Button
            type="button"
            size="sm"
            disabled={isAddingToCart}
            onClick={() => onAddToCart(product.id)}
          >
            <ShoppingCart aria-hidden="true" className="size-3.5" />
            <span>{t(isAddingToCart ? 'cart.adding' : 'cart.add')}</span>
          </Button>
        )}
        {product && (
          <Button asChild variant="outline" size="sm">
            <Link to={`/products/${encodeURIComponent(product.id)}`}>
              {t('wishlist.viewProduct')}
            </Link>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRemoving}
          onClick={() => onRemove(item.productId)}
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          <span>{t('wishlist.removeAction')}</span>
        </Button>
      </div>
    </li>
  )
}
