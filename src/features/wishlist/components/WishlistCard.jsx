import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'

/**
 * Renders one saved product row in the user's wishlist.
 * @param {{
 *   item: { id: string, productId: string, createdAt: string },
 *   product?: { id: string, title: string, price: number, images?: string[], status?: string },
 *   isLoadingProduct?: boolean,
 *   isRemoving?: boolean,
 *   onRemove: (productId: string) => void
 * }} props
 */
export function WishlistCard({ item, product, isLoadingProduct, isRemoving, onRemove }) {
  const { t, i18n } = useTranslation()
  const savedDate = item.createdAt
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(
        new Date(item.createdAt),
      )
    : null

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
      <div className="w-24 shrink-0 overflow-hidden rounded-lg">
        <ImageWithFallback
          src={getProductMediaUrls(product)[0]}
          alt={product?.title || t('wishlist.unavailableProduct')}
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        {isLoadingProduct ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('products.loading')}
          </p>
        ) : product ? (
          <>
            <Link
              to={`/products/${encodeURIComponent(product.id)}`}
              className="block truncate font-medium underline-offset-4 hover:underline"
            >
              {product.title}
            </Link>
            <ProductPrice value={product.price} className="text-base font-semibold" />
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

      <div className="flex flex-wrap gap-2">
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
          {t('wishlist.removeAction')}
        </Button>
      </div>
    </li>
  )
}
