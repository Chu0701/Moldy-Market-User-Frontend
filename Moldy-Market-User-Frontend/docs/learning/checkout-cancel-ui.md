# Hủy checkout chuyển khoản chưa thanh toán

Trạng thái sau khi Chu chép: Kiểm chứng repo chính ngày 2026-11-21: format check, lint, build và 362/362 tests trong 41 file pass sau khi sửa lỗi chép. Chu xác nhận ngày 2026-11-21 đã thử hủy checkout với Backend thật từ UI thành công: hủy các đơn trong checkout, ẩn QR, giữ giỏ, reload giữ trạng thái và có thể đặt lại. INTEGRATED_LOCAL cho hủy online chưa thanh toán; không bao gồm refund hoặc hủy COD. Đã sửa URL thiếu / sau buyer, key stateChanged và chuyển checkoutCancel tiếng Việt về root JSON.

Chu đã duyệt flow ngày 2026-11-20. Chép đủ một lượt theo thứ tự dưới đây, sau đó báo “xong” để kiểm tra repo chính. Trợ lý đã thêm tests; không cần chép tests. Dùng class/token có sẵn, không cần CSS mới.

## Flow và contract

POST /api/v1/orders/buyer/{orderId}/cancel không có body, trả OrderResponse. Backend hủy một order online chưa thanh toán sẽ hủy mọi order trong checkout chung QR, payment FAILED, group CANCELLED, giải phóng giữ hàng và giữ nguyên giỏ. Chỉ gọi POST một lần. Response order không phải checkout snapshot; phải GET lại checkout để biết kết quả cuối cùng.

Backend là nơi quyết định quyền, trạng thái và cuộc đua với webhook thanh toán. UI không hủy COD theo cả group, không tự refund và không coi đồng hồ client là điều kiện quyết định. Nếu payment vừa thành công, server có thể từ chối hủy bằng INVALID_ORDER_STATE; UI đọc lại và hiển thị trạng thái thực tế.

## Source để chép

Các đường dẫn src/ tính từ root User frontend, không tạo bên trong docs. Tạo các thư mục còn thiếu.

### 1. src/services/orders/cancelOrderService.js

Tạo file mới. Service chỉ gọi endpoint hủy order của buyer đã có. Một order online chưa trả tiền đại diện cho việc hủy cả checkout chung QR; không lặp POST cho từng đơn.

```js
import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ orderId: string }} input See doc14 section 5.7.2. */
export async function cancelMyOrder({ orderId }) {
  const response = await apiClient.post(
    '/api/v1/orders/buyer/' + encodeURIComponent(orderId) + '/cancel',
  )
  return unwrap(response)
}
```

### 2. src/features/checkout/cancelCheckout.js

Tạo file mới. Hàm thuần kiểm tra snapshot: đúng buyer, đúng checkout, ONLINE_BANKING, payment PENDING và mọi order PENDING_PAYMENT. PROCESSING, COD, đã trả tiền hoặc snapshot thiếu dữ liệu không được hủy bằng nút này.

```js
import { isAmbiguousCheckoutError } from '@/features/checkout/checkoutPayment'

export function getCancellableCheckoutOrder(checkout, userId) {
  if (
    !userId ||
    !checkout?.id ||
    checkout.status !== 'PENDING_PAYMENT' ||
    checkout.paymentResponse?.method !== 'ONLINE_BANKING' ||
    checkout.paymentResponse.paymentStatus !== 'PENDING' ||
    !checkout.orders?.length ||
    checkout.orders.some(
      (order) =>
        !order.id ||
        order.buyerId !== userId ||
        order.checkoutGroupId !== checkout.id ||
        order.status !== 'PENDING_PAYMENT',
    )
  )
    return null
  return checkout.orders[0].id
}

export function getCancelCheckoutErrorKey(error) {
  if (isAmbiguousCheckoutError(error)) return 'checkoutCancel.uncertain'
  if (error?.code === 'INVALID_ORDER_STATE') return 'checkoutCancel.stateChanged'
  if ([403, 404].includes(error?.status)) return 'checkoutCancel.unavailable'
  return 'checkoutCancel.error'
}
```

### 3. src/features/checkout/hooks/useCancelCheckout.js

Tạo file mới. Trước POST đọc lại cache, hủy GET đang chạy để hạn chế snapshot cũ ghi đè. actorId và targetId được chụp vào variables: response của phiên cũ không invalidate dữ liệu tài khoản mới. Sau thành công hoặc lỗi, đọc lại checkout/cart/orders và đánh dấu các chi tiết sản phẩm liên quan cần cập nhật. Không tự đổi trạng thái hoặc xóa giỏ.

```js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQueryKey, useSession } from '@/features/auth/hooks/useSession'
import { cartQueryKey } from '@/features/cart/hooks/useCart'
import { getCancellableCheckoutOrder } from '@/features/checkout/cancelCheckout'
import { checkoutKey } from '@/features/checkout/hooks/useCheckout'
import { myOrdersQueryKey } from '@/features/orders/hooks/useMyOrders'
import { productKeys } from '@/features/products/hooks/useProductSearch'
import { getAccessToken } from '@/lib/tokenStorage'
import { ApiError } from '@/services/api/ApiError'
import { cancelMyOrder } from '@/services/orders/cancelOrderService'

export function useCancelCheckout(checkoutId) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const queryClient = useQueryClient()
  const isCurrent = (actorId) =>
    Boolean(getAccessToken() && actorId && queryClient.getQueryData(meQueryKey)?.id === actorId)
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ actorId, targetId }) => {
      if (!isCurrent(actorId)) return null
      const key = checkoutKey(actorId, targetId)
      const snapshot = queryClient.getQueryData(key)
      const orderId = getCancellableCheckoutOrder(snapshot, actorId)
      if (!orderId)
        throw new ApiError({
          status: 400,
          code: 'INVALID_ORDER_STATE',
          message: 'Checkout state changed',
        })
      await queryClient.cancelQueries({ queryKey: key, exact: true })
      if (!isCurrent(actorId)) return null
      return cancelMyOrder({ orderId })
    },
    onSettled: async (_data, _error, { actorId, targetId }) => {
      if (!isCurrent(actorId)) return
      const key = checkoutKey(actorId, targetId)
      const snapshot = queryClient.getQueryData(key)
      const ids = [
        ...new Set(
          snapshot?.orders?.flatMap((order) => order.items?.map((item) => item.productId) ?? []) ??
            [],
        ),
      ].filter(Boolean)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key, exact: true }),
        queryClient.invalidateQueries({ queryKey: cartQueryKey(actorId), exact: true }),
        queryClient.invalidateQueries({ queryKey: myOrdersQueryKey(actorId), exact: true }),
        ...ids.map((id) =>
          queryClient.invalidateQueries({ queryKey: productKeys.detail(id), exact: true }),
        ),
      ])
    },
  })
  return {
    ...mutation,
    userId,
    mutateAsync: () => mutation.mutateAsync({ actorId: userId, targetId: checkoutId }),
  }
}
```

### 4. src/features/checkout/components/CancelCheckoutButton.jsx

Tạo file mới. Dùng window.confirm như nút xóa sản phẩm hiện tại; nêu rõ hủy mọi đơn, trả reservation và giữ giỏ. useRef khóa thao tác ngay để chặn bấm đúp; nút chờ đến khi mutation và các query cập nhật xong.

```jsx
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  getCancellableCheckoutOrder,
  getCancelCheckoutErrorKey,
} from '@/features/checkout/cancelCheckout'

/** @param {{ checkout: object, mutation: object, disabled?: boolean }} props */
export function CancelCheckoutButton({ checkout, mutation, disabled = false }) {
  const { t } = useTranslation()
  const locked = useRef(false)
  const orderId = getCancellableCheckoutOrder(checkout, mutation.userId)
  if (!orderId && !mutation.error) return null

  async function confirmCancel() {
    if (locked.current || disabled || mutation.isPending || !orderId) return
    if (!window.confirm(t('checkoutCancel.confirm', { count: checkout.orders.length }))) return
    locked.current = true
    try {
      await mutation.mutateAsync()
    } catch {
      // The mutation exposes a translated error and refetches the canonical state.
    } finally {
      locked.current = false
    }
  }

  return (
    <div className="grid justify-items-start gap-3">
      {orderId && (
        <>
          <p className="text-sm text-muted-foreground">{t('checkoutCancel.hint')}</p>
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || mutation.isPending}
            onClick={() => void confirmCancel()}
          >
            {t(mutation.isPending ? 'checkoutCancel.pending' : 'checkoutCancel.action')}
          </Button>
        </>
      )}
      {mutation.error && (
        <p role="alert" className="checkout-error">
          {t(getCancelCheckoutErrorKey(mutation.error))}
        </p>
      )}
    </div>
  )
}
```

### 5. src/features/checkout/pages/CheckoutPaymentPage.jsx

Thay toàn bộ file hiện có. Page dùng hook hủy, gắn nút và ẩn QR khi đang hủy hoặc kết quả chưa rõ. Nút cập nhật chỉ reset thông báo mutation sau khi GET thành công.

```jsx
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { getCheckoutStage } from '@/features/checkout/checkoutPayment'
import { isAmbiguousCheckoutError } from '@/features/checkout/checkoutPayment'
import { CancelCheckoutButton } from '@/features/checkout/components/CancelCheckoutButton'
import { useCancelCheckout } from '@/features/checkout/hooks/useCancelCheckout'
import { CheckoutPaymentOrders } from '@/features/checkout/components/CheckoutPaymentOrders'
import { CheckoutPaymentStatus } from '@/features/checkout/components/CheckoutPaymentStatus'
import { useCheckout } from '@/features/checkout/hooks/useCheckout'

export function CheckoutPaymentPage() {
  const { checkoutGroupId } = useParams()
  const { t } = useTranslation()
  const query = useCheckout(checkoutGroupId)
  const cancel = useCancelCheckout(checkoutGroupId)
  if (query.isPending) return <p role="status">{t('checkoutPayment.loading')}</p>
  if (query.error?.status === 403) return <ForbiddenState />
  if (query.error?.status === 404)
    return (
      <EmptyState
        title={t('checkoutPayment.notFound')}
        description={t('checkoutPayment.notFoundDescription')}
      />
    )
  if (query.isError && !query.data)
    return (
      <ErrorState
        title={t('checkoutPayment.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )

  const checkout = query.data
  const stage = getCheckoutStage(checkout)
  return (
    <section className="checkout-page" aria-labelledby="checkout-payment-title">
      <div className="order-heading">
        <h1 id="checkout-payment-title">{t('checkoutPayment.title')}</h1>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const result = await query.refetch()
            if (!result.isError) cancel.reset()
          }}
          disabled={query.isFetching || cancel.isPending}
        >
          {t('checkoutPayment.refresh')}
        </Button>
      </div>
      {query.isRefetchError && (
        <p role="alert" className="checkout-notice">
          {t('checkoutPayment.refreshError')}
        </p>
      )}
      <div className="checkout-grid">
        <div className="grid content-start gap-4">
          <CheckoutPaymentStatus
            checkout={checkout}
            stage={stage}
            allowQr={
              !query.isError &&
              !cancel.isPending &&
              !cancel.isSuccess &&
              !isAmbiguousCheckoutError(cancel.error)
            }
          />
          <CancelCheckoutButton
            checkout={checkout}
            mutation={cancel}
            disabled={
              query.isError ||
              query.isFetching ||
              cancel.isSuccess ||
              isAmbiguousCheckoutError(cancel.error)
            }
          />
        </div>
        <aside className="checkout-panel" aria-labelledby="checkout-payment-total">
          <h2 id="checkout-payment-total">{t('checkoutPayment.total')}</h2>
          <ProductPrice value={checkout.totalAmount} className="text-2xl font-semibold" />
          <p>
            {t('checkoutPayment.method')}:{' '}
            {['COD', 'ONLINE_BANKING'].includes(checkout.paymentResponse?.method)
              ? t('checkout.methods.' + checkout.paymentResponse.method)
              : t('checkoutPayment.unknownMethod')}
          </p>
          <p className="text-sm text-muted-foreground">{t('checkoutPayment.serverAmount')}</p>
          <div className="grid justify-items-start gap-3">
            <Link to="/orders" className="underline underline-offset-4">
              {t('checkoutPayment.viewOrders')}
            </Link>
            <Link to="/cart" className="underline underline-offset-4">
              {t('checkout.backToCart')}
            </Link>
          </div>
        </aside>
      </div>
      <CheckoutPaymentOrders orders={checkout.orders} />
    </section>
  )
}
```

## 6. i18n

Trong mỗi common.json, thêm checkoutCancel ở ROOT, cùng cấp với checkoutPayment và orders. Ghép key vào JSON hiện có; không thay cả file và không đặt bên trong checkoutPayment.

### src/i18n/locales/vi/common.json

```json
{
  "checkoutCancel": {
    "action": "Hủy checkout",
    "pending": "Đang hủy…",
    "hint": "Hủy sẽ áp dụng cho mọi đơn trong lần đặt hàng này. Sản phẩm vẫn được giữ trong giỏ.",
    "confirm": "Hủy toàn bộ checkout gồm {{count}} đơn? Mọi đơn trong checkout sẽ bị hủy, sản phẩm được trả giữ hàng và giỏ hàng giữ nguyên.",
    "stateChanged": "Trạng thái đã thay đổi nên không thể hủy. Hãy kiểm tra trạng thái thanh toán và đơn mua mới nhất.",
    "uncertain": "Chưa xác định kết quả hủy. Hãy cập nhật trạng thái trước khi thử lại hoặc chuyển khoản.",
    "unavailable": "Không tìm thấy đơn có thể hủy hoặc bạn không có quyền. Hãy kiểm tra Đơn mua.",
    "error": "Chưa hủy được checkout. Hãy cập nhật trạng thái và thử lại."
  }
}
```

### src/i18n/locales/en/common.json

```json
{
  "checkoutCancel": {
    "action": "Cancel checkout",
    "pending": "Cancelling…",
    "hint": "Cancellation applies to every order in this checkout. Products remain in your cart.",
    "confirm": "Cancel this entire checkout with {{count}} orders? All its orders will be cancelled, reservations released, and your cart preserved.",
    "stateChanged": "The status has changed and cancellation is unavailable. Check the latest payment and order status.",
    "uncertain": "The cancellation outcome is unknown. Refresh the status before trying again or transferring money.",
    "unavailable": "The order is unavailable or you do not have permission. Check your orders.",
    "error": "Could not cancel this checkout. Refresh the status and try again."
  }
}
```

## Kiểm tra sau khi chép

1. Chạy npm run format, npm run lint, npm run test, npm run build. Các tests mới chờ những file logic bên trên; không xóa hoặc skip nếu chưa chép đủ.
2. Tạo checkout ONLINE_BANKING mới chưa thanh toán; xem nút Hủy checkout. Bấm rồi chọn Không trong hộp xác nhận: không có POST và QR vẫn còn.
3. Bấm lại rồi xác nhận. Chỉ có một POST hủy; QR ẩn trong khi xử lý. GET checkout trả CANCELLED, payment FAILED và mọi order CANCELLED. Giỏ vẫn giữ các món.
4. Reload để xác nhận trạng thái đã hủy được lưu. Quay lại giỏ và đặt lại: Backend đã giải phóng reservation nên sản phẩm có thể được giữ cho checkout mới.
5. Checkout COD, đã thanh toán, hết hạn hoặc đang PROCESSING không có nút hủy checkout. Không suy ra COD đã có nút hủy từng đơn.

## Những điểm cần đọc để học

- getCancellableCheckoutOrder là điều kiện hiển thị và kiểm tra lại trước POST; Backend vẫn kiểm tra độc lập.
- onSettled chạy cả khi request lỗi, vì mạng lỗi có thể che một thao tác đã thành công. Mutation retry:false không tự gửi lại POST.
- invalidateQueries yêu cầu tải dữ liệu server; không có optimistic CANCELLED hoặc DELETE cart.
- Hộp xác nhận và khóa bấm đúp bảo vệ thao tác trên cả checkout nhiều đơn.
- POST thành công nhưng GET lỗi: chưa đủ cơ sở vẽ trạng thái cancelled; QR vẫn bị ẩn cho tới khi đọc lại được trạng thái.
- Nếu logout/đổi buyer lúc request còn chạy, guard theo actorId không phục hồi cache hoặc invalidate tài khoản khác.

## Giới hạn kiểm chứng

Bản review ngày 2026-11-20: format check, lint, production build và 362/362 tests trong 41 file pass, gồm 25 test mới của task hủy. Đã đối chiếu 5 block source với file được test và parse 2 block JSON hợp lệ. Chưa đánh dấu tích hợp HTTP hủy thành công; cần Chu chép rồi kiểm tra repo chính và thao tác thật trên Backend local.

Code được kiểm tra trong bản review riêng với cùng dependencies. CSS/token và API hiện có được tái sử dụng; không sửa Backend hoặc route. Repo chính đã có source logic/JSX/i18n sau khi Chu chép và được sửa lỗi chép. Chu xác nhận ngày 2026-11-21 đã thử hủy checkout với Backend thật từ UI thành công: hủy các đơn trong checkout, ẩn QR, giữ giỏ, reload giữ trạng thái và có thể đặt lại. INTEGRATED_LOCAL cho hủy online chưa thanh toán; không bao gồm refund hoặc hủy COD. Các tests mô phỏng tại service boundary không chứng minh ngân hàng Live hoặc refund đã hoạt động.
