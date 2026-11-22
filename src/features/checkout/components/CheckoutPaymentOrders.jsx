import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ProductPrice } from '@/components/common/ProductPrice'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'

/** @param {{ orders: object[] }} props */
export function CheckoutPaymentOrders({ orders = [] }) {
  const { t } = useTranslation()
  return (
    <section className="grid gap-4" aria-labelledby="checkout-payment-orders">
      <h2 id="checkout-payment-orders">{t('checkoutPayment.orders')}</h2>
      {orders.length === 0 ? (
        <p>{t('checkoutPayment.noOrders')}</p>
      ) : (
        orders.map((order, index) => (
          <article className="order-card" key={order.id}>
            <div className="order-heading">
              <h3>
                <Link
                  className="underline underline-offset-4"
                  to={'/orders/' + encodeURIComponent(order.id)}
                >
                  {order.orderCode || t('checkoutPayment.orderNumber', { number: index + 1 })}
                </Link>
              </h3>
              <OrderStatusLabel status={order.status} />
            </div>
            <OrderItems items={order.items} />
            <div className="order-total">
              <span>{t('orders.total')}</span>
              <ProductPrice value={order.totalAmount} />
            </div>
          </article>
        ))
      )}
    </section>
  )
}
