# Đơn mua của tôi

Chu chép trọn các file dưới đây, sau đó thêm route, menu và i18n. CSS và test được trợ lý thêm trực tiếp. Backend giữ nguyên.

Contract đã kiểm tra: GET /api/v1/orders/me trả danh sách của người mua hiện tại; 404 ORDER_LIST_NOT_FOUND là lịch sử đơn rỗng. OrderResponse chứa snapshot sản phẩm và thông tin nhận hàng. Chi tiết tìm đơn trong danh sách tài khoản; không gọi GET /orders/{id} vì Backend còn B11. Đây là cách chọn dữ liệu cho UI, không thay thế việc Backend sửa kiểm tra quyền ở endpoint chi tiết.

## 1. src/services/orders/orderService.js

Tạo file mới đúng tên và thư mục.

```js
import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ signal?: AbortSignal }} [options] See doc14 section 5.7. */
export async function getMyOrders({ signal } = {}) {
  try {
    const response = await apiClient.get('/api/v1/orders/me', { signal })
    return unwrap(response)
  } catch (error) {
    if (error?.status === 404 && error.code === 'ORDER_LIST_NOT_FOUND') {
      return []
    }
    throw error
  }
}
```

## 2. src/features/orders/hooks/useMyOrders.js

Tạo file mới đúng tên và thư mục.

```js
import { skipToken, useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { getMyOrders } from '@/services/orders/orderService'

export function myOrdersQueryKey(userId) {
  return ['orders', 'mine', userId]
}

export function useMyOrders() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: myOrdersQueryKey(userId),
    queryFn: userId ? ({ signal }) => getMyOrders({ signal }) : skipToken,
    select: (orders) => orders.filter((order) => order.buyerId === userId),
    retry: false,
  })
}
```

## 3. src/features/orders/components/OrderStatusLabel.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'

const statusKeys = {
  PENDING_PAYMENT: 'orders.statuses.pendingPayment',
  CONFIRMED: 'orders.statuses.confirmed',
  SHIPPING: 'orders.statuses.shipping',
  DELIVERED: 'orders.statuses.delivered',
  COMPLETED: 'orders.statuses.completed',
  CANCELLED: 'orders.statuses.cancelled',
  EXPIRED: 'orders.statuses.expired',
  DISPUTED: 'orders.statuses.disputed',
  REFUNDED: 'orders.statuses.refunded',
}

/** @param {{ status: string }} props */
export function OrderStatusLabel({ status }) {
  const { t } = useTranslation()
  return <span className="order-status">{t(statusKeys[status] ?? 'orders.statuses.unknown')}</span>
}
```

## 4. src/features/orders/components/OrderDate.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'

/** @param {{ value?: string }} props */
export function OrderDate({ value }) {
  const { t, i18n } = useTranslation()
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return <span>{t('orders.dateUnknown')}</span>

  const formatted = new Intl.DateTimeFormat(i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)

  return <time dateTime={value}>{formatted}</time>
}
```

## 5. src/features/orders/components/OrderItems.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'

/** @param {{ items: Array<object> }} props */
export function OrderItems({ items }) {
  const { t } = useTranslation()

  return (
    <ul className="order-items" aria-label={t('orders.products')}>
      {items.map((item) => (
        <li key={item.id} className="order-item">
          <ImageWithFallback src={item.imageUrl} alt="" className="size-16 shrink-0 rounded-md" />
          <div className="grid min-w-0 gap-1">
            <p className="font-medium break-words">{item.productName}</p>
            <p className="text-sm text-muted-foreground">
              {t('orders.quantity', { count: item.quantity })}
            </p>
            <p className="text-sm">
              {t('orders.unitPrice')} <ProductPrice value={item.unitPrice} />
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

## 6. src/features/orders/pages/OrderListPage.jsx

Tạo file mới đúng tên và thư mục.

```jsx
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
```

## 7. src/features/orders/pages/OrderDetailPage.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { OrderItems } from '@/features/orders/components/OrderItems'
import { OrderStatusLabel } from '@/features/orders/components/OrderStatusLabel'
import { useMyOrders } from '@/features/orders/hooks/useMyOrders'

export function OrderDetailPage() {
  const { t } = useTranslation()
  const { orderId } = useParams()
  const query = useMyOrders()

  if (query.isPending) return <p role="status">{t('orders.loading')}</p>
  if (query.error?.status === 403) return <ForbiddenState />
  if (query.isError) {
    return (
      <ErrorState
        title={t('orders.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const order = query.data.find((item) => item.id === orderId)
  const backLink = (
    <Link to="/orders" className="underline underline-offset-4">
      {t('orders.backToOrders')}
    </Link>
  )

  if (!order) {
    return (
      <section className="orders-page">
        <h1>{t('orders.detailHeading')}</h1>
        <EmptyState
          title={t('orders.notFoundTitle')}
          description={t('orders.notFoundDescription')}
        />
        {backLink}
      </section>
    )
  }

  return (
    <section className="orders-page" aria-labelledby="order-detail-title">
      {backLink}
      <div className="order-heading">
        <div className="grid gap-2">
          <h1 id="order-detail-title">{t('orders.detailTitle', { code: order.orderCode })}</h1>
          <p className="text-sm text-muted-foreground">
            {t('orders.createdAt')} <OrderDate value={order.createdAt} />
          </p>
        </div>
        <OrderStatusLabel status={order.status} />
      </div>

      <div className="order-detail-grid">
        <section className="order-card" aria-labelledby="order-products-title">
          <h2 id="order-products-title">{t('orders.products')}</h2>
          <OrderItems items={order.items} />
          <div className="order-total">
            <p>{t('orders.total')}</p>
            <ProductPrice value={order.totalAmount} className="text-xl font-semibold" />
          </div>
          {order.shippingFee != null && (
            <p className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
              <span>{t('orders.shippingFee')}</span>
              <ProductPrice value={order.shippingFee} />
            </p>
          )}
        </section>

        <section className="order-card" aria-labelledby="order-delivery-title">
          <h2 id="order-delivery-title">{t('orders.deliveryTitle')}</h2>
          <dl className="order-delivery">
            <div>
              <dt>{t('orders.receiverName')}</dt>
              <dd>{order.receiverName}</dd>
            </div>
            <div>
              <dt>{t('orders.receiverPhone')}</dt>
              <dd>{order.receiverPhone}</dd>
            </div>
            <div>
              <dt>{t('orders.shippingAddress')}</dt>
              <dd>{order.shippingAddress}</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  )
}
```

## 8. Routes

Trong src/app/router/routes.js, thêm hai block này trong nhóm RequireAuth đang chứa cart và checkout, ngay trước route my-products:

```jsx
              {
                path: 'orders',
                lazy: async () => ({
                  Component: (await import('@/features/orders/pages/OrderListPage')).OrderListPage,
                }),
              },
              {
                path: 'orders/:orderId',
                lazy: async () => ({
                  Component: (await import('@/features/orders/pages/OrderDetailPage')).OrderDetailPage,
                }),
              },
```

## 9. Menu

Trong src/app/layouts/MainLayout.jsx, tìm dòng menu giỏ hàng trong visibleNavigation. Thêm ngay sau dòng đó:

```js
{ to: '/orders', label: 'orders.title' },
```

## 10. Nội dung vi

Thêm object orders sau đây vào cấp gốc của src/i18n/locales/vi/common.json, giữ nguyên các object khác. File phải có một object JSON gốc duy nhất: đưa key orders vào trong cặp ngoặc ngoài cùng và thêm dấu phẩy sau object cuối cũ. Không dán thêm một object mới sau dấu đóng cuối file:

```json
{
  "orders": {
    "title": "Đơn mua của tôi",
    "listLabel": "Danh sách đơn mua",
    "detailHeading": "Chi tiết đơn mua",
    "detailTitle": "Chi tiết đơn {{code}}",
    "backToOrders": "Quay lại đơn mua",
    "loading": "Đang tải đơn mua…",
    "loadError": "Chưa tải được đơn mua",
    "emptyTitle": "Chưa có đơn mua",
    "emptyDescription": "Các đơn đặt mua của bạn sẽ xuất hiện tại đây.",
    "browseProducts": "Khám phá sản phẩm",
    "createdAt": "Ngày tạo:",
    "dateUnknown": "Chưa có thông tin ngày tạo",
    "products": "Sản phẩm trong đơn",
    "quantity": "Số lượng: {{count}}",
    "unitPrice": "Đơn giá:",
    "total": "Tổng tiền đơn",
    "shippingFee": "Phí vận chuyển",
    "deliveryTitle": "Thông tin nhận hàng",
    "receiverName": "Người nhận",
    "receiverPhone": "Số điện thoại",
    "shippingAddress": "Địa chỉ nhận hàng",
    "notFoundTitle": "Không tìm thấy đơn của bạn",
    "notFoundDescription": "Đơn này không có trong danh sách đơn mua của tài khoản hiện tại.",
    "statuses": {
      "pendingPayment": "Chờ thanh toán",
      "confirmed": "Đã xác nhận",
      "shipping": "Đang giao hàng",
      "delivered": "Đã giao hàng",
      "completed": "Hoàn tất",
      "cancelled": "Đã hủy",
      "expired": "Đã hết hạn",
      "disputed": "Đang tranh chấp",
      "refunded": "Đã hoàn tiền",
      "unknown": "Đang cập nhật trạng thái"
    }
  }
}
```

## 11. Nội dung en

Thêm object orders sau đây vào cấp gốc của src/i18n/locales/en/common.json, giữ nguyên các object khác. File phải có một object JSON gốc duy nhất: đưa key orders vào trong cặp ngoặc ngoài cùng và thêm dấu phẩy sau object cuối cũ. Không dán thêm một object mới sau dấu đóng cuối file:

```json
{
  "orders": {
    "title": "My purchases",
    "listLabel": "Purchase orders",
    "detailHeading": "Purchase details",
    "detailTitle": "Order {{code}}",
    "backToOrders": "Back to purchases",
    "loading": "Loading purchases…",
    "loadError": "Unable to load purchases",
    "emptyTitle": "No purchases yet",
    "emptyDescription": "Your purchase orders will appear here.",
    "browseProducts": "Browse products",
    "createdAt": "Created:",
    "dateUnknown": "Creation date unavailable",
    "products": "Order products",
    "quantity": "Quantity: {{count}}",
    "unitPrice": "Unit price:",
    "total": "Order total",
    "shippingFee": "Shipping fee",
    "deliveryTitle": "Delivery information",
    "receiverName": "Recipient",
    "receiverPhone": "Phone number",
    "shippingAddress": "Shipping address",
    "notFoundTitle": "Your order was not found",
    "notFoundDescription": "This order is not in the purchase history of the current account.",
    "statuses": {
      "pendingPayment": "Awaiting payment",
      "confirmed": "Confirmed",
      "shipping": "Shipping",
      "delivered": "Delivered",
      "completed": "Completed",
      "cancelled": "Cancelled",
      "expired": "Expired",
      "disputed": "Disputed",
      "refunded": "Refunded",
      "unknown": "Status updating"
    }
  }
}
```

## Đọc logic

- orderService chỉ gọi API danh sách hiện có. Chỉ 404 ORDER_LIST_NOT_FOUND mới được đổi thành mảng rỗng; lỗi mạng, 403, 500 hoặc 404 khác vẫn báo lỗi.
- useMyOrders dùng query key có userId, không trộn cache giữa tài khoản. Dữ liệu hiển thị được lọc thêm theo buyerId của session.
- OrderListPage hiển thị snapshot sản phẩm, trạng thái và tổng tiền Backend trả. Không gọi API product để dựng lại lịch sử hoặc tự cộng lại tổng tiền.
- OrderDetailPage đọc orderId từ route rồi tìm trong danh sách hiện tại. Không có đơn thì hiện thông báo không tìm thấy, không gọi endpoint chi tiết đang thiếu kiểm tra chủ đơn.
- OrderDate dùng thời gian của đơn và ngôn ngữ hiện tại; không bịa ngày nếu thiếu dữ liệu.
- OrderStatusLabel hiển thị trạng thái Backend trả, có nhánh dự phòng cho trạng thái chưa biết. Không suy luận paymentStatus từ order status và không dựng timeline giả.
- Không có thao tác hủy, xác nhận đã nhận hoặc cập nhật trạng thái vì contract các thao tác đó chưa thống nhất.

## Kết quả kiểm tra repo chính

Chu đã chép đủ source, route, menu và i18n. Trợ lý sửa thư mục service order thành orders, bổ sung content bị sót, sửa return xuống dòng, CONFIRMED, class và aria-labelledby, đồng thời gộp i18n thành một object JSON gốc. Đã thêm regression cho CONFIRMED và tên vùng thông tin nhận hàng. Hai test checkout cũ được sửa để chờ router kết thúc lazy loading trước khi kiểm tra nội dung. Format, lint, build và 272/272 test pass trên repo chính. HTTP/giao diện với Backend thật vẫn chờ Chu xác nhận.

## Kiểm tra sau khi chép

1. Đăng nhập, mở Đơn mua của tôi. Chưa có đơn thì thấy trạng thái rỗng và nút khám phá sản phẩm.
2. Có đơn thì xem được sản phẩm snapshot, ngày tạo, trạng thái và tổng tiền.
3. Bấm mã đơn để xem thông tin nhận hàng; tải lại trang chi tiết vẫn tải từ danh sách của tài khoản hiện tại.
4. Đổi URL sang ID không thuộc danh sách: không hiện thông tin đơn.
5. Khi Backend tắt, trang báo lỗi và có nút thử lại.

Nếu chưa có order do checkout chưa nối, trạng thái rỗng là kết quả đúng. Test dùng fixture ở ranh giới service; giao diện chạy thật không có đơn mẫu.
