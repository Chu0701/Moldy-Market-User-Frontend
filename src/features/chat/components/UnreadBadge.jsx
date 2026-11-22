import { useTranslation } from 'react-i18next'

export function UnreadBadge({ count }) {
  const { t } = useTranslation()
  if (!Number.isSafeInteger(count) || count <= 0) return null
  return (
    <span
      className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
      aria-label={t('chat.unreadCount', { count })}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
