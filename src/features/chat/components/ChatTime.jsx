import { useTranslation } from 'react-i18next'

import { getDateKey } from '@/features/chat/chatDate'

/** @param {{ value?: string, mode?: 'full' | 'time' | 'date' | 'compact', className?: string }} props */
export function ChatTime({ value, mode = 'full', className }) {
  const { t, i18n } = useTranslation()
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) {
    return <span className={className}>{t('chat.timeUnknown')}</span>
  }

  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN'
  let formatted

  if (mode === 'time') {
    formatted = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } else if (mode === 'date') {
    formatted = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } else if (mode === 'compact') {
    const isToday = getDateKey(value) === getDateKey(new Date().toISOString())
    formatted = isToday
      ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date)
      : new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(date)
  } else {
    formatted = new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  return (
    <time dateTime={value} className={className}>
      {formatted}
    </time>
  )
}
