import { useTranslation } from 'react-i18next'
import { OrderDate } from '@/features/orders/components/OrderDate'

const hintKeys = {
  PENDING_PAYMENT: 'pendingPayment',
  CONFIRMED: 'confirmed',
  SHIPPING: 'shipping',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded',
}
const milestoneFields = [
  'createdAt',
  'confirmedAt',
  'shippedAt',
  'deliveredAt',
  'completedAt',
  'cancelledAt',
]

/** @param {{ order: object, canConfirm?: boolean }} props */
export function StoreOrderProgress({ order, canConfirm = false }) {
  const { t } = useTranslation()
  let hint = Object.hasOwn(hintKeys, order.status) ? hintKeys[order.status] : 'unknown'
  if (order.status === 'PENDING_CONFIRMED') {
    hint =
      order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING'
        ? canConfirm
          ? 'pendingOwner'
          : 'pendingStaff'
        : 'paymentUnavailable'
  }
  // Only actual Backend timestamps count as history; status alone does not prove a past step.
  const milestones = milestoneFields
    .filter(
      (field) =>
        typeof order[field] === 'string' &&
        order[field] &&
        Number.isFinite(Date.parse(order[field])),
    )
    .sort((left, right) => Date.parse(order[left]) - Date.parse(order[right]))

  return (
    <section
      className="grid gap-3 rounded-lg bg-accent/40 p-4"
      aria-labelledby={'store-order-progress-' + order.id}
    >
      <h3 id={'store-order-progress-' + order.id} className="text-base font-semibold">
        {t('storeOrders.progress.title')}
      </h3>
      <p className="text-sm leading-6 text-muted-foreground">
        {t('storeOrders.progress.hints.' + hint)}
      </p>
      {milestones.length > 0 ? (
        <details className="group border-0 bg-transparent p-0 shadow-none">
          <summary className="cursor-pointer list-none rounded-sm border-0 bg-transparent text-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {t('storeOrders.progress.history')}
          </summary>
          <ol
            className="mt-4 grid gap-3 border-l border-border pl-4 text-sm"
            aria-label={t('storeOrders.progress.listLabel')}
          >
            {milestones.map((field) => (
              <li key={field} className="grid gap-1 sm:flex sm:justify-between sm:gap-4">
                <span>{t('storeOrders.progress.milestones.' + field)}</span>
                <span className="text-muted-foreground">
                  <OrderDate value={order[field]} />
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : (
        <p className="text-sm text-muted-foreground">{t('storeOrders.progress.noHistory')}</p>
      )}
    </section>
  )
}
