import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

export function NotificationsPage() {
  const { t } = useTranslation()
  const { query, mutation, items, update, refresh, accessError, profileQuery, userId } =
    useNotifications()
  const busy = mutation.isPending || query.isFetching
  const initialError = profileQuery.isError || (query.isError && !query.data)

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
        <Button variant="outline" disabled={busy || !userId} onClick={refresh}>
          {t('notifications.refresh')}
        </Button>
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
          {items.length > 0 ? (
            <ul className="space-y-4" aria-label={t('notifications.listLabel')} aria-busy={busy}>
              {items.map((item) => (
                <NotificationItem key={item.id} item={item} busy={busy} onUpdate={update} />
              ))}
            </ul>
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
