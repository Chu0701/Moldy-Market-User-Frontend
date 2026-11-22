import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { useMyOrders } from '@/features/orders/hooks/useMyOrders'

export function OrderListPage() {
  const { t } = useTranslation()
  const query = useMyOrders()
  let content

  if (query.isPending) {
    content = <p role="status">{t('orders.loading')}</p>
  } else if (query.error?.status === 403) {
    content = <ForbiddenState />
  } else if (query.isError) {
    content = (
      <ErrorState
        title={t('orders.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  } else if (query.data.length === 0) {
    content = (
      <div className="grid justify-items-start gap-4">
        <EmptyState title={t('orders.emptyTitle')} description={t('orders.emptyDescription')} />
        <Button asChild>
          <Link to="/products">{t('orders.browseProducts')}</Link>
        </Button>
      </div>
    )
  } else {
    content = (
      <ul className="order-list" aria-label={t('orders.listLabel')}>
        {query.data.map((order) => (
          <li key={order.id}>
            <article className="order-card" aria-labelledby={'order-' + order.id}>
              <div className="order-heading">
                <div className="grid gap-2">
                  <h2 id={'order-' + order.id}>
                    <Link
                      to={'/orders/' + encodeURIComponent(order.id)}
                      className="underline underline-offset-4"
                    >
                      {order.orderCode}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('orders.createdAt')} <OrderDate value={order.createdAt} />
                  </p>
                </div>
                <OrderStatusLabel status={order.status} />
              </div>
              <OrderItems items={order.items} />
              <div className="order-total">
                <p>{t('orders.total')}</p>
                <ProductPrice value={order.totalAmount} className="text-xl font-semibold" />
              </div>
            </article>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="orders-page" aria-labelledby="orders-title">
      <h1 id="orders-title">{t('orders.title')}</h1>
      {content}
    </section>
  )
}
