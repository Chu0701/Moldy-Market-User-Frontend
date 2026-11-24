import { useTranslation } from 'react-i18next'

import { OrderDate } from '@/features/orders/components/OrderDate'

const milestoneFields = [
  'createdAt',
  'confirmedAt',
  'shippedAt',
  'deliveredAt',
  'completedAt',
  'cancelledAt',
]

/** @param {{ order: object }} props */
export function BuyerOrderTimeline({ order }) {
  const { t } = useTranslation()
  const milestones = milestoneFields
    .filter(
      (field) =>
        typeof order?.[field] === 'string' &&
        order[field] &&
        Number.isFinite(Date.parse(order[field])),
    )
    .sort((left, right) => Date.parse(order[left]) - Date.parse(order[right]))

  return (
    <section className="order-card" aria-labelledby="order-timeline-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="order-timeline-title">{t('orders.timeline.title')}</h2>
        {order?.paymentMethod && (
          <span className="text-sm text-muted-foreground">
            {t('checkout.methods.' + order.paymentMethod, {
              defaultValue: order.paymentMethod,
            })}
            {order.paymentStatus
              ? ' • ' +
                t('transactions.status.' + order.paymentStatus, {
                  defaultValue: order.paymentStatus,
                })
              : ''}
          </span>
        )}
      </div>

      {milestones.length > 0 ? (
        <ol
          className="mt-2 grid gap-3 border-l-2 border-border pl-4 text-sm"
          aria-label={t('orders.timeline.listLabel')}
        >
          {milestones.map((field) => (
            <li key={field} className="grid gap-1 sm:flex sm:items-center sm:justify-between">
              <span className="font-medium">{t('storeOrders.progress.milestones.' + field)}</span>
              <span className="text-muted-foreground">
                <OrderDate value={order[field]} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{t('orders.timeline.empty')}</p>
      )}
    </section>
  )
}
