import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

const DISTRIBUTION_LEVELS = [5, 4, 3, 2, 1]

/**
 * Interactive 5★ → 1★ distribution bar chart + filter chips (`Tất cả`, `5★`..`1★`, `Có bình luận`).
 * Clicking either a distribution bar or a filter chip filters the review list client-side.
 *
 * @param {{
 *   averageRating: number,
 *   reviewCount: number,
 *   reviews: Array<{ rating: number, comment?: string | null }>,
 *   activeFilter: 'all' | 'withComment' | number,
 *   onFilterChange: (next: 'all' | 'withComment' | number) => void,
 *   showSummaryScore?: boolean,
 * }} props
 */
export function ReviewDistributionFilter({
  averageRating = 0,
  reviewCount = 0,
  reviews = [],
  activeFilter,
  onFilterChange,
  showSummaryScore = false,
}) {
  const { t } = useTranslation()
  const totalBase = reviewCount > 0 ? reviewCount : reviews.length
  const withCommentCount = reviews.filter((item) => Boolean(item.comment?.trim())).length

  const countsByStar = DISTRIBUTION_LEVELS.reduce((acc, level) => {
    acc[level] = reviews.filter((item) => item.rating === level).length
    return acc
  }, {})

  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div
        className={cn(
          'grid gap-4',
          showSummaryScore && 'sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-6',
        )}
      >
        {showSummaryScore && (
          <div className="flex flex-col items-start gap-1 sm:items-center sm:border-r sm:border-border sm:pr-6 sm:text-center">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {Number(averageRating).toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            <div className="flex items-center gap-0.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'size-4',
                    star <= Math.round(averageRating)
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/35',
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {t('reviews.countLabel', { count: totalBase })}
            </p>
          </div>
        )}

        <div className="grid gap-1.5">
          {DISTRIBUTION_LEVELS.map((level) => {
            const count = countsByStar[level]
            const percent = totalBase > 0 ? Math.round((count / totalBase) * 100) : 0
            const selected = activeFilter === level
            return (
              <button
                key={level}
                type="button"
                aria-pressed={selected}
                onClick={() => onFilterChange(selected ? 'all' : level)}
                className={cn(
                  'grid grid-cols-[2.75rem_minmax(0,1fr)_4.75rem] items-center gap-3 rounded-md px-1.5 py-1 text-left text-xs transition-colors outline-none hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-ring',
                  selected && 'bg-surface-subtle ring-1 ring-border',
                )}
              >
                <span className="inline-flex items-center gap-1 font-medium text-foreground tabular-nums">
                  <span>{level}</span>
                  <Star aria-hidden="true" className="size-3.5 fill-warning text-warning" />
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      'block h-full rounded-full transition-[width] duration-200',
                      selected ? 'bg-warning' : 'bg-primary',
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="text-right text-[11px] text-muted-foreground tabular-nums">
                  {percent}% ({count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        role="group"
        aria-label={t('reviews.filters.label')}
        className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3.5"
      >
        <button
          type="button"
          aria-pressed={activeFilter === 'all'}
          onClick={() => onFilterChange('all')}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
            activeFilter === 'all'
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-background text-foreground hover:border-foreground/40',
          )}
        >
          <span>{t('reviews.filters.all')}</span>
          <span className="opacity-75 tabular-nums">({reviews.length})</span>
        </button>

        {DISTRIBUTION_LEVELS.map((level) => {
          const count = countsByStar[level]
          const selected = activeFilter === level
          return (
            <button
              key={level}
              type="button"
              aria-pressed={selected}
              onClick={() => onFilterChange(selected ? 'all' : level)}
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground hover:border-foreground/40',
              )}
            >
              <span className="tabular-nums">
                {t('reviews.filters.starChip', { count: level })}
              </span>
              <span className="opacity-75 tabular-nums">({count})</span>
            </button>
          )
        })}

        <button
          type="button"
          aria-pressed={activeFilter === 'withComment'}
          onClick={() => onFilterChange(activeFilter === 'withComment' ? 'all' : 'withComment')}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
            activeFilter === 'withComment'
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-background text-foreground hover:border-foreground/40',
          )}
        >
          <span>{t('reviews.filters.withComment')}</span>
          <span className="opacity-75 tabular-nums">({withCommentCount})</span>
        </button>
      </div>
    </div>
  )
}
