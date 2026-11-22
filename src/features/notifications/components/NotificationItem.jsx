import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** @param {{ item: object, busy: boolean, onUpdate: (id: string, action: string) => Promise<void> }} props */
export function NotificationItem({ item, busy, onUpdate }) {
  const { t, i18n } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const date = item.createdAt ? new Date(item.createdAt) : null
  const time =
    date && !Number.isNaN(date.valueOf())
      ? new Intl.DateTimeFormat(i18n.resolvedLanguage, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date)
      : null

  async function update(action) {
    try {
      await onUpdate(item.id, action)
      setConfirmDelete(false)
    } catch {
      // The page renders the mutation error; keep the item available for a deliberate retry.
    }
  }

  return (
    <li>
      <article
        className={cn('rounded-xl border border-border p-5 sm:p-6', !item.read && 'bg-accent/40')}
        aria-label={item.title || t('notifications.fallbackTitle')}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className={cn(!item.read && 'font-semibold text-foreground')}>
            {t(item.read ? 'notifications.read' : 'notifications.unread')}
          </span>
          {time && <time dateTime={item.createdAt}>{time}</time>}
        </div>
        <h2 className="mt-3 text-xl font-semibold break-words">
          {item.title || t('notifications.fallbackTitle')}
        </h2>
        {item.message && (
          <p className="mt-2 text-sm leading-7 whitespace-pre-wrap break-words text-muted-foreground">
            {item.message}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!item.read && (
            <Button variant="outline" disabled={busy} onClick={() => update('read')}>
              {t('notifications.markRead')}
            </Button>
          )}
          {confirmDelete ? (
            <>
              <span className="text-sm">{t('notifications.deletePrompt')}</span>
              <Button variant="destructive" disabled={busy} onClick={() => update('delete')}>
                {t('notifications.confirmDelete')}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>
                {t('notifications.cancel')}
              </Button>
            </>
          ) : (
            <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>
              {t('notifications.delete')}
            </Button>
          )}
        </div>
      </article>
    </li>
  )
}
