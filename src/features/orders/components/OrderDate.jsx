import { useTranslation } from 'react-i18next'

/** @param {{ value?: string }} props */
export function OrderDate({ value }) {
  const { t, i18n } = useTranslation()
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return <span>{t('orders.dateUnknown')}</span>

  const formatted = new Intl.DateTimeFormat(i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)

  return <time dateTime={value}>{formatted}</time>
}
