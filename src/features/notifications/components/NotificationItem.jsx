import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  Mail,
  Package,
  ShieldCheck,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useInRouterContext } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  formatRelativeNotificationTime,
  getNotificationLink,
  getNotificationVisual,
} from '@/features/notifications/notificationMeta'
import { cn } from '@/lib/utils'

const ICONS = {
  order: Package,
  wallet: Wallet,
  alert: AlertTriangle,
  review: Star,
  shield: ShieldCheck,
  bell: Bell,
}

/** @param {{ item: object, busy: boolean, onUpdate: (id: string, action: string) => Promise<void> }} props */
export function NotificationItem({ item, busy, onUpdate }) {
  const { t, i18n } = useTranslation()
  const inRouter = useInRouterContext()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const visual = getNotificationVisual(item.type)
  const Icon = ICONS[visual.icon] ?? Bell
  const linkTarget = getNotificationLink(item)
  const { label: relativeTime, full: fullTime } = formatRelativeNotificationTime(
    item.createdAt,
    i18n.resolvedLanguage,
  )

  async function update(action) {
    try {
      await onUpdate(item.id, action)
      setConfirmDelete(false)
    } catch {
      // The page renders the mutation error; keep the item available for a deliberate retry.
    }
  }

  function handleNavigateClick() {
    if (!item.read && !busy) {
      void update('read')
    }
  }

  return (
    <li>
      <article
        className={cn(
          'relative flex items-start gap-3.5 px-4 py-4 transition-colors duration-150 sm:px-5',
          !item.read
            ? 'bg-surface-subtle hover:bg-accent/60'
            : 'bg-card hover:bg-surface-subtle/70',
          visual.priority === 'high' && !item.read && 'border-l-2 border-l-destructive',
        )}
        aria-label={item.title || t('notifications.fallbackTitle')}
      >
        <div className="relative shrink-0 pt-0.5">
          <span
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-full border',
              visual.iconTone,
            )}
            aria-hidden="true"
          >
            <Icon className="size-4.5" />
          </span>
          {!item.read && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card',
                visual.priority === 'high' ? 'bg-destructive' : 'bg-primary',
              )}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h2
              className={cn(
                'font-sans text-sm leading-5 break-words',
                !item.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
              )}
            >
              {item.title || t('notifications.fallbackTitle')}
            </h2>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="sr-only">
                {t(item.read ? 'notifications.read' : 'notifications.unread')}
              </span>
              {relativeTime && (
                <time
                  dateTime={item.createdAt}
                  title={fullTime ?? undefined}
                  className="tabular-nums"
                >
                  {relativeTime}
                </time>
              )}
            </div>
          </div>

          {item.message && (
            <p
              className={cn(
                'mt-1 line-clamp-2 text-sm leading-6 break-words',
                !item.read ? 'text-foreground/80' : 'text-muted-foreground',
              )}
            >
              {item.message}
            </p>
          )}

          {confirmDelete ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
              <span className="text-xs font-medium text-foreground">
                {t('notifications.deletePrompt')}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => void update('delete')}
                >
                  {t('notifications.confirmDelete')}
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                >
                  {t('notifications.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                {linkTarget && inRouter && (
                  <Button
                    asChild
                    variant="outline"
                    size="xs"
                    className="h-7 rounded-full px-2.5 text-xs"
                  >
                    <Link to={linkTarget.to} onClick={handleNavigateClick}>
                      <span>{t(linkTarget.actionKey)}</span>
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {item.read ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={busy}
                    aria-label={t('notifications.markUnread')}
                    title={t('notifications.markUnread')}
                    onClick={() => void update('unread')}
                    className="rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="size-3.5" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={busy}
                    aria-label={t('notifications.markRead')}
                    title={t('notifications.markRead')}
                    onClick={() => void update('read')}
                    className="rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={busy}
                  aria-label={t('notifications.delete')}
                  title={t('notifications.delete')}
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </article>
    </li>
  )
}
