import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Scale, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import {
  clearCompareProducts,
  MAX_COMPARE_ITEMS,
  readCompareProducts,
  removeCompareProduct,
  subscribeCompareProducts,
} from '@/features/products/compareStorage'
import { cn } from '@/lib/utils'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

function formatAttributeValue(value, t) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return t(value ? 'common.yes' : 'common.no')
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Sticky bottom quick-comparison tray (hidden when 0 products selected)
 * plus a side-by-side comparison modal for up to 3 listings.
 */
export function CompareBar() {
  const { t } = useTranslation()
  const [items, setItems] = useState(() => readCompareProducts())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const sync = () => {
      const next = readCompareProducts()
      setItems(next)
      if (next.length === 0) setOpen(false)
    }
    return subscribeCompareProducts(sync)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const lowestPrice = useMemo(() => {
    const prices = items.map((item) => Number(item.price)).filter((n) => Number.isFinite(n))
    return prices.length > 1 ? Math.min(...prices) : null
  }, [items])

  const attributeKeys = useMemo(() => {
    const keys = new Set()
    for (const item of items) {
      if (item.attributes && typeof item.attributes === 'object') {
        Object.keys(item.attributes).forEach((key) => keys.add(key))
      }
    }
    return [...keys]
  }, [items])

  if (items.length === 0) return null

  return (
    <>
      <aside
        aria-label={t('products.compare.trayLabel')}
        className="fixed right-4 bottom-4 left-4 z-40 mx-auto max-w-4xl rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm sm:right-6 sm:left-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background tabular-nums">
              <Scale aria-hidden="true" className="size-3.5" />
              <span>
                {t('products.compare.count', { count: items.length, max: MAX_COMPARE_ITEMS })}
              </span>
            </span>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex max-w-[190px] items-center gap-2 rounded-lg border border-border bg-surface-subtle py-1 pr-1.5 pl-1.5"
                >
                  <div className="size-7 shrink-0 overflow-hidden rounded bg-muted">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.title}
                      compact
                      className="size-full"
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCompareProduct(item.id)}
                    aria-label={t('products.compare.removeItem', { title: item.title })}
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X aria-hidden="true" className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8.5 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => clearCompareProducts()}
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              <span>{t('products.compare.clearAll')}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8.5"
              disabled={items.length < 2}
              onClick={() => setOpen(true)}
            >
              {t('products.compare.compareNow')}
            </Button>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-[1px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-modal-title"
            className="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Scale aria-hidden="true" className="size-4 text-foreground" />
                <h2 id="compare-modal-title" className="font-sans text-base font-semibold">
                  {t('products.compare.modalTitle')}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label={t('actions.close')}
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>

            <div className="overflow-auto p-5">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border align-top">
                    <th className="w-36 py-3 pr-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      {t('products.compare.criteria')}
                    </th>
                    {items.map((item) => (
                      <th key={item.id} className="min-w-[180px] px-3 py-3 text-left font-normal">
                        <div className="space-y-2.5">
                          <div className="relative aspect-square w-full max-w-[160px] overflow-hidden rounded-xl border border-border bg-muted">
                            <ImageWithFallback
                              src={item.imageUrl}
                              alt={item.title}
                              className="size-full"
                            />
                            <button
                              type="button"
                              onClick={() => removeCompareProduct(item.id)}
                              aria-label={t('products.compare.removeItem', { title: item.title })}
                              className="absolute top-1.5 right-1.5 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-xs hover:text-foreground"
                            >
                              <X aria-hidden="true" className="size-3.5" />
                            </button>
                          </div>
                          <Link
                            to={`/products/${encodeURIComponent(item.id)}`}
                            onClick={() => setOpen(false)}
                            className="line-clamp-2 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                          >
                            {item.title}
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {t('products.compare.price')}
                    </th>
                    {items.map((item) => {
                      const isBest = lowestPrice !== null && Number(item.price) === lowestPrice
                      return (
                        <td key={item.id} className="px-3 py-3 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <ProductPrice
                              value={item.price}
                              className={cn(
                                'text-base font-bold tabular-nums',
                                isBest ? 'text-emerald-700' : 'text-foreground',
                              )}
                            />
                            {isBest && (
                              <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {t('products.compare.bestPrice')}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>

                  <tr>
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {t('products.compare.condition')}
                    </th>
                    {items.map((item) => (
                      <td key={item.id} className="px-3 py-3 text-sm text-foreground">
                        {t(conditionKeys[item.condition] ?? 'products.conditions.unknown')}
                      </td>
                    ))}
                  </tr>

                  {attributeKeys.map((attrKey) => (
                    <tr key={attrKey}>
                      <th
                        scope="row"
                        className="py-3 pr-3 text-left text-xs font-medium text-muted-foreground capitalize"
                      >
                        {attrKey}
                      </th>
                      {items.map((item) => (
                        <td key={item.id} className="px-3 py-3 text-sm text-foreground/90">
                          {formatAttributeValue(item.attributes?.[attrKey], t)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr>
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {t('table.actions')}
                    </th>
                    {items.map((item) => (
                      <td key={item.id} className="px-3 py-3">
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                          <Link
                            to={`/products/${encodeURIComponent(item.id)}`}
                            onClick={() => setOpen(false)}
                          >
                            <span>{t('products.compare.viewProduct')}</span>
                            <ExternalLink aria-hidden="true" className="size-3.5" />
                          </Link>
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
