import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { Button } from '@/components/ui/button'
import { useWishlistToggle } from '@/features/wishlist/hooks/useWishlist'

/**
 * Toggle button to save/remove a product from the authenticated user's wishlist.
 * @param {{ productId: string }} props
 */
export function WishlistButton({ productId }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, isSaved, count, isPending, error, toggle } = useWishlistToggle(productId)

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline">
        <Link to="/login" state={{ from: location.pathname + location.search }}>
          <Heart className="size-4" aria-hidden="true" />
          <span>{t('wishlist.saveAction')}</span>
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={isSaved ? 'default' : 'outline'}
        aria-pressed={isSaved}
        disabled={isPending}
        onClick={toggle}
      >
        <Heart className="size-4" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
        <span>{t(isSaved ? 'wishlist.savedAction' : 'wishlist.saveAction')}</span>
        {count > 0 && <span className="text-xs opacity-80">({count})</span>}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {t('wishlist.toggleError')}
        </p>
      )}
    </div>
  )
}
