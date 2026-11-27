import { useEffect, useState } from 'react'
import { Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import {
  MAX_COMPARE_ITEMS,
  readCompareProducts,
  subscribeCompareProducts,
  toggleCompareProduct,
} from '@/features/products/compareStorage'
import { cn } from '@/lib/utils'

/**
 * Toggle button adding/removing a product from the quick comparison tray (max 3 items).
 *
 * @param {{
 *   product: {
 *     id: string,
 *     title: string,
 *     price: number,
 *     imageUrl?: string,
 *     condition?: string,
 *     status?: string,
 *     storeId?: string | null,
 *     attributes?: Record<string, unknown> | null,
 *   },
 *   compact?: boolean,
 *   className?: string,
 * }} props
 */
export function CompareToggleButton({ product, compact = false, subtle = false, className }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const [selected, setSelected] = useState(() =>
    readCompareProducts().some((item) => item.id === product?.id),
  )

  useEffect(() => {
    const sync = () => {
      setSelected(readCompareProducts().some((item) => item.id === product?.id))
    }
    sync()
    return subscribeCompareProducts(sync)
  }, [product?.id])

  function handleToggle(event) {
    event?.stopPropagation?.()
    const result = toggleCompareProduct(product)
    if (result.status === 'full') {
      pushToast(t('products.compare.limitReached', { max: MAX_COMPARE_ITEMS }), 'info')
      return
    }
    if (result.status === 'added') {
      pushToast(t('products.compare.addedToast'), 'success')
      return
    }
    pushToast(t('products.compare.removedToast'), 'info')
  }

  const label = t(selected ? 'products.compare.added' : 'products.compare.add')

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={selected}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground/80 shadow-xs backdrop-blur-[2px] transition-colors outline-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
          selected &&
            'border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background',
          className,
        )}
      >
        <Scale aria-hidden="true" className="size-3.5" />
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant={selected ? 'secondary' : subtle ? 'ghost' : 'outline'}
      size="sm"
      aria-pressed={selected}
      onClick={handleToggle}
      className={cn(subtle ? 'purchase-tier3-btn' : 'min-h-10 shrink-0 gap-1.5', className)}
    >
      <Scale aria-hidden="true" className="size-4" />
      <span>{label}</span>
    </Button>
  )
}
