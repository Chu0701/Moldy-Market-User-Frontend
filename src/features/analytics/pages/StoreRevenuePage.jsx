import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSellerAnalytics } from '@/features/analytics/hooks/useAnalytics'

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function StoreRevenuePage() {
  const { t, i18n } = useTranslation()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [activePreset, setActivePreset] = useState('all')
  const { profileQuery, overviewQuery, revenueQuery, topProductsQuery } = useSellerAnalytics({
    from,
    to,
    limit: 5,
  })

  function applyRangePreset(preset) {
    setActivePreset(preset)
    if (preset === 'all') {
      setFrom('')
      setTo('')
      return
    }
    const end = new Date()
    const start = new Date(end)
    if (preset === '7d') {
      start.setDate(end.getDate() - 6)
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 29)
    } else if (preset === 'month') {
      start.setDate(1)
    }
    setFrom(formatDateInput(start))
    setTo(formatDateInput(end))
  }

  if (profileQuery.isPending || overviewQuery.isPending) {
    return (
      <section className="mx-auto max-w-5xl space-y-6" role="status" aria-busy="true">
        <span className="sr-only">{t('analytics.seller.loading')}</span>
        <div className="space-y-2">
          <div className="skeleton-shimmer h-4 w-28 rounded-md" />
          <div className="skeleton-shimmer h-8 w-56 rounded-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton-shimmer h-24 rounded-xl" />
          ))}
        </div>
        <div className="skeleton-shimmer h-56 rounded-xl" />
      </section>
    )
  }

  if (overviewQuery.error?.status === 403) {
    return <ForbiddenState />
  }

  if (profileQuery.isError || overviewQuery.isError) {
    return (
      <ErrorState
        title={t('analytics.seller.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void overviewQuery.refetch()}
        isRetrying={overviewQuery.isFetching}
      />
    )
  }

  const overview = overviewQuery.data ?? {
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    soldProducts: 0,
  }
  const revenuePoints = revenueQuery.data ?? []
  const maxRevenue = revenuePoints.reduce(
    (max, item) => Math.max(max, Number(item.revenue || 0)),
    0,
  )
  const topProducts = topProductsQuery.data ?? []
  const countFormat = new Intl.NumberFormat(i18n.resolvedLanguage)

  return (
    <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="store-revenue-heading">
      <div className="space-y-1">
        <Link
          to="/store"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('stores.myStoreTitle')}
        </Link>
        <h1
          id="store-revenue-heading"
          className="scroll-mt-24 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t('analytics.seller.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('analytics.seller.description')}</p>
      </div>

      <div className="kn-stats-band sm:grid-cols-2 lg:grid-cols-4">
        <div className="kn-stat-cell">
          <p className="text-xs font-medium text-muted-foreground">
            {t('analytics.seller.totalRevenue')}
          </p>
          <ProductPrice
            value={overview.totalRevenue ?? 0}
            className="block text-2xl font-semibold tracking-tight tabular-nums"
          />
        </div>
        <div className="kn-stat-cell">
          <p className="text-xs font-medium text-muted-foreground">
            {t('analytics.seller.totalOrders')}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {countFormat.format(overview.totalOrders ?? 0)}
          </p>
        </div>
        <div className="kn-stat-cell">
          <p className="text-xs font-medium text-muted-foreground">
            {t('analytics.seller.activeProducts')}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {countFormat.format(overview.activeProducts ?? 0)}
          </p>
        </div>
        <div className="kn-stat-cell">
          <p className="text-xs font-medium text-muted-foreground">
            {t('analytics.seller.soldProducts')}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {countFormat.format(overview.soldProducts ?? 0)}
          </p>
        </div>
      </div>

      <section className="kn-table-card" aria-labelledby="revenue-chart-heading">
        <div className="kn-table-toolbar">
          <div className="space-y-2">
            <h2 id="revenue-chart-heading" className="text-base font-semibold tracking-tight">
              {t('analytics.seller.revenueChartTitle')}
            </h2>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={t('analytics.seller.presetsLabel')}
            >
              {[
                ['7d', 'analytics.seller.presets.last7Days'],
                ['30d', 'analytics.seller.presets.last30Days'],
                ['month', 'analytics.seller.presets.thisMonth'],
                ['all', 'analytics.seller.presets.allTime'],
              ].map(([key, labelKey]) => {
                const isSelected = activePreset === key
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => applyRangePreset(key)}
                    className={
                      isSelected
                        ? 'rounded-full border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors'
                        : 'rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground'
                    }
                  >
                    {t(labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="grid gap-1">
              <label
                htmlFor="analytics-from"
                className="text-[11px] font-medium text-muted-foreground"
              >
                {t('analytics.seller.fromDate')}
              </label>
              <input
                id="analytics-from"
                type="date"
                value={from}
                onChange={(e) => {
                  setActivePreset('custom')
                  setFrom(e.target.value)
                }}
                className="kn-input min-h-8.5 py-1 text-xs"
              />
            </div>
            <div className="grid gap-1">
              <label
                htmlFor="analytics-to"
                className="text-[11px] font-medium text-muted-foreground"
              >
                {t('analytics.seller.toDate')}
              </label>
              <input
                id="analytics-to"
                type="date"
                value={to}
                onChange={(e) => {
                  setActivePreset('custom')
                  setTo(e.target.value)
                }}
                className="kn-input min-h-8.5 py-1 text-xs"
              />
            </div>
            {(from || to) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyRangePreset('all')}
              >
                {t('analytics.seller.clearDates')}
              </Button>
            )}
          </div>
        </div>

        <div className="p-5">
          {revenueQuery.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t('analytics.seller.loading')}
            </p>
          ) : revenueQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t('analytics.seller.loadError')}
            </p>
          ) : revenuePoints.length === 0 ? (
            <EmptyState
              title={t('analytics.seller.noRevenueTitle')}
              description={t('analytics.seller.noRevenueDescription')}
            />
          ) : (
            <ul className="space-y-3.5" aria-label={t('analytics.seller.revenueChartTitle')}>
              {revenuePoints.map((point) => {
                const ratio =
                  maxRevenue > 0 ? Math.max(4, Math.round((point.revenue / maxRevenue) * 100)) : 4
                return (
                  <li key={point.date} className="space-y-1.5 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {point.date}
                      </span>
                      <span className="tabular-nums">
                        <ProductPrice value={point.revenue} className="font-semibold" /> ·{' '}
                        <span className="text-xs text-muted-foreground">
                          {t('analytics.seller.orderCount', { count: point.orderCount })}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="kn-table-card" aria-labelledby="top-products-heading">
        <div className="kn-table-toolbar">
          <div className="flex items-baseline gap-2.5">
            <h2 id="top-products-heading" className="text-base font-semibold tracking-tight">
              {t('analytics.seller.topProductsTitle')}
            </h2>
            {topProducts.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {t('table.rowsCount', { count: topProducts.length })}
              </span>
            )}
          </div>
        </div>

        {topProductsQuery.isPending ? (
          <p role="status" className="p-5 text-sm text-muted-foreground">
            {t('analytics.seller.loading')}
          </p>
        ) : topProductsQuery.isError ? (
          <p role="alert" className="p-5 text-sm text-destructive">
            {t('analytics.seller.loadError')}
          </p>
        ) : topProducts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={t('analytics.seller.noTopProductsTitle')}
              description={t('analytics.seller.noTopProductsDescription')}
            />
          </div>
        ) : (
          <div className="kn-table-scroll">
            <table className="kn-table">
              <thead>
                <tr>
                  <th scope="col">{t('table.product')}</th>
                  <th scope="col" className="text-right">
                    {t('table.sold')}
                  </th>
                  <th scope="col" className="text-right">
                    {t('table.revenue')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <Link
                        to={`/products/${encodeURIComponent(product.productId)}`}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {product.productName}
                      </Link>
                    </td>
                    <td className="text-right text-muted-foreground tabular-nums">
                      {t('analytics.seller.soldUnits', { count: product.totalSold })}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      <ProductPrice value={product.totalRevenue} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
