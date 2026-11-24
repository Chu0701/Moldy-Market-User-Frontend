import { Package, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
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
    <div role="status" className="grid gap-4">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((index) => (
        <div key={index} aria-hidden="true" className="order-card">
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-2">
              <div className="skeleton-shimmer h-5 w-32 rounded-sm" />
              <div className="skeleton-shimmer h-3.5 w-40 rounded-sm" />
            </div>
            <div className="skeleton-shimmer h-7 w-28 rounded-full" />
          </div>
          <div className="flex items-start gap-4">
            <div className="skeleton-shimmer size-16 shrink-0 rounded-lg" />
            <div className="grid flex-1 gap-2">
              <div className="skeleton-shimmer h-4 w-2/3 rounded-sm" />
              <div className="skeleton-shimmer h-3.5 w-36 rounded-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function OrderListPage() {
  const { t } = useTranslation()
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
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1"
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
                    'inline-flex min-h-8.5 items-center gap-1.5 rounded-lg px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]',
                    active
                      ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="relative w-full sm:w-64">
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
              className="kn-input min-h-9.5 pl-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('orders.emptyFilterTitle')}
            description={t('orders.emptyFilterDescription')}
          />
        ) : (
          <ul className="order-list" aria-label={t('orders.listLabel')}>
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <article
                  className="order-card transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm motion-reduce:transform-none"
                  aria-labelledby={'order-' + order.id}
                >
                  <div className="order-heading">
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 id={'order-' + order.id} className="font-sans text-base font-semibold">
                          <Link
                            to={'/orders/' + encodeURIComponent(order.id)}
                            className="underline-offset-4 hover:underline"
                          >
                            {order.orderCode}
                          </Link>
                        </h2>
                        {order.paymentMethod && (
                          <span className="rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {t('checkout.methods.' + order.paymentMethod, {
                              defaultValue: order.paymentMethod,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {t('orders.createdAt')} <OrderDate value={order.createdAt} />
                      </p>
                    </div>
                    <OrderStatusLabel status={order.status} />
                  </div>

                  <OrderItems items={order.items} maxVisible={2} />

                  <div className="order-total">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">{t('orders.total')}:</span>
                      <ProductPrice
                        value={order.totalAmount}
                        className="text-lg font-semibold tracking-tight tabular-nums"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {order.checkoutGroupId && order.status === 'PENDING_PAYMENT' && (
                        <Button asChild size="sm">
                          <Link to={'/checkout/' + encodeURIComponent(order.checkoutGroupId)}>
                            {t('checkoutPayment.continuePayment')}
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link to={'/orders/' + encodeURIComponent(order.id)}>
                          {t('orders.viewDetail')}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <section className="orders-page" aria-labelledby="orders-title">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 id="orders-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('orders.title')}
        </h1>
        {orders.length > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('table.rowsCount', { count: orders.length })}
          </span>
        )}
      </header>
      {content}
    </section>
  )
}
