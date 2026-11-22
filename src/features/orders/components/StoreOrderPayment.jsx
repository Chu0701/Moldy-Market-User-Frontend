import { useTranslation } from 'react-i18next'
import { OrderDate } from '@/features/orders/components/OrderDate'

const methodKeys = { COD: 'cod', ONLINE_BANKING: 'online' }
const statusKeys = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
}

/** @param {{ order: object }} props */
export function StoreOrderPayment({ order }) {
  const { t } = useTranslation()
  const methodKey = Object.hasOwn(methodKeys, order.paymentMethod)
    ? methodKeys[order.paymentMethod]
    : 'unknown'
  let statusKey = Object.hasOwn(statusKeys, order.paymentStatus)
    ? statusKeys[order.paymentStatus]
    : 'unknown'
  if (order.paymentMethod === 'COD') {
    if (order.paymentStatus === 'PENDING') statusKey = 'codPending'
    if (order.paymentStatus === 'SUCCESSFUL') statusKey = 'codSuccessful'
    if (order.paymentStatus === 'FAILED' && ['CANCELLED', 'EXPIRED'].includes(order.status))
      statusKey = 'codCancelled'
  }

  return (
    <dl
      className="flex flex-wrap gap-x-8 gap-y-4 rounded-lg border border-border p-4 text-sm"
      aria-label={t('storeOrders.payment.title')}
    >
      <div className="grid gap-1">
        <dt className="text-muted-foreground">{t('storeOrders.payment.method')}</dt>
        <dd className="font-medium">{t('storeOrders.payment.methods.' + methodKey)}</dd>
      </div>
      <div className="grid gap-1">
        <dt className="text-muted-foreground">{t('storeOrders.payment.status')}</dt>
        <dd className="font-medium">{t('storeOrders.payment.statuses.' + statusKey)}</dd>
      </div>
      {order.paymentStatus === 'SUCCESSFUL' && order.paidAt && (
        <div className="grid gap-1">
          <dt className="text-muted-foreground">{t('storeOrders.payment.paidAt')}</dt>
          <dd>
            <OrderDate value={order.paidAt} />
          </dd>
        </div>
      )}
    </dl>
  )
}
