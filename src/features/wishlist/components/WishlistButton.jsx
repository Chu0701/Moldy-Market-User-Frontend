import { Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useWishlistToggle } from '@/features/wishlist/hooks/useWishlist'

/**
 * Toggle button to save/remove a product from the authenticated user's wishlist.
 * @param {{ productId: string, subtle?: boolean }} props
 */
export function WishlistButton({ productId, subtle = false }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const location = useLocation()
  const { isAuthenticated, isSaved, count, isPending, error, toggle } = useWishlistToggle(productId)

  function handleToggle() {
    const nextSaved = !isSaved
    toggle()
    pushToast(t(nextSaved ? 'wishlist.savedToast' : 'wishlist.removedToast'), 'info')
  }

  const buttonSize = subtle ? 'sm' : 'default'
  const buttonClass = subtle ? 'purchase-tier3-btn' : undefined

  if (!isAuthenticated) {
    return (
      <Button
        asChild
        variant={subtle ? 'ghost' : 'outline'}
        size={buttonSize}
        className={buttonClass}
      >
        <Link to="/login" state={{ from: location.pathname + location.search }}>
          <Heart className="size-4" aria-hidden="true" />
          <span>{t('wishlist.saveAction')}</span>
        </Link>
      </Button>
    )
  }

  const savedVariant = subtle ? 'secondary' : 'default'
  const unsavedVariant = subtle ? 'ghost' : 'outline'

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={isSaved ? savedVariant : unsavedVariant}
        size={buttonSize}
        className={buttonClass}
        aria-pressed={isSaved}
        disabled={isPending}
        onClick={handleToggle}
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
