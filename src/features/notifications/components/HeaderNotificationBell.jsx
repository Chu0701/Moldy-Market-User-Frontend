import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Bell, Package, ShieldCheck, Star, Wallet } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { notificationKeys } from '@/features/notifications/hooks/useNotifications'
import {
  formatRelativeNotificationTime,
  getNotificationLink,
  getNotificationVisual,
} from '@/features/notifications/notificationMeta'
import { useDetailsDismiss } from '@/hooks/useDetailsDismiss'
import { cn } from '@/lib/utils'
import {
  getNotifications,
  markNotificationRead,
} from '@/services/notifications/notificationService'

const ICONS = {
  order: Package,
  wallet: Wallet,
  alert: AlertTriangle,
  review: Star,
  shield: ShieldCheck,
  bell: Bell,
}

/** @param {{ userId?: string }} props */
export function HeaderNotificationBell({ userId }) {
  const { t, i18n } = useTranslation()
  const client = useQueryClient()
  const detailsRef = useRef(null)
  const [open, setOpen] = useState(false)
  const handleDismiss = useCallback(() => setOpen(false), [])
  useDetailsDismiss(detailsRef, open, handleDismiss)

  // Fetch lazily only when the user opens the bell popover so unrelated pages/tests never trigger extra requests.
  const query = useInfiniteQuery({
    queryKey: notificationKeys.inbox(userId),
    queryFn: ({ pageParam, signal }) => getNotifications({ token: pageParam, signal }),
    initialPageParam: undefined,
    getNextPageParam: (last) => (last.hasMore && last.nextToken ? last.nextToken : undefined),
    enabled: Boolean(open && userId),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const seen = new Set()
  const items = !userId
    ? []
    : (query.data?.pages ?? [])
        .flatMap((page) => page.items)
        .filter((row) => {
          if (row.userId !== userId || row.deleted || seen.has(row.id)) return false
          seen.add(row.id)
          return true
        })

  const unreadCount = items.filter((item) => !item.read).length
  const previewItems = items.slice(0, 5)

  function closePopover(event) {
    event.currentTarget.closest('details')?.removeAttribute('open')
    setOpen(false)
  }

  async function handleItemClick(event, item) {
    closePopover(event)
    if (!item.read && userId) {
      try {
        await markNotificationRead({ id: item.id })
        await client.invalidateQueries({ queryKey: notificationKeys.inbox(userId), exact: true })
      } catch {
        // Silent fallback; user lands on the target page smoothly.
      }
    }
  }

  return (
    <details
      ref={detailsRef}
      className="relative"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        aria-label={t('notifications.title')}
        title={t('notifications.title')}
        className="relative inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-full text-foreground/80 transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unreadCount > 0 && (
          <span
            aria-label={t('notifications.filterUnread', { count: unreadCount })}
            className="pointer-events-none absolute top-0.5 right-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white tabular-nums"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </summary>

      <div className="kn-popover-enter absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg sm:w-96">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{t('notifications.title')}</p>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
          <Link
            to="/notifications"
            onClick={closePopover}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.isPending ? (
            <div className="divide-y divide-border">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-start gap-3 px-4 py-3">
                  <div className="skeleton-shimmer size-8 shrink-0 rounded-full" />
                  <div className="grid flex-1 gap-1.5">
                    <div className="skeleton-shimmer h-3.5 w-40 rounded-sm" />
                    <div className="skeleton-shimmer h-3 w-full rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              {t('notifications.loadError')}
            </p>
          ) : previewItems.length === 0 ? (
            <div className="grid justify-items-center gap-2 px-4 py-8 text-center">
              <Bell className="size-6 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">{t('notifications.emptyTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('notifications.emptyDescription')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {previewItems.map((item) => {
                const visual = getNotificationVisual(item.type)
                const Icon = ICONS[visual.icon] ?? Bell
                const target = getNotificationLink(item)?.to ?? '/notifications'
                const { label: relativeTime } = formatRelativeNotificationTime(
                  item.createdAt,
                  i18n.resolvedLanguage,
                )
                return (
                  <li key={item.id}>
                    <Link
                      to={target}
                      onClick={(event) => void handleItemClick(event, item)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                        !item.read && 'bg-surface-subtle',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border',
                          visual.iconTone,
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={cn(
                              'truncate text-xs leading-5',
                              !item.read
                                ? 'font-semibold text-foreground'
                                : 'font-medium text-foreground/80',
                            )}
                          >
                            {item.title || t('notifications.fallbackTitle')}
                          </p>
                          {relativeTime && (
                            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                              {relativeTime}
                            </span>
                          )}
                        </div>
                        {item.message && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.message}
                          </p>
                        )}
                      </div>
                      {!item.read && (
                        <span
                          className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border bg-surface-subtle/60 px-4 py-2.5 text-center">
          <Link
            to="/notifications"
            onClick={closePopover}
            className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>
      </div>
    </details>
  )
}
