import { useTranslation } from 'react-i18next'
import { ProductPrice } from '@/components/common/ProductPrice'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { ConfirmStoreOrderButton } from '@/features/orders/components/ConfirmStoreOrderButton'
import { StoreOrderProgress } from '@/features/orders/components/StoreOrderProgress'
import { StoreOrderPayment } from '@/features/orders/components/StoreOrderPayment'

/** @param {{ order: object, mutation: object, canConfirm: boolean, disabled?: boolean }} props */
export function StoreOrderCard({ order, mutation, canConfirm, disabled }) {
  const { t } = useTranslation()
  return (
    <article className="order-card" aria-labelledby={'store-order-' + order.id}>
      <div className="order-heading">
        <div className="grid gap-2">
          <h2 id={'store-order-' + order.id}>{order.orderCode}</h2>
          <p className="text-sm text-muted-foreground">
            {t('orders.createdAt')} <OrderDate value={order.createdAt} />
          </p>
        </div>
        <OrderStatusLabel status={order.status} />
      </div>
      <StoreOrderPayment order={order} />
      <StoreOrderProgress order={order} canConfirm={canConfirm} />
      <details className="store-order-details">
        <summary>{t('storeOrders.details')}</summary>
        <div className="grid gap-5 pt-5">
          <OrderItems items={order.items} />
          <section className="order-delivery" aria-label={t('checkout.deliveryTitle')}>
            <h3>{t('checkout.deliveryTitle')}</h3>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('checkout.receiverName')}</dt>
                <dd className="break-words">{order.receiverName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('checkout.phoneNumber')}</dt>
                <dd>{order.receiverPhone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('checkout.shippingAddress')}</dt>
                <dd className="whitespace-pre-wrap break-words">{order.shippingAddress}</dd>
              </div>
            </dl>
          </section>
        </div>
      </details>
      <div className="order-total">
        <div>
          <p className="text-sm text-muted-foreground">{t('orders.total')}</p>
          <ProductPrice value={order.totalAmount} className="text-xl font-semibold" />
        </div>
        <ConfirmStoreOrderButton
          order={order}
          mutation={mutation}
          canConfirm={canConfirm}
          disabled={disabled}
        />
      </div>
    </article>
  )
}
