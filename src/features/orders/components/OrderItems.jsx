import { useTranslation } from 'react-i18next'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'

/** @param {{ items: Array<object> }} props */
export function OrderItems({ items }) {
  const { t } = useTranslation()

  return (
    <ul className="order-items" aria-label={t('orders.products')}>
      {items.map((item) => (
        <li key={item.id} className="order-item">
          <ImageWithFallback src={item.imageUrl} alt="" className="size-16 shrink-0 rounded-md" />
          <div className="grid min-w-0 gap-1">
            <p className="font-medium break-words">{item.productName}</p>
            <p className="text-sm text-muted-foreground">
              {t('orders.quantity', { count: item.quantity })}
            </p>
            <p className="text-sm">
              {t('orders.unitPrice')} <ProductPrice value={item.unitPrice} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
