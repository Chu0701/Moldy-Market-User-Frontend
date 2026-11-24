import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { useProductPriceHistory } from '@/features/analytics/hooks/useAnalytics'

/**
 * Displays historical price changes on ProductDetailPage when authenticated.
 * @param {{ productId: string }} props
 */
export function ProductPriceHistoryPanel({ productId }) {
  const { t, i18n } = useTranslation()
  const query = useProductPriceHistory(productId)

  const history = query.data?.history ?? []
  if (!query.isSuccess || history.length === 0) {
    return null
  }

  return (
    <section
      className="space-y-3 rounded-lg border border-border bg-surface-subtle p-4"
      aria-labelledby="price-history-heading"
    >
      <h2 id="price-history-heading" className="text-lg font-semibold">
        {t('analytics.priceHistory.title')}
      </h2>
      <ul className="space-y-2 text-sm">
        {history.map((entry, idx) => (
          <li
            key={`${entry.changedAt}-${idx}`}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-b-0 last:pb-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <ProductPrice value={entry.oldPrice} className="text-muted-foreground line-through" />
              <span aria-hidden="true">-&gt;</span>
              <ProductPrice value={entry.newPrice} className="font-medium" />
            </div>
            {entry.changedAt && (
              <span className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(entry.changedAt))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
