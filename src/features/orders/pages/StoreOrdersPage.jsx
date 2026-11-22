import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PaginationBar } from '@/components/common/PaginationBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { StoreOrderCard } from '@/features/orders/components/StoreOrderCard'
import { getOrderStatusKey, orderStatuses } from '@/features/orders/orderStatus'
import { getStoreOrderConfirmErrorKey } from '@/features/orders/storeOrdersState'
import { useStoreOrders } from '@/features/orders/hooks/useStoreOrders'
import { useConfirmStoreOrder } from '@/features/orders/hooks/useConfirmStoreOrder'

export function StoreOrdersPage() {
  const { t } = useTranslation()
  const state = useStoreOrders()
  const { userId, profileQuery, ownerQuery, staffQuery, access, params, query, queryKey } = state
  const accessQuery = access.kind === 'staff' ? staffQuery : ownerQuery
  const confirmation = useConfirmStoreOrder({ userId, storeId: access.storeId, queryKey })
  async function refresh() {
    const result = await query.refetch()
    if (!result.isError) confirmation.reset()
  }
  if (profileQuery.isPending || (['owner', 'staff'].includes(access.kind) && accessQuery.isPending))
    return <p role="status">{t('storeOrders.loading')}</p>
  if (['owner', 'staff'].includes(access.kind) && accessQuery.isError) {
    return [403, 404].includes(accessQuery.error?.status) ? (
      <ForbiddenState />
    ) : (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void accessQuery.refetch()}
        isRetrying={accessQuery.isFetching}
      />
    )
  }
  if (access.kind === 'owner' && ownerQuery.data === null)
    return (
      <div className="orders-page">
        <EmptyState
          title={t('storeOrders.noStore')}
          description={t('storeOrders.noStoreDescription')}
        />
        <Link to="/open-store" className="underline underline-offset-4">
          {t('stores.open.title')}
        </Link>
      </div>
    )
  if (!access.canRead || [403, 404].includes(query.error?.status)) return <ForbiddenState />
  if (!params.valid)
    return (
      <section className="orders-page">
        <EmptyState
          title={t('storeOrders.invalidFilters')}
          description={t('storeOrders.invalidFiltersDescription')}
        />
        <Link to="/store/orders" className="underline underline-offset-4">
          {t('storeOrders.resetFilters')}
        </Link>
      </section>
    )

  let content
  if (query.isPending) content = <p role="status">{t('storeOrders.loading')}</p>
  else if (query.isError)
    content = (
      <ErrorState
        title={t('storeOrders.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void refresh()}
        isRetrying={query.isFetching}
      />
    )
  else if (query.data.items.length === 0)
    content = (
      <EmptyState title={t('storeOrders.empty')} description={t('storeOrders.emptyDescription')} />
    )
  else
    content = (
      <ul className="order-list" aria-label={t('storeOrders.listLabel')}>
        {query.data.items.map((order) => (
          <li key={order.id}>
            <StoreOrderCard
              order={order}
              mutation={confirmation}
              canConfirm={access.canConfirm}
              disabled={query.isFetching}
            />
          </li>
        ))}
      </ul>
    )

  return (
    <section className="orders-page" aria-labelledby="store-orders-title">
      <header className="order-heading">
        <div className="grid gap-2">
          <h1 id="store-orders-title">{t('storeOrders.title')}</h1>
          <Link to="/store" className="underline underline-offset-4">
            {t('storeOrders.back')}
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => void refresh()}
          disabled={query.isFetching || confirmation.isPending}
        >
          {t('storeOrders.refresh')}
        </Button>
      </header>
      <div className="store-order-toolbar">
        <label htmlFor="store-order-status">{t('storeOrders.status')}</label>
        <select
          id="store-order-status"
          value={params.status}
          disabled={query.isFetching || confirmation.isPending}
          onChange={(event) => state.changeStatus(event.target.value)}
        >
          <option value="">{t('storeOrders.allStatuses')}</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {t(getOrderStatusKey(status))}
            </option>
          ))}
        </select>
        <p>{t('storeOrders.paymentHint')}</p>
      </div>
      {confirmation.error && (
        <p role="alert" className="checkout-error">
          {t(getStoreOrderConfirmErrorKey(confirmation.error))}
        </p>
      )}
      {content}
      {query.isSuccess && (query.data.page > 1 || query.data.hasNext) && (
        <PaginationBar
          page={query.data.page}
          hasNext={query.data.hasNext}
          totalElements={query.data.totalElements}
          disabled={query.isFetching || confirmation.isPending}
          onPageChange={state.changePage}
        />
      )}
    </section>
  )
}
