import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'

/**
 * Sticky bottom bar on small screens keeping price and purchase action one tap away.
 * @param {{ price: number, targetId?: string }} props
 */
export function MobileBuyBar({ price, targetId = 'product-purchase-box' }) {
  const { t } = useTranslation()

  function scrollToPurchase() {
    const target = document.getElementById(targetId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-md md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {t('products.detail.mobilePriceLabel')}
          </p>
          <ProductPrice
            value={price}
            className="block truncate text-lg font-bold text-foreground"
          />
        </div>
        <Button type="button" onClick={scrollToPurchase} className="min-h-11 shrink-0 gap-2 px-5">
          <ShoppingBag aria-hidden="true" className="size-4" />
          <span>{t('products.detail.jumpToPurchase')}</span>
        </Button>
      </div>
    </div>
  )
}
