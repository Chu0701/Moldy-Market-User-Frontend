import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSellerAnalytics } from '@/features/analytics/hooks/useAnalytics'

export function StoreRevenuePage() {
  const { t, i18n } = useTranslation()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { profileQuery, overviewQuery, revenueQuery, topProductsQuery } = useSellerAnalytics({
    from,
    to,
    limit: 5,
  })

  if (profileQuery.isPending || overviewQuery.isPending) {
    return <p role="status">{t('analytics.seller.loading')}</p>
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
    <section className="mx-auto max-w-5xl space-y-8" aria-labelledby="store-revenue-heading">
      <div className="space-y-1">
        <Link to="/store" className="text-sm underline underline-offset-4">
          {t('stores.myStoreTitle')}
        </Link>
        <h1 id="store-revenue-heading" className="text-3xl font-semibold sm:text-4xl">
          {t('analytics.seller.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('analytics.seller.description')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">{t('analytics.seller.totalRevenue')}</p>
          <ProductPrice
            value={overview.totalRevenue ?? 0}
            className="mt-1 block text-2xl font-semibold"
          />
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">{t('analytics.seller.totalOrders')}</p>
          <p className="mt-1 text-2xl font-semibold">
            {countFormat.format(overview.totalOrders ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">{t('analytics.seller.activeProducts')}</p>
          <p className="mt-1 text-2xl font-semibold">
            {countFormat.format(overview.activeProducts ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">{t('analytics.seller.soldProducts')}</p>
          <p className="mt-1 text-2xl font-semibold">
            {countFormat.format(overview.soldProducts ?? 0)}
          </p>
        </div>
      </div>

      <section
        className="space-y-4 rounded-xl border border-border bg-background p-5"
        aria-labelledby="revenue-chart-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="revenue-chart-heading" className="text-xl font-semibold">
            {t('analytics.seller.revenueChartTitle')}
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="analytics-from" className="block text-xs text-muted-foreground">
                {t('analytics.seller.fromDate')}
              </label>
              <input
                id="analytics-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="analytics-to" className="block text-xs text-muted-foreground">
                {t('analytics.seller.toDate')}
              </label>
              <input
                id="analytics-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              />
            </div>
            {(from || to) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
              >
                {t('analytics.seller.clearDates')}
              </Button>
            )}
          </div>
        </div>

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
          <ul className="space-y-3" aria-label={t('analytics.seller.revenueChartTitle')}>
            {revenuePoints.map((point) => {
              const ratio =
                maxRevenue > 0 ? Math.max(4, Math.round((point.revenue / maxRevenue) * 100)) : 4
              return (
                <li key={point.date} className="space-y-1 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{point.date}</span>
                    <span>
                      <ProductPrice value={point.revenue} className="font-medium" /> ·{' '}
                      <span className="text-xs text-muted-foreground">
                        {t('analytics.seller.orderCount', { count: point.orderCount })}
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section
        className="space-y-4 rounded-xl border border-border bg-background p-5"
        aria-labelledby="top-products-heading"
      >
        <h2 id="top-products-heading" className="text-xl font-semibold">
          {t('analytics.seller.topProductsTitle')}
        </h2>

        {topProductsQuery.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('analytics.seller.loading')}
          </p>
        ) : topProductsQuery.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {t('analytics.seller.loadError')}
          </p>
        ) : topProducts.length === 0 ? (
          <EmptyState
            title={t('analytics.seller.noTopProductsTitle')}
            description={t('analytics.seller.noTopProductsDescription')}
          />
        ) : (
          <ul className="divide-y divide-border">
            {topProducts.map((product) => (
              <li
                key={product.productId}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <Link
                    to={`/products/${encodeURIComponent(product.productId)}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {product.productName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {t('analytics.seller.soldUnits', { count: product.totalSold })}
                  </p>
                </div>
                <ProductPrice value={product.totalRevenue} className="font-semibold" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
