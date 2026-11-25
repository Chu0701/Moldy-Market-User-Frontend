import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, RefreshCw, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { PaginationBar } from '@/components/common/PaginationBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { StoreOrderCard } from '@/features/orders/components/StoreOrderCard'
import { StoreOrderDateRangeButton } from '@/features/orders/components/StoreOrderDateRangeButton'
import { StoreOrderDetailDrawer } from '@/features/orders/components/StoreOrderDetailDrawer'
import { useConfirmStoreOrder } from '@/features/orders/hooks/useConfirmStoreOrder'
import { useStoreOrders } from '@/features/orders/hooks/useStoreOrders'
import { getStoreOrderConfirmErrorKey } from '@/features/orders/storeOrdersState'
import { cn } from '@/lib/utils'

const statusTabs = [
  { status: '', labelKey: 'storeOrders.tabs.all' },
  { status: 'PENDING_CONFIRMED', labelKey: 'storeOrders.tabs.needsAction', alertBadge: true },
  { status: 'CONFIRMED', labelKey: 'orders.statuses.confirmed' },
  { status: 'SHIPPING', labelKey: 'orders.statuses.shipping' },
  { status: 'COMPLETED', labelKey: 'orders.statuses.completed' },
  { status: 'CANCELLED', labelKey: 'orders.statuses.cancelled' },
  { status: 'DISPUTED', labelKey: 'orders.statuses.disputed' },
]

function getDayGroupKey(isoValue, nowMs) {
  const ts = Date.parse(isoValue ?? '')
  if (!Number.isFinite(ts)) return 'older'
  const now = new Date(nowMs)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86_400_000
  const startOfWeek = startOfToday - 6 * 86_400_000

  if (ts >= startOfToday) return 'today'
  if (ts >= startOfYesterday) return 'yesterday'
  if (ts >= startOfWeek) return 'thisWeek'
  return 'older'
}

export function StoreOrdersPage() {
  const { t } = useTranslation()
  const state = useStoreOrders()
  const {
    userId,
    profileQuery,
    ownerQuery,
    staffQuery,
    access,
    params,
    query,
    summaryQuery,
    queryKey,
  } = state
  const accessQuery = access.kind === 'staff' ? staffQuery : ownerQuery
  const confirmation = useConfirmStoreOrder({ userId, storeId: access.storeId, queryKey })

  const [draftSearch, setDraftSearch] = useState(params.q)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [referenceNow] = useState(() => Date.now())
  const searchDebounceRef = useRef(null)

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [])

  const rawItems = useMemo(() => query.data?.items ?? [], [query.data?.items])

  // Pin PENDING_CONFIRMED orders to the top when viewing "All" so urgent actions are never buried.
  const orderedItems = useMemo(() => {
    if (params.status !== '') return rawItems
    const urgent = []
    const rest = []
    for (const item of rawItems) {
      if (item.status === 'PENDING_CONFIRMED') urgent.push(item)
      else rest.push(item)
    }
    return urgent.length > 0 && rest.length > 0 ? [...urgent, ...rest] : rawItems
  }, [params.status, rawItems])

  const selectedOrder = useMemo(
    () => (selectedOrderId ? (rawItems.find((item) => item.id === selectedOrderId) ?? null) : null),
    [rawItems, selectedOrderId],
  )

  const groupedSections = useMemo(() => {
    const sections = []
    const pinUrgent =
      params.status === '' &&
      orderedItems.some((item) => item.status === 'PENDING_CONFIRMED') &&
      orderedItems.some((item) => item.status !== 'PENDING_CONFIRMED')

    for (const order of orderedItems) {
      const bucket =
        pinUrgent && order.status === 'PENDING_CONFIRMED'
          ? 'needsAction'
          : getDayGroupKey(order.createdAt, referenceNow)
      const last = sections[sections.length - 1]
      if (last && last.bucket === bucket) {
        last.orders.push(order)
      } else {
        sections.push({ bucket, orders: [order] })
      }
    }
    return sections
  }, [orderedItems, params.status, referenceNow])

  const showGroupHeaders = groupedSections.length > 1

  async function refresh() {
    const result = await query.refetch()
    void summaryQuery.refetch()
    if (!result.isError) confirmation.reset()
  }

  function handleSearchChange(nextValue) {
    setDraftSearch(nextValue)
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = window.setTimeout(() => {
      state.changeSearch(nextValue)
    }, 300)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    state.changeSearch(draftSearch)
  }

  function handleClearSearch() {
    setDraftSearch('')
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    state.changeSearch('')
  }

  if (profileQuery.isPending || (['owner', 'staff'].includes(access.kind) && accessQuery.isPending))
    return <p role="status">{t('storeOrders.loading')}</p>
  if (['owner', 'staff'].includes(access.kind) && accessQuery.isError) {
    return [403, 404].includes(accessQuery.error?.status) ? (
      <ForbiddenState />
    ) : (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void accessQuery.refetch()}
        isRetrying={accessQuery.isFetching}
      />
    )
  }
  if (access.kind === 'owner' && ownerQuery.data === null)
    return (
      <div className="flex w-full min-w-0 flex-col gap-5 pt-2">
        <EmptyState
          title={t('storeOrders.noStore')}
          description={t('storeOrders.noStoreDescription')}
        />
        <Link to="/open-store" className="underline underline-offset-4">
          {t('stores.open.title')}
        </Link>
      </div>
    )
  if (!access.canRead || [403, 404].includes(query.error?.status)) return <ForbiddenState />
  if (!params.valid)
    return (
      <section className="flex w-full min-w-0 flex-col gap-5 pt-2">
        <EmptyState
          title={t('storeOrders.invalidFilters')}
          description={t('storeOrders.invalidFiltersDescription')}
        />
        <Link to="/store/orders" className="underline underline-offset-4">
          {t('storeOrders.resetFilters')}
        </Link>
      </section>
    )

  const summary = summaryQuery.data
  const hasActiveSearchOrDates = Boolean(params.q || params.from || params.to)
  const busy = query.isFetching || confirmation.isPending

  function getTabCount(tabStatus) {
    if (!summary) return null
    if (!tabStatus) return summary.total
    return Number(summary.counts?.[tabStatus] ?? 0)
  }

  let content
  if (query.isPending) {
    content = (
      <div className="space-y-2.5" aria-busy="true">
        <p role="status" className="text-sm text-muted-foreground">
          {t('storeOrders.loading')}
        </p>
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
  } else if (query.isError) {
    content = (
      <ErrorState
        title={t('storeOrders.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void refresh()}
        isRetrying={query.isFetching}
      />
    )
  } else if (orderedItems.length === 0) {
    content = (
      <div className="space-y-3">
        <EmptyState
          title={t('storeOrders.empty')}
          description={t('storeOrders.emptyDescription')}
        />
        {(params.status || hasActiveSearchOrDates) && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDraftSearch('')
                state.clearFilters()
              }}
            >
              {t('storeOrders.resetFilters')}
            </Button>
          </div>
        )}
      </div>
    )
  } else {
    content = (
      <div className="w-full min-w-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:bg-card">
        {/* Desktop table header — fixed columns + sole flexible Product column, zero horizontal scroll */}
        <div
          aria-hidden="true"
          className="hidden border-b border-border bg-surface-subtle/80 px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase lg:grid lg:grid-cols-[116px_minmax(0,1fr)_104px_104px_134px_88px] lg:items-center lg:gap-x-3"
        >
          <span className="whitespace-nowrap">{t('storeOrders.columns.order')}</span>
          <span className="pr-3 whitespace-nowrap">{t('storeOrders.columns.product')}</span>
          <span className="whitespace-nowrap">{t('storeOrders.columns.buyer')}</span>
          <span className="pr-2 text-right whitespace-nowrap">
            {t('storeOrders.columns.total')}
          </span>
          <span className="whitespace-nowrap">{t('storeOrders.columns.status')}</span>
          <span className="text-right whitespace-nowrap">{t('storeOrders.columns.action')}</span>
        </div>

        <ul className="space-y-3 lg:space-y-0" aria-label={t('storeOrders.listLabel')}>
          {groupedSections.map((section) => (
            <Fragment key={section.bucket}>
              {showGroupHeaders && (
                <li
                  role="presentation"
                  className={cn(
                    'pt-2 text-[11px] font-semibold tracking-wider uppercase lg:border-b lg:border-border lg:px-4 lg:py-1.5',
                    section.bucket === 'needsAction'
                      ? 'text-orange-700 lg:bg-orange-50/60'
                      : 'text-muted-foreground lg:bg-surface-subtle/50',
                  )}
                >
                  {section.bucket === 'needsAction'
                    ? t('storeOrders.tabs.needsAction')
                    : t('storeOrders.dayGroups.' + section.bucket)}
                </li>
              )}
              {section.orders.map((order) => (
                <li key={order.id}>
                  <StoreOrderCard
                    order={order}
                    mutation={confirmation}
                    canConfirm={access.canConfirm}
                    disabled={busy}
                    onOpenDetail={(id) => setSelectedOrderId(id)}
                  />
                </li>
              ))}
            </Fragment>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-5 pt-2"
      aria-labelledby="store-orders-title"
    >
      <div className="order-heading">
        <div className="grid gap-1.5">
          <Link
            to="/store"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            <span>{t('storeOrders.back')}</span>
          </Link>
          <h1
            id="store-orders-title"
            className="scroll-mt-24 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {t('storeOrders.title')}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9.5"
          onClick={() => void refresh()}
          disabled={busy}
        >
          <RefreshCw
            aria-hidden="true"
            className={query.isFetching ? 'size-4 animate-spin' : 'size-4'}
          />
          <span>{t('storeOrders.refresh')}</span>
        </Button>
      </div>

      {/* Unified underline tabs — hidden scrollbar, zero vertical overflow */}
      <div
        role="tablist"
        aria-label={t('storeOrders.status')}
        className="flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {statusTabs.map((tab) => {
          const active = params.status === tab.status
          const count = getTabCount(tab.status)
          return (
            <button
              key={tab.status || 'ALL'}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={busy}
              onClick={() => state.changeStatus(tab.status)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                active
                  ? 'border-foreground font-semibold text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              <span>{t(tab.labelKey)}</span>
              {count !== null && (
                <span
                  className={cn(
                    'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                    tab.alertBadge && count > 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Single-line baseline-aligned toolbar: wide live Search + unified Date Range + Sort */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={draftSearch}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t('storeOrders.searchPlaceholder')}
            aria-label={t('storeOrders.searchLabel')}
            className="h-9.5 w-full rounded-lg border border-input bg-background pr-9 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground hover:border-foreground/35 focus-visible:border-foreground/75 focus-visible:ring-2 focus-visible:ring-ring"
          />
          {draftSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label={t('storeOrders.clearFilters')}
              className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <StoreOrderDateRangeButton
            from={params.from}
            to={params.to}
            disabled={busy}
            onChange={(range) => state.changeDateRange(range)}
          />

          <select
            id="store-order-sort"
            aria-label={t('storeOrders.sortLabel')}
            value={params.sort}
            disabled={busy}
            onChange={(event) => state.changeSort(event.target.value)}
            className="h-9.5 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground outline-none hover:border-foreground/35 focus-visible:border-foreground/75 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="newest">{t('storeOrders.sortOptions.newest')}</option>
            <option value="oldest">{t('storeOrders.sortOptions.oldest')}</option>
          </select>
        </div>
      </div>

      {confirmation.error && (
        <p role="alert" className="checkout-error">
          {t(getStoreOrderConfirmErrorKey(confirmation.error))}
        </p>
      )}

      {content}

      {query.isSuccess && (query.data.page > 1 || query.data.hasNext) && (
        <PaginationBar
          page={query.data.page}
          hasNext={query.data.hasNext}
          totalElements={query.data.totalElements}
          disabled={busy}
          onPageChange={state.changePage}
        />
      )}

      <StoreOrderDetailDrawer
        order={selectedOrder}
        mutation={confirmation}
        canConfirm={access.canConfirm}
        disabled={busy}
        onClose={() => setSelectedOrderId(null)}
      />
    </section>
  )
}
