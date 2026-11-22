# Bổ sung thông tin thanh toán vào OrderResponse — code để Chu chép

Ngày 22/11/2026. Trạng thái: IMPLEMENTED_LOCAL — Chu đã chép đủ 6 file. Assistant đối chiếu và tự cập nhật/add tests; không sửa source Java ứng dụng trong lượt kiểm tra. Full Maven verify/package pass 329 tests: 328 pass, 1 disabled có sẵn. Có 8 assembler tests và 2 HTTP tests mới; Frontend đã nối metadata sau khi Backend được xác minh, chờ Chu kiểm thử UI.

## 1. Mục tiêu và ý nghĩa

API trả thêm ba field trên mỗi OrderResponse:

- paymentMethod: COD hoặc ONLINE_BANKING, lấy từ Payment của checkout chứa đơn. Thiếu payment ở dữ liệu cũ: null/không có, không mặc định COD.
- paymentStatus: trạng thái thu tiền của ĐƠN, không phải bản sao mù quáng của payment chung. Dùng enum đang có PENDING, PROCESSING, SUCCESSFUL, FAILED.
- paidAt: timestamp thu tiền của chính Order, không lấy paidAt chung của checkout.

Ví dụ checkout COD có đơn A và B: A đã giao và Admin thu tiền, B chưa thu. Payment chung còn PENDING nhưng API A phải là SUCCESSFUL với paidAt riêng; B vẫn PENDING. Đơn COD hủy trước thu tiền trả FAILED (không còn thu tiền đơn đó), không phải đã refund. Online dùng trạng thái Payment chung khi chưa có paidAt của Order; đã có paidAt thì xác nhận server đã thu tiền.

paymentStatus ở đây mô tả ghi nhận thu tiền, không thay thế order.status hay trạng thái refund/escrow. Không dựng trạng thái từ CONFIRMED, SHIPPING, DELIVERED hoặc COMPLETED. Không gửi QR, tài khoản ngân hàng, paymentCode hay Payment entity ra đơn gian hàng.

## 2. Cách áp dụng

Chép đủ 6 file bên dưới vào đúng đường dẫn tương đối với Backend src/main/java/com/moldy/moldymarket/. Trong IntelliJ có thể tạm báo lỗi giữa lúc mới chép một vài file; build sau khi đã chép đủ. File assembler là file mới, các file còn lại thay nội dung hiện tại. Không thay controller/permission, không chạy migration DB, không sửa notification hoặc credentials.

File được tạo từ source local ngày 22/11. Nếu bạn cùng nhóm vừa sửa một trong các file này, đối chiếu diff trước, không ghi đè thay đổi mới của bạn ấy.

## 3. Các file đầy đủ

### order/dto/response/OrderResponse.java

```java
package com.moldy.moldymarket.order.dto.response;

import com.moldy.moldymarket.order.enums.OrderStatus;
import com.moldy.moldymarket.payment.enums.PaymentMethod;
import com.moldy.moldymarket.payment.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderCode,
        UUID checkoutGroupId,
        UUID buyerId,
        UUID sellerId,
        OrderStatus status,
        UUID storeId,
        BigDecimal totalAmount,
        String receiverName,
        String receiverPhone,
        BigDecimal shippingFee,
        String shippingAddress,
        BigDecimal shopDiscount,
        BigDecimal platformDiscount,
        Instant confirmedAt,
        Instant shippedAt,
        Instant deliveredAt,
        Instant returnDeadline,
        Instant completedAt,
        Instant cancelledAt, Instant createdAt,
        List<OrderItemResponse> items,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        Instant paidAt) {
}
```

### order/mapper/OrderMapper.java

```java
package com.moldy.moldymarket.order.mapper;

import com.moldy.moldymarket.order.dto.response.OrderItemResponse;
import com.moldy.moldymarket.order.dto.response.OrderResponse;
import com.moldy.moldymarket.order.dto.response.OrderSummaryResponse;
import com.moldy.moldymarket.order.entity.Order;
import com.moldy.moldymarket.order.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "items", source = "orderItems")
    @Mapping(target = "checkoutGroupId", source = "checkoutGroup.id")
    @Mapping(target = "paymentMethod", ignore = true)
    @Mapping(target = "paymentStatus", ignore = true)
    OrderResponse toOrderResponse(Order order);


    @Mapping(target = "orderId", source = "order.id")
    OrderItemResponse toOrderItemResponse(OrderItem orderItem);

    @Mapping(target = "items", source = "orderItems")
    @Mapping(target = "checkoutGroupId", source = "checkoutGroup.id")

    OrderSummaryResponse toSummary(Order order);
}
```

### payment/repository/PaymentRepository.java

```java
package com.moldy.moldymarket.payment.repository;

import com.moldy.moldymarket.payment.entity.Payment;
import com.moldy.moldymarket.payment.entity.PaymentTransaction;
import com.moldy.moldymarket.payment.enums.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaymentCode(String paymentCode);
    @Query("select p.checkoutGroupId from Payment p where p.paymentCode = :code")
    Optional<UUID> findCheckoutGroupIdByPaymentCode(@Param("code") String code);
    List<Payment> findAllByPayerIdOrderByCreatedAtDesc(UUID payerId);
    //Optional<Payment> findFirstByOrderIdOrderByCreatedAtDesc(UUID orderId);

    Optional<Payment> findByCheckoutGroupId(UUID checkoutGroupId);

    List<Payment> findAllByCheckoutGroupIdIn(Collection<UUID> checkoutGroupIds);



    @Query("select p from Payment p where p.checkoutGroupId = :checkoutGroupId and p.status = :paymentStatus")
    Optional<Payment> findByCheckoutGroupIdAndStatus(@Param("checkoutGroupId") UUID checkoutGroupId, @Param("paymentStatus") PaymentStatus paymentStatus);

    @Query("select p.status from Payment p where p.id = :id")
    PaymentStatus findStatusById(@Param("id") UUID id);

    @Modifying(flushAutomatically = true)
    @Query("""
        update Payment p
            set p.status = com.moldy.moldymarket.payment.enums.PaymentStatus.SUCCESSFUL,
                p.paidAt = :now, p.updatedAt = :now,
                p.paymentTransaction = :paymentTransaction,
                p.version = p.version + 1
        where p.id = :id 
            and p.status = com.moldy.moldymarket.payment.enums.PaymentStatus.PENDING
    """)
    int markPaid(@Param("id") UUID id, @Param("paymentTransaction") PaymentTransaction paymentTransaction, @Param("now") Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Payment p where p.checkoutGroupId = :checkoutGroupId")
    Optional<Payment> findByCheckoutGroupIdForUpdate(
            @Param("checkoutGroupId") UUID checkoutGroupId
    );
}
```

### order/mapper/OrderResponseAssembler.java

```java
package com.moldy.moldymarket.order.mapper;

import com.moldy.moldymarket.order.dto.response.OrderResponse;
import com.moldy.moldymarket.order.entity.Order;
import com.moldy.moldymarket.order.enums.OrderStatus;
import com.moldy.moldymarket.payment.entity.Payment;
import com.moldy.moldymarket.payment.enums.PaymentMethod;
import com.moldy.moldymarket.payment.enums.PaymentStatus;
import com.moldy.moldymarket.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderResponseAssembler {
    private final OrderMapper orderMapper;
    private final PaymentRepository paymentRepository;

    public OrderResponse toResponse(Order order) {
        return toResponses(List.of(order)).get(0);
    }

    public List<OrderResponse> toResponses(List<Order> orders) {
        var checkoutIds = orders.stream().map(this::checkoutId)
                .filter(Objects::nonNull).distinct().toList();
        Map<UUID, Payment> payments = checkoutIds.isEmpty() ? Map.of()
                : paymentRepository.findAllByCheckoutGroupIdIn(checkoutIds).stream()
                    .collect(Collectors.toMap(Payment::getCheckoutGroupId, Function.identity()));
        return orders.stream().map(order -> {
            UUID checkoutId = checkoutId(order);
            return enrich(order, checkoutId == null ? null : payments.get(checkoutId));
        }).toList();
    }

    private OrderResponse enrich(Order order, Payment payment) {
        var response = orderMapper.toOrderResponse(order);
        return new OrderResponse(
                response.id(), response.orderCode(), response.checkoutGroupId(),
                response.buyerId(), response.sellerId(), response.status(), response.storeId(),
                response.totalAmount(), response.receiverName(), response.receiverPhone(),
                response.shippingFee(), response.shippingAddress(), response.shopDiscount(),
                response.platformDiscount(), response.confirmedAt(), response.shippedAt(),
                response.deliveredAt(), response.returnDeadline(), response.completedAt(),
                response.cancelledAt(), response.createdAt(), response.items(),
                payment == null ? null : payment.getMethod(), paymentStatus(order, payment),
                order.getPaidAt());
    }

    private PaymentStatus paymentStatus(Order order, Payment payment) {
        if (payment == null || payment.getMethod() == null) return null;
        // COD is collected per order; the shared payment may still be pending for other orders.
        if (order.getPaidAt() != null) return PaymentStatus.SUCCESSFUL;
        if (payment.getMethod() == PaymentMethod.COD) {
            if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.EXPIRED)
                return PaymentStatus.FAILED;
            return PaymentStatus.PENDING;
        }
        return payment.getStatus();
    }

    private UUID checkoutId(Order order) {
        return order.getCheckoutGroup() == null ? null : order.getCheckoutGroup().getId();
    }
}
```

### order/service/OrderService.java

```java
package com.moldy.moldymarket.order.service;

import com.moldy.moldymarket.common.exception.AppException;
import com.moldy.moldymarket.common.exception.ErrorCode;
import com.moldy.moldymarket.config.CurrentUser;
import com.moldy.moldymarket.order.dto.response.OrderResponse;
import com.moldy.moldymarket.order.enums.OrderStatus;
import com.moldy.moldymarket.order.mapper.OrderResponseAssembler;
import com.moldy.moldymarket.order.repository.OrderRepository;
import com.moldy.moldymarket.order.repository.CheckoutGroupRepository;
import com.moldy.moldymarket.order.entity.CheckoutGroup;
import com.moldy.moldymarket.order.entity.Order;
import com.moldy.moldymarket.order.enums.CheckoutGroupStatus;
import com.moldy.moldymarket.payment.entity.Payment;
import com.moldy.moldymarket.payment.enums.PaymentMethod;
import com.moldy.moldymarket.payment.enums.PaymentStatus;
import com.moldy.moldymarket.payment.repository.PaymentRepository;
import com.moldy.moldymarket.product.repository.ProductRepository;
import com.moldy.moldymarket.store.repository.StoreRepository;
import com.moldy.moldymarket.cart.service.CartService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.time.Instant;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {
    OrderRepository orderRepository;
    CurrentUser currentUser;
    OrderResponseAssembler orderResponses;
    CheckoutGroupRepository checkoutGroupRepository;
    PaymentRepository paymentRepository;
    ProductRepository productRepository;
    StoreRepository storeRepository;
    CartService cartService;

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrderByBuyerId(){
        var user = currentUser.findCurrentUser();
        var orders = orderRepository.findAllByBuyerId(user.getId());
        if(orders.isEmpty())
            throw new AppException(ErrorCode.ORDER_LIST_NOT_FOUND);
        return orderResponses.toResponses(orders);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId){
        var order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        requireBuyer(order);
        return orderResponses.toResponse(order);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public OrderResponse receivedCOD(UUID orderId){
        var locked = lockOrder(orderId);
        var order = locked.order();
        if (locked.payment().getMethod() != PaymentMethod.COD) throw invalidState();
        if (order.getPaidAt() != null) return orderResponses.toResponse(order);
        if (order.getStatus() != OrderStatus.DELIVERED) throw new AppException(ErrorCode.ORDER_NOT_DELIVERED);
        if (locked.checkout().getStatus() != CheckoutGroupStatus.PAY_ON_DELIVERY
                || locked.payment().getStatus() != PaymentStatus.PENDING) throw invalidState();
        Instant now = Instant.now();
        var ids = productIds(List.of(order));
        for (UUID productId : ids) {
            productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND))
                    .completeReservationFor(locked.checkout().getId(), now);
        }
        order.confirmReceived();
        order.setPaidAt(now);
        updateCodGroup(locked.checkout(), locked.payment(), now);
        cartService.removePurchasedItems(order.getBuyerId(), ids);
        return orderResponses.toResponse(order);
    }

    @Transactional
    public OrderResponse confirmOrder(UUID orderId) {
        var locked = lockOrder(orderId);
        var order = locked.order();
        UUID userId = currentUser.findCurrentUser().getId();
        boolean isOwner = order.getStoreId() == null
                ? order.getSellerId().equals(userId)
                : storeRepository.findById(order.getStoreId())
                    .map(store -> store.getOwnerId().equals(userId)).orElse(false);
        if (!isOwner) throw new AppException(ErrorCode.ORDER_NOT_EXISTED);
        if (locked.payment().getMethod() != PaymentMethod.COD) throw invalidState();
        if (order.getStatus() == OrderStatus.CONFIRMED) return orderResponses.toResponse(order);
        if (order.getStatus() != OrderStatus.PENDING_CONFIRMED) throw invalidState();
        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedAt(Instant.now());
        return orderResponses.toResponse(order);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public OrderResponse startShipping(UUID orderId) {
        var order = lockOrder(orderId).order();
        if (order.getStatus() == OrderStatus.SHIPPING) return orderResponses.toResponse(order);
        if (order.getStatus() != OrderStatus.CONFIRMED) throw invalidState();
        order.setStatus(OrderStatus.SHIPPING);
        order.setShippedAt(Instant.now());
        return orderResponses.toResponse(order);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public OrderResponse markDelivered(UUID orderId) {
        var order = lockOrder(orderId).order();
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.COMPLETED)
            return orderResponses.toResponse(order);
        if (order.getStatus() != OrderStatus.SHIPPING) throw invalidState();
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(Instant.now());
        return orderResponses.toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrderFromBuyer(UUID orderId) {
        var locked = lockOrder(orderId);
        var order = locked.order();
        requireBuyer(order);
        if (order.getStatus() == OrderStatus.CANCELLED) return orderResponses.toResponse(order);
        if (locked.payment().getStatus() != PaymentStatus.PENDING) throw invalidState();
        Instant now = Instant.now();
        List<Order> cancelled;
        if (locked.payment().getMethod() == PaymentMethod.ONLINE_BANKING) {
            if (locked.checkout().getStatus() != CheckoutGroupStatus.PENDING_PAYMENT
                    || locked.checkout().getOrders().stream().anyMatch(o -> o.getStatus() != OrderStatus.PENDING_PAYMENT))
                throw invalidState();
            // One bank QR pays the entire group; cancelling any unpaid order invalidates it all.
            cancelled = locked.checkout().getOrders();
        } else {
            if (locked.checkout().getStatus() != CheckoutGroupStatus.PAY_ON_DELIVERY
                    || (order.getStatus() != OrderStatus.PENDING_CONFIRMED && order.getStatus() != OrderStatus.CONFIRMED))
                throw invalidState();
            cancelled = List.of(order);
        }
        for (UUID productId : productIds(cancelled)) {
            productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND))
                    .releaseReservationFor(locked.checkout().getId(), now);
        }
        for (Order item : cancelled) {
            item.setStatus(OrderStatus.CANCELLED);
            item.setCancelledAt(now);
            item.setUpdatedAt(now);
        }
        if (locked.payment().getMethod() == PaymentMethod.ONLINE_BANKING) {
            locked.checkout().setStatus(CheckoutGroupStatus.CANCELLED);
            locked.payment().setStatus(PaymentStatus.FAILED);
            locked.payment().setUpdatedAt(now);
        } else {
            updateCodGroup(locked.checkout(), locked.payment(), now);
        }
        return orderResponses.toResponse(order);
    }

    private LockedOrder lockOrder(UUID orderId) {
        UUID checkoutId = orderRepository.findCheckoutGroupIdByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        var checkout = checkoutGroupRepository.findByIdForUpdate(checkoutId)
                .orElseThrow(() -> new AppException(ErrorCode.CHECKOUT_GROUP_NOT_EXISTED));
        var payment = paymentRepository.findByCheckoutGroupIdForUpdate(checkoutId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_EXISTED));
        var order = checkout.getOrders().stream().filter(item -> orderId.equals(item.getId()))
                .findFirst().orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));
        return new LockedOrder(checkout, order, payment);
    }

    private void requireBuyer(Order order) {
        if (!order.getBuyerId().equals(currentUser.findCurrentUser().getId()))
            throw new AppException(ErrorCode.ORDER_NOT_EXISTED);
    }

    private List<UUID> productIds(List<Order> orders) {
        return orders.stream().flatMap(order -> order.getOrderItems().stream())
                .map(item -> item.getProductId()).distinct().sorted().toList();
    }

    private void updateCodGroup(CheckoutGroup checkout, Payment payment, Instant now) {
        var payable = checkout.getOrders().stream().filter(order -> order.getStatus() != OrderStatus.CANCELLED).toList();
        BigDecimal total = payable.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        checkout.setTotalAmount(total);
        payment.setAmount(total);
        payment.setUpdatedAt(now);
        if (payable.isEmpty()) {
            checkout.setStatus(CheckoutGroupStatus.CANCELLED);
            payment.setStatus(PaymentStatus.FAILED);
        } else if (payable.stream().allMatch(order -> order.getPaidAt() != null)) {
            checkout.markPaid();
            payment.setStatus(PaymentStatus.SUCCESSFUL);
            payment.setPaidAt(payable.stream().map(Order::getPaidAt).max(Instant::compareTo).orElseThrow());
        }
    }

    private AppException invalidState() { return new AppException(ErrorCode.INVALID_ORDER_STATE); }
    private record LockedOrder(CheckoutGroup checkout, Order order, Payment payment) {}
}
```

### order/service/StoreOrderService.java

```java
package com.moldy.moldymarket.order.service;

import com.moldy.moldymarket.common.exception.AppException;
import com.moldy.moldymarket.common.exception.ErrorCode;
import com.moldy.moldymarket.common.response.PagedResponse;
import com.moldy.moldymarket.config.CurrentUser;
import com.moldy.moldymarket.order.dto.response.OrderResponse;
import com.moldy.moldymarket.order.enums.OrderStatus;
import com.moldy.moldymarket.order.mapper.OrderResponseAssembler;
import com.moldy.moldymarket.order.repository.OrderRepository;
import com.moldy.moldymarket.security.PermissionConstants;
import com.moldy.moldymarket.store.service.StoreAccessGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreOrderService {
    private final OrderRepository orderRepository;
    private final CurrentUser currentUser;
    private final StoreAccessGuard storeAccessGuard;
    private final OrderResponseAssembler orderResponses;

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getStoreOrders(UUID storeId, int page, int size, OrderStatus status){
        if (page < 1 || size < 1 || size > 100 || (long) (page - 1) * size > Integer.MAX_VALUE) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        UUID userId = currentUser.findCurrentUser().getId();
        storeAccessGuard.requireStoreAccess(storeId, userId, PermissionConstants.ORDER_PROCESS);
        var pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var orders = orderRepository.findStoreOrders(storeId, status, pageable);
        var content = orderResponses.toResponses(orders.getContent());
        return PagedResponse.of(orders, content, pageable);

    }

}
```

## 4. Giải thích để đọc và học

1. OrderResponse chỉ mô tả JSON trả về; ba field bổ sung không tạo cột DB.
2. OrderMapper vẫn map snapshot đơn/items như cũ. Hai field payment được ignore rõ ràng vì MapStruct không có Payment trong đầu vào; paidAt map trực tiếp từ Order. Endpoint OrderResponse đi qua assembler trước khi trả cho client.
3. PaymentRepository bổ sung một batch query theo các checkout ID, thay vì query trong vòng lặp từng order.
4. OrderResponseAssembler ghép snapshot đã map với metadata Payment. toResponses tải payment một lần cho cả trang/list; trùng checkout chỉ query một ID. Dữ liệu thiếu payment giữ unknown. Nếu database có nhiều Payment cho cùng checkout, toMap từ chối dữ liệu trùng thay vì tùy tiện chọn một payment.
5. OrderService giữ nguyên kiểm tra buyer/owner/Admin, khóa checkout/payment/product, trạng thái, cart cleanup và idempotency. Chỉ thay bước tạo response; buyer list dùng batch assembler, không map từng order rồi query từng dòng.
6. StoreOrderService kiểm tra StoreAccessGuard trước khi lấy đơn/payment. Owner và staff đúng store có ORDER_PROCESS mới xem được. Phân trang và filter giữ nguyên. Không gọi checkout API dành cho buyer từ màn hình seller.

Assembler được gọi trong các transaction read/write hiện có của hai service. Không inject assembler vào CheckoutGroupService: flow đó đang dùng toSummary, không phải OrderResponse. Không thay DTO PaymentResponse đang dùng cho QR.

## 5. Kiểm tra sau khi Chu chép

Đã đối chiếu code Chu chép và chạy full Maven verify/package. Tests mới: OrderResponseAssemblerTest và hai case trong StoreOrderHttpIntegrationTest; fixtures PostgreSQL tự rollback. Các tests cũ trong OrderServiceTest, OrderLifecycleTest, StoreOrderServiceTest đã được cập nhật để mock assembler, giữ kiểm tra quyền và lifecycle.

Chu không cần chép tests. Restart Backend sau khi build để ứng dụng đang chạy nạp DTO/assembler mới. Những đơn cũ thiếu Payment sẽ hiển thị chưa có thông tin, không tự gán COD hoặc đã thanh toán.

Các case bắt buộc: COD chưa thu; đã giao chưa thu; thu một trong nhiều order COD; hủy một phần COD không ảnh hưởng order khác; online thành công/thất bại/processing; legacy thiếu checkout/payment; duplicate payment không chọn tùy tiện; batch chỉ một query; owner/staff không lộ dữ liệu store khác; HTTP response có đủ field và paidAt của order.

Frontend sau đó hiển thị phương thức + trạng thái riêng, có unknown khi thiếu metadata; COD FAILED do hủy hiển thị không tiếp tục thu tiền, không gọi là hoàn tiền. Không tự thêm nút shipping/collection cho owner/staff.
