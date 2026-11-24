import { Bell, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useInRouterContext } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import {
  getNotificationCategory,
  groupNotificationsByTime,
} from '@/features/notifications/notificationMeta'
import { cn } from '@/lib/utils'

function NotificationsSkeleton({ label }) {
  return (
    <div role="status" className="kn-table-card divide-y divide-border">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} aria-hidden="true" className="flex items-start gap-3.5 px-4 py-4 sm:px-5">
          <div className="skeleton-shimmer size-10 shrink-0 rounded-full" />
          <div className="grid min-w-0 flex-1 gap-2">
            <div className="flex items-center justify-between gap-4">
              <div className="skeleton-shimmer h-4 w-48 rounded-sm" />
              <div className="skeleton-shimmer h-3 w-16 rounded-sm" />
            </div>
            <div className="skeleton-shimmer h-3.5 w-full rounded-sm" />
            <div className="skeleton-shimmer h-3.5 w-2/3 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const inRouter = useInRouterContext()
  const [filter, setFilter] = useState('all')
  const {
    query,
    mutation,
    items,
    unreadCount,
    update,
    markAllRead,
    refresh,
    accessError,
    profileQuery,
    userId,
  } = useNotifications()
  const busy = mutation.isPending || query.isFetching
  const initialError = profileQuery.isError || (query.isError && !query.data)

  const categoryCounts = items.reduce(
    (counts, item) => {
      if (!item.read) {
        const category = getNotificationCategory(item.type)
        counts[category] = (counts[category] ?? 0) + 1
      }
      return counts
    },
    { orders: 0, finance: 0, other: 0 },
  )

  const visibleItems = items.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !item.read
    return getNotificationCategory(item.type) === filter
  })

  const groupedSections = groupNotificationsByTime(visibleItems)

  const filterTabs = [
    { key: 'all', label: t('notifications.filterAll', { count: items.length }) },
    { key: 'unread', label: t('notifications.filterUnread', { count: unreadCount }) },
    {
      key: 'orders',
      label: t('notifications.filterOrders'),
      unread: categoryCounts.orders,
    },
    {
      key: 'finance',
      label: t('notifications.filterFinance'),
      unread: categoryCounts.finance,
    },
    {
      key: 'other',
      label: t('notifications.filterOther'),
      unread: categoryCounts.other,
    },
  ]

  return (
    <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="notifications-heading">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1
          id="notifications-heading"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          {t('notifications.title')}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={busy || !userId || unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            {t('notifications.markAllRead')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('notifications.refresh')}
            title={t('notifications.refresh')}
            disabled={busy || !userId}
            onClick={refresh}
            className="rounded-lg"
          >
            <RefreshCw
              className={cn('size-4', query.isFetching && 'animate-spin')}
              aria-hidden="true"
            />
          </Button>
        </div>
      </header>

      {accessError ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm font-medium text-destructive"
        >
          {t('notifications.forbidden')}
        </p>
      ) : initialError ? (
        <ErrorState
          title={t('notifications.loadError')}
          description={t('feedback.checkBack')}
          onRetry={refresh}
          isRetrying={busy}
        />
      ) : !userId || query.isPending ? (
        <NotificationsSkeleton label={t('notifications.loading')} />
      ) : (
        <>
          {mutation.isError && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
            >
              {t('notifications.updateError')}
            </p>
          )}
          {query.isError && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
            >
              {t('notifications.loadError')}
            </p>
          )}

          <div
            className="flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1"
            role="group"
            aria-label={t('notifications.filterLabel')}
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[13px]',
                    active
                      ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.unread > 0 && (
                    <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                      {tab.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {visibleItems.length > 0 ? (
            <div className="space-y-6" aria-busy={busy}>
              {groupedSections.map((group) => (
                <section key={group.key} className="space-y-2.5">
                  <h2 className="px-1 font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {t(`notifications.groups.${group.key}`)}
                  </h2>
                  <ul
                    className="kn-table-card divide-y divide-border"
                    aria-label={t('notifications.listLabel')}
                  >
                    {group.items.map((item) => (
                      <NotificationItem key={item.id} item={item} busy={busy} onUpdate={update} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : filter === 'unread' && items.length > 0 ? (
            <EmptyState
              icon={Bell}
              title={t('notifications.emptyUnreadTitle')}
              description={t('notifications.emptyUnreadDescription')}
            />
          ) : filter !== 'all' && items.length > 0 ? (
            <EmptyState
              icon={Bell}
              title={t('notifications.emptyCategoryTitle')}
              description={t('notifications.emptyCategoryDescription')}
            />
          ) : query.hasNextPage ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t('notifications.moreAvailable')}
            </p>
          ) : (
            <div className="grid justify-items-start gap-4">
              <EmptyState
                icon={Bell}
                title={t('notifications.emptyTitle')}
                description={t('notifications.emptyDescription')}
                className="w-full"
              />
              {inRouter && (
                <Button asChild variant="outline">
                  <Link to="/products">{t('orders.browseProducts')}</Link>
                </Button>
              )}
            </div>
          )}

          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" disabled={busy} onClick={() => query.fetchNextPage()}>
                {t(query.isFetchingNextPage ? 'notifications.loading' : 'notifications.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
