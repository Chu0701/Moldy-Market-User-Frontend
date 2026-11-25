import { Eye, Package, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { useMyOrders } from '@/features/orders/hooks/useMyOrders'
import { cn } from '@/lib/utils'

const FILTER_GROUPS = {
  all: () => true,
  processing: (status) =>
    status === 'PENDING_PAYMENT' || status === 'PENDING_CONFIRMED' || status === 'CONFIRMED',
  shipping: (status) => status === 'SHIPPING' || status === 'DELIVERED',
  completed: (status) => status === 'COMPLETED',
  cancelled: (status) => status === 'CANCELLED' || status === 'EXPIRED',
  disputed: (status) => status === 'DISPUTED' || status === 'REFUNDED',
}

function OrdersSkeleton({ label }) {
  return (
    <div role="status" className="grid gap-2.5">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="rounded-xl border border-border bg-card p-3.5"
        >
          <div className="skeleton-shimmer h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function OrderListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const query = useMyOrders()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const orders = query.data ?? []

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredOrders = orders.filter((order) => {
    const matcher = FILTER_GROUPS[statusFilter] ?? FILTER_GROUPS.all
    if (!matcher(order.status)) return false
    if (!normalizedSearch) return true
    const matchesCode = order.orderCode?.toLowerCase().includes(normalizedSearch)
    const matchesProduct = order.items?.some((item) =>
      item.productName?.toLowerCase().includes(normalizedSearch),
    )
    return Boolean(matchesCode || matchesProduct)
  })

  const filterTabs = [
    { key: 'all', label: t('orders.filters.all'), count: orders.length },
    {
      key: 'processing',
      label: t('orders.filters.processing'),
      count: orders.filter((order) => FILTER_GROUPS.processing(order.status)).length,
      alertBadge: true,
    },
    {
      key: 'shipping',
      label: t('orders.filters.shipping'),
      count: orders.filter((order) => FILTER_GROUPS.shipping(order.status)).length,
    },
    {
      key: 'completed',
      label: t('orders.filters.completed'),
      count: orders.filter((order) => FILTER_GROUPS.completed(order.status)).length,
    },
    {
      key: 'cancelled',
      label: t('orders.filters.cancelled'),
      count: orders.filter((order) => FILTER_GROUPS.cancelled(order.status)).length,
    },
    {
      key: 'disputed',
      label: t('orders.filters.disputed'),
      count: orders.filter((order) => FILTER_GROUPS.disputed(order.status)).length,
    },
  ]

  let content

  if (query.isPending) {
    content = <OrdersSkeleton label={t('orders.loading')} />
  } else if (query.error?.status === 403) {
    content = <ForbiddenState />
  } else if (query.isError) {
    content = (
      <ErrorState
        title={t('orders.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  } else if (orders.length === 0) {
    content = (
      <div className="grid justify-items-start gap-4">
        <EmptyState
          icon={Package}
          title={t('orders.emptyTitle')}
          description={t('orders.emptyDescription')}
          className="w-full"
        />
        <Button asChild>
          <Link to="/products">{t('orders.browseProducts')}</Link>
        </Button>
      </div>
    )
  } else {
    content = (
      <div className="grid gap-4">
        {/* Unified underline tabs — matching Seller Center */}
        <div
          className="flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label={t('orders.filters.label')}
        >
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-foreground font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                    tab.alertBadge && tab.count > 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Clean search bar */}
        <div className="relative w-full sm:max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('orders.searchPlaceholder')}
            aria-label={t('orders.searchPlaceholder')}
            className="h-9.5 w-full rounded-lg border border-input bg-background pr-9 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground hover:border-foreground/35 focus-visible:border-foreground/75 focus-visible:ring-2 focus-visible:ring-ring"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label={t('actions.clear')}
              className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('orders.emptyFilterTitle')}
            description={t('orders.emptyFilterDescription')}
          />
        ) : (
          <div className="w-full min-w-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-card">
            <div
              aria-hidden="true"
              className="hidden border-b border-border bg-surface-subtle/80 px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:grid lg:grid-cols-[136px_minmax(0,1fr)_124px_154px_150px] lg:items-center lg:gap-x-3"
            >
              <span className="whitespace-nowrap">{t('storeOrders.columns.order')}</span>
              <span className="pr-3 whitespace-nowrap">{t('storeOrders.columns.product')}</span>
              <span className="pr-2 text-right whitespace-nowrap">
                {t('storeOrders.columns.total')}
              </span>
              <span className="whitespace-nowrap">{t('storeOrders.columns.status')}</span>
              <span className="text-right whitespace-nowrap">
                {t('storeOrders.columns.action')}
              </span>
            </div>

            <ul className="space-y-3 lg:space-y-0" aria-label={t('orders.listLabel')}>
              {filteredOrders.map((order) => {
                const items = Array.isArray(order.items) ? order.items : []
                const firstItem = items[0]
                const extraCount = Math.max(0, items.length - 1)
                const needsPayment = order.status === 'PENDING_PAYMENT'
                const isClosed = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(
                  order.status,
                )
                const detailHref = '/orders/' + encodeURIComponent(order.id)
                const paymentLabel = order.paymentMethod
                  ? t('checkout.methods.' + order.paymentMethod, {
                      defaultValue: order.paymentMethod,
                    })
                  : undefined

                return (
                  <li key={order.id}>
                    <article
                      aria-labelledby={'order-' + order.id}
                      onClick={() => void navigate(detailHref)}
                      className={cn(
                        'group relative cursor-pointer rounded-xl border bg-card transition-colors hover:bg-surface-subtle/60 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b',
                        needsPayment
                          ? 'border-orange-200 border-l-[3px] border-l-orange-500 bg-orange-50/40 hover:bg-orange-50/70 lg:border-b-border'
                          : 'border-border',
                        isClosed && 'opacity-75 hover:opacity-100',
                      )}
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 px-4 py-3 lg:min-h-[64px] lg:grid-cols-[136px_minmax(0,1fr)_124px_154px_150px] lg:items-center lg:gap-x-3 lg:gap-y-0 lg:py-2.5">
                        {/* Col 1: Order code + date */}
                        <div className="order-1 min-w-0 lg:order-1">
                          <h2
                            id={'order-' + order.id}
                            className={cn(
                              'truncate font-sans text-[13px] leading-5 font-semibold tracking-normal',
                              isClosed ? 'text-muted-foreground' : 'text-foreground',
                            )}
                          >
                            <Link
                              to={detailHref}
                              onClick={(event) => event.stopPropagation()}
                              className="underline-offset-4 hover:underline"
                            >
                              {order.orderCode}
                            </Link>
                          </h2>
                          <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground tabular-nums">
                            <OrderDate value={order.createdAt} />
                          </p>
                        </div>

                        {/* Col 4 on desktop, top-right on mobile: Status badge */}
                        <div className="order-2 flex min-w-0 items-center justify-end lg:order-4 lg:justify-start">
                          <OrderStatusLabel status={order.status} compact title={paymentLabel} />
                        </div>

                        {/* Col 2: Product thumbnail + 1-line title + extra count */}
                        <div className="order-3 col-span-2 flex min-w-0 items-center gap-2.5 pr-2 lg:order-2 lg:col-span-1 lg:pr-3">
                          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/70">
                            {firstItem?.imageUrl ? (
                              <img
                                src={firstItem.imageUrl}
                                alt={firstItem.productName || order.orderCode}
                                loading="lazy"
                                className="size-full object-cover"
                              />
                            ) : (
                              <Package
                                aria-hidden="true"
                                className="size-4 text-muted-foreground/45"
                              />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <p
                              className={cn(
                                'min-w-0 truncate text-sm leading-5 font-medium',
                                isClosed ? 'text-muted-foreground' : 'text-foreground',
                              )}
                            >
                              {firstItem?.productName || t('storeOrders.unknownProduct')}
                            </p>
                            {extraCount > 0 && (
                              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {t('storeOrders.moreItems', { count: extraCount })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Col 3: Total */}
                        <div className="order-4 flex items-center justify-start lg:order-3 lg:justify-end lg:pr-2">
                          <ProductPrice
                            value={order.totalAmount}
                            className={cn(
                              'text-sm font-bold whitespace-nowrap tabular-nums',
                              isClosed ? 'text-muted-foreground' : 'text-foreground',
                            )}
                          />
                        </div>

                        {/* Col 5: Single centered action */}
                        <div
                          className="order-5 flex items-center justify-end lg:order-5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {order.checkoutGroupId && needsPayment ? (
                            <Button asChild size="sm" className="h-8 px-3 text-xs">
                              <Link to={'/checkout/' + encodeURIComponent(order.checkoutGroupId)}>
                                {t('checkoutPayment.continuePayment')}
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="size-8 shrink-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Link
                                to={detailHref}
                                aria-label={t('orders.viewDetail')}
                                title={t('orders.viewDetail')}
                              >
                                <Eye aria-hidden="true" className="size-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="orders-page" aria-labelledby="orders-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 id="orders-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('orders.title')}
        </h1>
        {orders.length > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('table.rowsCount', { count: orders.length })}
          </span>
        )}
      </div>
      {content}
    </section>
  )
}
