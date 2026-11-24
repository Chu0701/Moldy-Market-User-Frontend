import { useTranslation } from 'react-i18next'

/** @param {{ value?: string, className?: string }} props */
export function OrderDate({ value, className }) {
  const { t, i18n } = useTranslation()
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) {
    return <span className={className}>{t('orders.dateUnknown')}</span>
  }

  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN'
  const datePart = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  return (
    <time dateTime={value} className={className}>
      {`${datePart}, ${timePart}`}
    </time>
  )
}
