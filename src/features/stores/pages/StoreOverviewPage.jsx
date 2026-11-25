import { useQuery } from '@tanstack/react-query'
import {
  ArrowUpRight,
  ClipboardList,
  MapPin,
  Package,
  Plus,
  Star,
  TicketPercent,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { analyticsKeys } from '@/features/analytics/analyticsKeys'
import { useSession } from '@/features/auth/hooks/useSession'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { useStoreReviews } from '@/features/reviews/hooks/useReviews'
import { StaffStoreOverview } from '@/features/stores/components/StaffStoreOverview'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { cn } from '@/lib/utils'
import { getSellerOverview } from '@/services/analytics/analyticsService'
import { getStoreOrders } from '@/services/orders/storeOrderService'

export function StoreOverviewPage() {
  const { profileQuery } = useSession()
  const profile = profileQuery.data
  const store = getStoreContext(profile)

  if (store.kind === 'staff') {
    return <StaffStoreOverview profile={profile} />
  }

  return <OwnerStoreOverview profile={profile} />
}

function OwnerStoreOverview({ profile }) {
  const { t, i18n } = useTranslation()
  const { state } = useLocation()
  const userId = profile?.id
  const storeQuery = useMyStore(userId)
  const store = storeQuery.data
  const storeId = store?.id
  const isBlocked = store?.status === 'BLOCKED'

  const overviewQuery = useQuery({
    queryKey: analyticsKeys.sellerOverview(userId),
    queryFn: ({ signal }) => getSellerOverview({ signal }),
    enabled: Boolean(userId && storeId),
    retry: false,
    staleTime: 60_000,
  })

  const reviewsQuery = useStoreReviews(storeId)

  const pendingOrdersQuery = useQuery({
    queryKey: ['store-orders', userId, storeId, 'overview-pending'],
    queryFn: ({ signal }) =>
      getStoreOrders({
        storeId,
        page: 1,
        status: 'PENDING_CONFIRMATION',
        signal,
      }),
    enabled: Boolean(userId && storeId && !isBlocked),
    retry: false,
    staleTime: 30_000,
  })

  if (!userId || storeQuery.error?.status === 403) {
    return <ForbiddenState />
  }

  if (storeQuery.isPending) {
    return <p role="status">{t('stores.loading')}</p>
  }

  if (storeQuery.isError) {
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void storeQuery.refetch()}
        isRetrying={storeQuery.isFetching}
      />
    )
  }

  if (store === null) {
    return <Navigate to="/open-store" replace />
  }

  const numberFormat = new Intl.NumberFormat(i18n.resolvedLanguage)
  const overview = overviewQuery.data
  const reviewSummary = reviewsQuery.data
  const pendingOrders = pendingOrdersQuery.data?.items?.slice(0, 5) ?? []
  const pendingTotal =
    typeof pendingOrdersQuery.data?.totalElements === 'number'
      ? pendingOrdersQuery.data.totalElements
      : pendingOrders.length

  const quickActions = [
    ...(!isBlocked
      ? [
          {
            to: '/store/products/new',
            icon: Plus,
            title: t('products.create.pageTitle'),
            description: t('stores.dashboard.quickCreateDesc'),
          },
          {
            to: '/store/orders',
            icon: ClipboardList,
            title: t('storeOrders.title'),
            description: t('stores.dashboard.quickOrdersDesc'),
          },
          {
            to: '/store/vouchers',
            icon: TicketPercent,
            title: t('vouchers.title'),
            description: t('stores.dashboard.quickVouchersDesc'),
          },
        ]
      : []),
    {
      to: '/store/revenue',
      icon: TrendingUp,
      title: t('analytics.seller.title'),
      description: t('stores.dashboard.quickRevenueDesc'),
    },
  ]

  return (
    <section className="store-public-page space-y-6" aria-labelledby="my-store-title">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              id="my-store-title"
              className="scroll-mt-24 text-2xl font-semibold tracking-tight break-words sm:text-3xl"
            >
              {store.name}
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                isBlocked
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-success/30 bg-success/10 text-success',
              )}
            >
              <span
                className={cn('size-1.5 rounded-full', isBlocked ? 'bg-destructive' : 'bg-success')}
                aria-hidden="true"
              />
              {store.status ?? 'ACTIVE'}
            </span>
          </div>

          {store.description && (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{store.description}</p>
          )}

          {store.pickupAddress && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="break-words">{store.pickupAddress}</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!isBlocked && (
            <Button asChild size="sm">
              <Link to="/store/products/new">
                <Plus aria-hidden="true" className="size-4" />
                <span>{t('products.create.pageTitle')}</span>
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={`/stores/${encodeURIComponent(store.id)}`}>
              <span>{t('stores.viewPublic')}</span>
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {state?.storeProfileSaved === true && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm font-medium text-foreground"
        >
          {t('stores.profile.saved')}
        </p>
      )}

      <dl className="kn-stats-band sm:grid-cols-2 lg:grid-cols-4">
        <div className="kn-stat-cell">
          <dt className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <span>{t('analytics.seller.totalRevenue')}</span>
            <TrendingUp aria-hidden="true" className="size-3.5 opacity-60" />
          </dt>
          <dd className="mt-1">
            {overviewQuery.isPending ? (
              <div className="skeleton-shimmer h-7 w-28 rounded" />
            ) : overview ? (
              <ProductPrice
                value={overview.totalRevenue ?? 0}
                className="block text-xl font-semibold tracking-tight text-foreground tabular-nums"
              />
            ) : (
              <span className="text-xl font-semibold text-muted-foreground">—</span>
            )}
          </dd>
          <Link
            to="/store/revenue"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <span>{t('stores.dashboard.viewRevenue')}</span>
            <ArrowUpRight aria-hidden="true" className="size-3" />
          </Link>
        </div>

        <div className="kn-stat-cell">
          <dt className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <span>{t('analytics.seller.totalOrders')}</span>
            <ClipboardList aria-hidden="true" className="size-3.5 opacity-60" />
          </dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {overviewQuery.isPending ? (
              <div className="skeleton-shimmer h-7 w-16 rounded" />
            ) : overview ? (
              numberFormat.format(overview.totalOrders ?? 0)
            ) : (
              '—'
            )}
          </dd>
          <p className="mt-2 text-xs text-muted-foreground tabular-nums">
            {pendingTotal > 0
              ? t('stores.dashboard.pendingCount', { count: pendingTotal })
              : t('stores.dashboard.soldCount', {
                  count: overview?.soldProducts ?? 0,
                })}
          </p>
        </div>

        <div className="kn-stat-cell">
          <dt className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <span>{t('analytics.seller.activeProducts')}</span>
            <Package aria-hidden="true" className="size-3.5 opacity-60" />
          </dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {overviewQuery.isPending ? (
              <div className="skeleton-shimmer h-7 w-16 rounded" />
            ) : overview ? (
              numberFormat.format(overview.activeProducts ?? 0)
            ) : (
              '—'
            )}
          </dd>
          <Link
            to="/store/products"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <span>{t('stores.dashboard.manageProducts')}</span>
            <ArrowUpRight aria-hidden="true" className="size-3" />
          </Link>
        </div>

        <div className="kn-stat-cell">
          <dt className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <span>{t('reviews.storeDashboardTitle')}</span>
            <Star aria-hidden="true" className="size-3.5 opacity-60" />
          </dt>
          <dd className="mt-1 flex items-baseline gap-1.5 text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {reviewsQuery.isPending ? (
              <div className="skeleton-shimmer h-7 w-20 rounded" />
            ) : reviewSummary && reviewSummary.totalReviews > 0 ? (
              <>
                <span>{Number(reviewSummary.averageRating ?? 0).toFixed(1)}</span>
                <span className="text-xs font-normal text-muted-foreground">/ 5</span>
              </>
            ) : (
              <span className="text-base font-medium text-muted-foreground">
                {t('stores.dashboard.noReviewsYet')}
              </span>
            )}
          </dd>
          <Link
            to="/store/reviews"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <span>
              {reviewSummary && reviewSummary.totalReviews > 0
                ? t('stores.dashboard.reviewCount', { count: reviewSummary.totalReviews })
                : t('stores.dashboard.viewReviews')}
            </span>
            <ArrowUpRight aria-hidden="true" className="size-3" />
          </Link>
        </div>
      </dl>

      {!isBlocked && (
        <div className="kn-table-card">
          <div className="kn-table-toolbar">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {t('stores.dashboard.pendingOrdersTitle')}
              </h2>
              {pendingTotal > 0 && (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning tabular-nums">
                  {pendingTotal}
                </span>
              )}
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
              <Link to="/store/orders?status=PENDING_CONFIRMATION">
                <span>{t('stores.dashboard.manageOrders')}</span>
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </Button>
          </div>

          {pendingOrdersQuery.isPending ? (
            <div className="space-y-3 p-4" aria-hidden="true">
              <div className="skeleton-shimmer h-12 w-full rounded-lg" />
              <div className="skeleton-shimmer h-12 w-full rounded-lg" />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">
              {t('stores.dashboard.pendingOrdersEmpty')}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {pendingOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-subtle"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {order.orderCode || order.id}
                      </span>
                      <OrderStatusLabel status={order.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.items?.[0]?.productName || t('storeOrders.title')}
                      {order.createdAt && (
                        <>
                          {' · '}
                          <OrderDate value={order.createdAt} />
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.totalAmount != null && (
                      <ProductPrice
                        value={order.totalAmount}
                        className="text-sm font-semibold text-foreground tabular-nums"
                      />
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link to="/store/orders?status=PENDING_CONFIRMATION">
                        {t('stores.dashboard.processOrder')}
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('stores.dashboard.quickActionsTitle')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map(({ to, icon: Icon, title, description }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle text-foreground">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
              </div>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
