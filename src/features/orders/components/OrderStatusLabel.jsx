import { useTranslation } from 'react-i18next'
import { getOrderStatusKey } from '@/features/orders/orderStatus'

/** @param {{ status: string }} props */
export function OrderStatusLabel({ status }) {
  const { t } = useTranslation()
  return <span className="order-status">{t(getOrderStatusKey(status))}</span>
}
