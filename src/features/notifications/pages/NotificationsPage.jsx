import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

export function NotificationsPage() {
  const { t } = useTranslation()
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
  const visibleItems = filter === 'unread' ? items.filter((item) => !item.read) : items

  return (
    <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="notifications-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="notifications-heading" className="text-3xl font-semibold sm:text-4xl">
            {t('notifications.title')}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {t('notifications.description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={busy || !userId || unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            {t('notifications.markAllRead')}
          </Button>
          <Button variant="outline" disabled={busy || !userId} onClick={refresh}>
            {t('notifications.refresh')}
          </Button>
        </div>
      </div>

      {accessError ? (
        <p role="alert" className="rounded-xl border border-border p-6">
          {t('notifications.forbidden')}
        </p>
      ) : initialError ? (
        <div role="alert" className="rounded-xl border border-border p-6">
          <p>{t('notifications.loadError')}</p>
          <Button className="mt-4" variant="outline" disabled={busy} onClick={refresh}>
            {t('notifications.refresh')}
          </Button>
        </div>
      ) : !userId || query.isPending ? (
        <p role="status">{t('notifications.loading')}</p>
      ) : (
        <>
          {mutation.isError && (
            <p role="alert" className="rounded-xl border border-border p-4">
              {t('notifications.updateError')}
            </p>
          )}
          {query.isError && (
            <p role="alert" className="rounded-xl border border-border p-4">
              {t('notifications.loadError')}
            </p>
          )}
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t('notifications.filterLabel')}
          >
            <Button
              type="button"
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              {t('notifications.filterAll', { count: items.length })}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === 'unread' ? 'default' : 'outline'}
              aria-pressed={filter === 'unread'}
              onClick={() => setFilter('unread')}
            >
              {t('notifications.filterUnread', { count: unreadCount })}
            </Button>
          </div>

          {visibleItems.length > 0 ? (
            <ul className="space-y-4" aria-label={t('notifications.listLabel')} aria-busy={busy}>
              {visibleItems.map((item) => (
                <NotificationItem key={item.id} item={item} busy={busy} onUpdate={update} />
              ))}
            </ul>
          ) : filter === 'unread' && items.length > 0 ? (
            <EmptyState
              title={t('notifications.emptyUnreadTitle')}
              description={t('notifications.emptyUnreadDescription')}
            />
          ) : query.hasNextPage ? (
            <p role="status">{t('notifications.moreAvailable')}</p>
          ) : (
            <EmptyState
              title={t('notifications.emptyTitle')}
              description={t('notifications.emptyDescription')}
            />
          )}
          {query.hasNextPage && (
            <Button variant="outline" disabled={busy} onClick={() => query.fetchNextPage()}>
              {t(query.isFetchingNextPage ? 'notifications.loading' : 'notifications.loadMore')}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
