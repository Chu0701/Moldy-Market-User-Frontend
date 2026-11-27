import { useState } from 'react'
import { BadgeDollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { MakeOfferModal } from '@/features/offers/components/MakeOfferModal'

/** @param {{ product: object, className?: string }} props */
export function MakeOfferButton({ product, className }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { hasAccessToken, profileQuery } = useSession()
  const profile = profileQuery.data

  const isOwnProduct =
    profile &&
    (product.sellerId === profile.id || (product.storeId && product.storeId === profile.storeId))

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
