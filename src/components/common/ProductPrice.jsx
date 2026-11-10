import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

/** @param {{ value: number, className?: string }} props */
export function ProductPrice({ value, className }) {
  const { i18n } = useTranslation()

  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN'

  const formattedPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 2,
  }).format(value)

  return <span className={cn('tabular-nums', className)}>{formattedPrice}</span>
}
