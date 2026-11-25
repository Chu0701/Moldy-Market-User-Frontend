import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, History, RotateCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ProductCard } from '@/features/products/components/ProductCard'
import {
  clearRecentlyViewed,
  readRecentlyViewed,
  restoreRecentlyViewed,
  subscribeRecentlyViewed,
} from '@/features/products/recentlyViewedStorage'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

/** @param {{ excludeProductId?: string }} props */
export function RecentlyViewedSection({ excludeProductId }) {
  const { t } = useTranslation()
  const [items, setItems] = useState(() => readRecentlyViewed())
  const [undoSnapshot, setUndoSnapshot] = useState(null)
  const scrollerRef = useRef(null)
  const undoTimerRef = useRef(null)

  useEffect(() => {
    return subscribeRecentlyViewed(() => {
      setItems(readRecentlyViewed())
    })
  }, [])

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    }
  }, [])

  const visibleItems = excludeProductId
    ? items.filter((item) => item.id !== excludeProductId)
    : items

  if (visibleItems.length === 0 && !undoSnapshot) return null

  function handleClear() {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    setUndoSnapshot(items)
    clearRecentlyViewed()
    undoTimerRef.current = window.setTimeout(() => {
      setUndoSnapshot(null)
    }, 6000)
  }

  function handleUndo() {
    if (!undoSnapshot) return
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current)
    restoreRecentlyViewed(undoSnapshot)
    setUndoSnapshot(null)
  }

  function scrollByDirection(direction) {
    const node = scrollerRef.current
    if (!node) return
    node.scrollBy({ left: direction * 440, behavior: 'smooth' })
  }

  return (
    <section
      aria-labelledby="recently-viewed-heading"
      className="space-y-4 border-t border-border py-8 sm:py-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History aria-hidden="true" className="size-5 text-muted-foreground" />
          <h2
            id="recently-viewed-heading"
            className="text-xl font-semibold tracking-tight sm:text-2xl"
          >
            {t('products.recentlyViewed.title')}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {visibleItems.length > 2 && (
            <div className="hidden items-center gap-1 sm:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 rounded-full"
                aria-label={t('products.recentlyViewed.scrollPrev')}
                onClick={() => scrollByDirection(-1)}
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 rounded-full"
                aria-label={t('products.recentlyViewed.scrollNext')}
                onClick={() => scrollByDirection(1)}
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          )}

          {visibleItems.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              <span>{t('products.recentlyViewed.clear')}</span>
            </button>
          )}
        </div>
      </div>

      {visibleItems.length === 0 && undoSnapshot ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm"
        >
          <span className="text-muted-foreground">
            {t('products.recentlyViewed.clearedNotice')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={handleUndo}
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
            <span>{t('products.recentlyViewed.undo')}</span>
          </Button>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
        >
          {visibleItems.slice(0, 8).map((product) => (
            <div key={product.id} className="w-[172px] shrink-0 snap-start sm:w-[196px]">
              <ProductCard
                id={product.id}
                title={product.title}
                price={product.price}
                imageUrl={product.imageUrl}
                condition={product.condition}
                conditionLabel={t(conditionKeys[product.condition] ?? 'products.conditions.used')}
                createdAt={product.createdAt}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
