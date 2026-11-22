import { useTranslation } from 'react-i18next'

/** @param {{ value?: string }} props */
export function ChatTime({ value }) {
  const { t, i18n } = useTranslation()
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return <span>{t('chat.timeUnknown')}</span>

  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date)}
    </time>
  )
}
