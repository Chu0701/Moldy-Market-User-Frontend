# 14 - Backend Integration Matrix (Ma trận tích hợp Backend)

> Cập nhật local 2026-11-20: checkout/payment đã nối trên codex/selective-checkout-integration, xem mục 5.7.2. Các audit branch cũ vẫn giữ cho lịch sử; không coi chúng là trạng thái bản local mới. Frontend chưa nối submit/QR.

> **Trạng thái tài liệu:** BẢN NHÁP v0.3 (cập nhật 2026-11-08: thêm `feature/order`, đọc lại `feature/chat`, ghi nhận phản hồi của team), cần team review.
> **Áp dụng cho:** `Moldy-Market-User-Frontend` và `Moldy-Market-Admin-Frontend` (nội dung giống hệt nhau ở cả hai repo; cột "Dùng bởi" cho biết app nào cần mục đó).

Tài liệu này trả lời một câu hỏi: **hiện tại Backend thực sự có gì?** Mọi dòng đều được rút ra từ việc đọc source code Backend. Không có gì được suy đoán chỉ từ tên class, và mình chưa gọi thử endpoint nào trên server đang chạy.

Nếu một thông tin không có trong tài liệu này, Frontend phải coi nó là **chưa biết** và không được tự bịa ra.

---

## 0. Tóm tắt nhanh

**Đã có trên `main` và dùng được ngay:** đăng ký, đăng nhập, refresh token, logout, hồ sơ cá nhân, tạo và quản lý gian hàng, quản lý staff (thêm trực tiếp bằng email), category, product (tạo, sửa, xóa, tìm kiếm, gợi ý từ khóa), admin kiểm duyệt product, admin quản lý user và store.

**Đã có code nhưng nằm ở branch chưa merge (`IN_PROGRESS`):** notification, chat (REST và WebSocket), cart, wallet, escrow, withdrawal, voucher, pricing (auto pricing, appraiser, reference price), và mới là **checkout, order (phía người mua), payment kèm SePay webhook** (branch `feature/order`).

**Chưa có code ở bất kỳ branch nào đã đọc:** offer/thương lượng, refund (chỉ có class rỗng), dispute (chỉ có entity), wishlist, follow store, review, thống kê doanh thu và thống kê admin, và phía người bán của order (xác nhận, giao hàng, huỷ).

**Những điều cần biết trước khi code Frontend:**
1. JWT không chứa role hay permission. `GET /api/v1/users/me` trả tên role, permission code và `storeId` của user hiện tại (mục 3.4).
2. Có nhiều kiểu phân trang khác nhau (kể cả không phân trang), và chỉ số `page` lúc bắt đầu từ 1, lúc bắt đầu từ 0.
3. URL không thống nhất: phần lớn là `/api/v1/...` nhưng voucher và pricing là `/api/...`.
4. Chat chỉ gắn hai user với nhau, không gắn với offer, order hay product.
5. Trên các branch chưa merge, nhiều endpoint admin và escrow chưa có kiểm tra quyền (mục 6, B2). Ẩn nút trên giao diện không thay thế được việc kiểm tra quyền ở Backend.
6. User mới đăng ký có trạng thái `PENDING_VERIFICATION`, và theo code thì chưa đăng nhập được cho đến khi admin chuyển sang `ACTIVE` (mục 3.5, B10). Team đã xác nhận: hiện chưa có luồng nào đặt user thành `ACTIVE`.
7. Sau khi SePay báo thanh toán thành công, code hiện chỉ cập nhật `Payment`, chưa cập nhật `CheckoutGroup` và `Order` (B12). Frontend chưa thể dựa vào trạng thái order để biết đã thanh toán.

---

## 1. Phương pháp và mốc thời gian

| Mục | Giá trị |
|---|---|
| Repository Backend | `https://github.com/Qt159/Moldy-Market` |
| Ngày chốt | 2026-11-03, cập nhật 2026-11-08 |
| `main` | commit `589a861` (2026-11-01, merge PR #4 `feature/product`) |
| Branch đã đọc | `main`, `feature/order` (commit `3b3d67c`, 2026-11-08; `feature/payment` trỏ cùng commit này), `feature/chat` (đọc lại, commit `68b87cb`, 2026-11-04), và đã đọc ở lần trước: `feature/notification`, `feature/escrow-wallet`, `feature/cart`, `feature/voucher`, `feature/pricing`, `integration/demo` |
| Lưu ý về độ mới | `feature/order` đã gộp `main`, `chat`, `voucher`, `escrow-wallet` nhưng **không có** `cart`, `notification`, `pricing`. Các branch đọc lần trước có đầu commit không đổi so với lần đọc (đã so sánh), trừ `feature/chat`. |
| Branch chưa đọc nội dung | `feature/category`, `feature/store`, `docs`. `feature/authorization` và `feature/security` đã là tổ tiên của `main` (tức đã merge). |
| Cách xác minh | Đọc tĩnh controller, DTO record, enum, `SecurityConfig`, `WebSocketConfig`, `ErrorCode`, `PermissionConstants`. Không gọi endpoint nào. |

### 1.1 Bảng trạng thái

| Trạng thái | Ý nghĩa trong tài liệu này |
|---|---|
| `IMPLEMENTED` | Code đã có trên `main`, đã đọc controller và DTO. |
| `PARTIALLY_IMPLEMENTED` | Có trên `main`, nhưng một phần hành vi dự kiến còn thiếu hoặc code ghi rõ chưa hỗ trợ. |
| `IN_PROGRESS` | Code chỉ có ở **branch chưa merge**. Tên branch được ghi rõ. Contract có thể thay đổi. |
| `PLANNED` | Có trong tài liệu thiết kế hoặc requirements, nhưng không có code ở branch nào đã đọc. |
| `NOT_FOUND` | Không có code và không có thiết kế dùng được. |
| `REQUIRES_BUSINESS_CLARIFICATION` | Quy tắc nghiệp vụ còn mơ hồ. Team phải quyết định trước khi Frontend xây dựng dựa trên nó. |

Trạng thái tích hợp phía Frontend: `NOT_STARTED` (chưa bắt đầu), `FOUNDATION_ONLY` (đã có công cụ nhưng chưa có service code), `INTEGRATED` (đã tích hợp).
Tại thời điểm viết bản nháp này, **mọi dòng đều là `NOT_STARTED`**.

### 1.2 Quy tắc cho dev Frontend

1. Chỉ các dòng `IMPLEMENTED` mới được viết service function gọi API thật.
2. Dòng `IN_PROGRESS` chỉ được viết service sau khi branch đã merge vào `main` và tài liệu này đã cập nhật.
3. Dòng `PLANNED` và `NOT_FOUND` chỉ làm skeleton trang, đánh dấu `TODO`, không viết code API.

---

## 2. Quy ước chung của Backend (đã xác minh)

### 2.1 Response envelope (khung phản hồi)

Mọi REST response (thành công lẫn lỗi) có dạng:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Request completed successfully",
  "data": {},
  "timestamp": "2026-11-03T10:00:00Z"
}
```

Khi lỗi, `success` là `false`. Với `AppException`, `GlobalExceptionHandler` ghi tên enum từ `ErrorCode.name()` vào `code` (ví dụ `INVALID_CREDENTIALS`), còn `data` là object `ApiError` có đường dẫn request.

Các ngoại lệ đã thấy trong controller:
- Một số endpoint **không có body**: `DELETE /api/v1/categories/{id}`, `DELETE /api/v1/products/{id}`, các thao tác `PATCH .../read`, `DELETE`, `PATCH .../restore` của notification, và `DELETE /api/admin/reference-prices/{id}`. Lớp Axios không được giả định lúc nào cũng có `response.data.data`.
- Payload WebSocket của chat **không** bọc trong `ApiResponse` (xem mục 5.2).
- Webhook SePay trả `{ "success": true }`, cũng không bọc trong `ApiResponse` (xem mục 5.8). Endpoint này chỉ để SePay gọi, Frontend không bao giờ gọi.

### 2.1.1 Category response: đối chiếu source local ngày 2026-11-10

- Nguồn: `category/controller/CategoryController.java#getTree` và `category/dto/CategoryResponse.java` dưới `src/main/java/com/moldy/moldymarket/` của Backend local; không sửa Backend.
- `GET /api/v1/categories` trả `ApiResponse<List<CategoryResponse>>`, gọi `getActiveTree()`.
- DTO gồm `id` (UUID), `name`, `description` (String), `parentId` (UUID), `level` (int), `status` (`CategoryStatus`, chưa audit giá trị enum), `hasChildren` (boolean), `children` (`List<CategoryResponse>`), `createdAt`, `updatedAt` (Instant).
- Comment DTO xác nhận `children` là `null` cho detail và có giá trị cho tree. DTO không có trường ảnh; lưới trang chủ dùng `id` và `name` của các node cấp gốc.
- Xác nhận tích hợp ngày 2026-11-10: sau khi khởi động Backend local, Chu xác nhận danh mục thật đã hiển thị trên trang chủ User. Luồng cây danh mục đã tích hợp; endpoint chi tiết chưa được nối, `CategoryPage` vẫn là placeholder. Loading, empty, error, retry, 403 và điều hướng thẻ được kiểm tra bằng tests mock tại service boundary.

### 2.1.2 Product search: đối chiếu source và HTTP local ngày 2026-11-10

- Nguồn: `product/controller/ProductController.java`, `product/dto/ProductSearchResponse.java`, `product/dto/ProductResponse.java` dưới `src/main/java/com/moldy/moldymarket/` của Backend local; không sửa Backend.
- `GET /api/v1/products/search?page=1&size=8&sort=newest` đã trả `success: true` với 4 items trong lần kiểm tra local. Đây là số lượng tại thời điểm kiểm tra, không phải số cố định cho UI.
- Payload là `{ items, page, size, totalElements, totalPages, totalCapped, facets }`; `items` là danh sách `ProductResponse`, `facets` có thể null khi không yêu cầu facets.
- `ProductResponse`: `id`, `sellerId`, `storeId`, `categoryId` (UUID); `title`, `description`, `removalReason` (String); `price` (BigDecimal); `condition`, `status`, `pricingStrategy` (enum); `images` (`List<String>`); `attributes` (`Map<String,Object>`); `createdAt` (Instant).
- HTTP xác nhận `price` là số JSON và phần tử `images` là chuỗi URL. UI có thể lấy `images[0]` làm ảnh đầu tiên; nếu thiếu hoặc tải lỗi thì dùng placeholder. DTO không có trường tên gian hàng; chưa hiển thị tên giả hoặc tự gọi thêm API gian hàng trên từng thẻ.
- Định dạng VND theo doc 03; định dạng locale chỉ đổi cách hiển thị, không quy đổi tiền tệ. Hook đã nối vào khối sản phẩm mới của trang chủ; loading, empty (ẩn khối), error, retry và 403 được kiểm tra bằng tests tại service boundary. Chưa đánh dấu UI search `INTEGRATED` trước khi Chu xác nhận hiển thị dữ liệu thật trong trình duyệt; trang chi tiết vẫn là placeholder.

### 2.2 Các kiểu phân trang khác nhau

| Ở đâu | Tham số request | Dạng response | Ghi chú |
|---|---|---|---|
| Danh sách user, store (admin) | `page` (**bắt đầu từ 1**), `size`, `sort` | `PagedResponse { content, page, size, hasNext, totalElements }` | `totalElements` là `null` khi Backend dùng Slice. `size` tối đa 100, mặc định 20 (`PaginationConfig`). |
| Tìm kiếm product `GET /api/v1/products/search` | `page` (bắt đầu từ 1, dùng cùng resolver), `size` | `ProductSearchResponse { items, page, size, totalElements, totalPages, totalCapped, facets }` | `totalCapped = true` nghĩa là "có từ 10.000 kết quả trở lên". |
| Danh sách product `GET /api/v1/products` | chưa audit | `PagedResponse<ProductResponse>` (theo chữ ký method) | Chưa audit tham số request. Có record `ProductFilterRequest` (keyword, categoryId, minPrice, maxPrice, condition) nhưng chưa xác nhận endpoint này có dùng nó không. Nên ưu tiên dùng `/search` để duyệt sản phẩm. |
| Notification | `limit` (mặc định 20, tối đa 50), `token` | `NotificationPageResponse { items, nextToken, pageSize }` | **Phân trang bằng cursor**, token là chuỗi Base64 không đọc được ý nghĩa. `nextToken = null` nghĩa là hết trang. Dùng `useInfiniteQuery` của TanStack Query. |
| Lịch sử chat `GET /api/v1/conversations/{id}/messages` | `page` (**bắt đầu từ 0**, mặc định 0), `size` (mặc định **4**) | Spring `Page<MessageResponse>` do Jackson serialize | Controller nhận `page` và `size` như số nguyên thường và tự gọi `PageRequest.of(page, size)`, nên bỏ qua resolver bắt đầu từ 1 và `page` tính từ 0. Mặc định size 4 là rất nhỏ. |
| Danh sách admin trong pricing (`/api/admin/...`) | Pageable | Spring `Page<...>` | Dạng Spring page thô, không phải `PagedResponse`. |
| Order và payment của tôi | không có | `List<...>` thuần | `GET /api/v1/orders/me` và `GET /api/v1/payments/my-payments` trả toàn bộ, không phân trang. Riêng `orders/me` trả **404 `ORDER_003`** khi chưa có order nào; Frontend phải coi đó là trạng thái rỗng, không phải lỗi (B13). |

Frontend cần một adapter riêng cho mỗi dạng. Không nên viết một bộ phân trang chung giả định chỉ có một dạng.

### 2.3 Prefix URL không thống nhất

| Prefix | Module |
|---|---|
| `/api/v1/...` | auth, users, stores, staff, categories, products, notifications, conversations, carts, escrows, wallets, withdrawals, checkout-groups, orders, payments, `payment_transactions` (có dấu gạch dưới) |
| `/api/...` (không có `v1`) | vouchers (`/api/vouchers`, `/api/admin/vouchers`), pricing (`/api/pricing/...`), reference prices và appraiser admin (`/api/admin/...`) |

Hệ quả cho Frontend: `baseURL` của Axios **không được gắn cứng `/api/v1`**. Các service dùng nguyên đường dẫn như ghi trong tài liệu này.

### 2.4 CORS

Không có cấu hình CORS cho REST ở bất kỳ branch nào đã đọc. Chỉ endpoint WebSocket có `setAllowedOriginPatterns("*")`. Khi phát triển, Frontend dùng Vite proxy. Khi production, team Backend phải thêm CORS, hoặc các app phải được phục vụ cùng origin với API. Xem mục 6.

### 2.5 Các nhóm mã lỗi (từ `ErrorCode`)

`AUTH_*`, `USER_*`, `ROLE_*`, `STORE_*` (gồm cả staff), `CAT_*`, `PROD_*`, `NOTIFICATION_*`, `COMMON_*`; riêng trên `feature/cart` còn có `PRICING_*`, `VOUCHER_*`, `NOTIF_*`, và trên `feature/order` còn có `ORDER_*`, `PAYMENT_*`. Các mã đáng chú ý mà Frontend phải xử lý:

| Mã | HTTP | Ý nghĩa |
|---|---|---|
| `COMMON_001` | 400 | Validation thất bại |
| `COMMON_003` | 401 | Cần đăng nhập |
| `COMMON_004` | 403 | Không đủ quyền |
| `COMMON_009` | 429 | Gọi quá nhiều (rate limit) |
| `COMMON_010` | 409 | Dữ liệu bị người khác sửa trước (optimistic lock, xem `version` ở update product) |
| `AUTH_001` | 401 | Sai email hoặc mật khẩu |
| `AUTH_003` / `AUTH_004` | 403 | Tài khoản bị khóa / bị vô hiệu |
| `AUTH_005` / `AUTH_006` / `AUTH_007` | 401 | Refresh token không hợp lệ / hết hạn / **phát hiện dùng lại** (với `AUTH_007`, Backend đã thu hồi mọi phiên đăng nhập của user, xem 3.2) |
| `STORE_004` | 403 | Gian hàng bị chặn |
| `STORE_015` | 403 | Không có quyền quản lý tài nguyên của gian hàng này |
| `PROD_008` | 409 | Đã đạt giới hạn số tin đăng |
| `PROD_010` | 400 | Sản phẩm không còn `ACTIVE` (khi checkout) |
| `ORDER_001` | 404 | Order không tồn tại |
| `ORDER_003` | 404 | Chưa có order nào (trả khi danh sách rỗng) |
| `ORDER_005` | 400 | Trùng sản phẩm trong cùng một lần checkout |
| `ORDER_008` | 409 | Checkout group không ở trạng thái hợp lệ |
| `ORDER_011` | 403 | Không được truy cập checkout group này |
| `PAYMENT_001` | 404 | Payment không tồn tại (cũng trả khi payment của người khác) |
| `PAYMENT_002` / `PAYMENT_003` | 401 / 400 | Webhook sai chữ ký / sai định dạng (chỉ phía SePay gặp) |

Danh sách đầy đủ nằm trong `ErrorCode.java`. Message của Backend là tiếng Anh; Frontend nên ánh xạ `code` sang key i18n và không hiển thị trực tiếp message của Backend.

---

## 3. Mô hình xác thực và phân quyền (đã xác minh trên `main`)

### 3.1 Endpoint

| Tính năng | Endpoint | Method | Xác thực | Request | `data` trả về |
|---|---|---|---|---|---|
| Đăng ký | `/api/v1/auth/register` | POST | không | `{ email, password(8-100), fullName(tối đa 100), phone }` | `{ userId, email, fullName, status }` |
| Đăng nhập | `/api/v1/auth/login` | POST | không | `{ email(tối đa 254), password }` | `{ userId, email, fullName, accessToken, refreshToken, tokenType }` |
| Refresh | `/api/v1/auth/refresh` | POST | không | `{ refreshToken }` | giống login |
| Đăng xuất | `/api/v1/auth/logout` | POST | không | `{ refreshToken }` | không có data |

### 3.2 Thông tin về token

| Thông tin | Giá trị | Nguồn |
|---|---|---|
| Cả hai token được trả trong JSON body | có | `AuthResponse` |
| Thời hạn access token | 900.000 ms = 15 phút | `application-local.yaml` (**chỉ profile local**) |
| Thời hạn refresh token | 2.592.000.000 ms = 30 ngày | như trên |
| Claim của access token | `sub` (user id), `email`, `tokenType = "ACCESS"` | `JwtService` |
| Role / permission nằm trong JWT | **Không** | `JwtService` |
| Lưu refresh token | có trạng thái (entity và repository trong database) | `security/refreshToken` |
| Xoay vòng / phát hiện dùng lại | Mỗi lần refresh, token cũ bị thu hồi và cấp token mới. Nếu một token đã bị thu hồi mà vẫn được gửi lên, Backend **thu hồi toàn bộ phiên đăng nhập đang hoạt động của user** và trả `AUTH_007`. Logout chỉ thu hồi phiên của refresh token được gửi lên. Refresh token lưu dạng hash trong database. | `RefreshTokenService.rotate` / `revoke` (đã đọc code); chi tiết hash lấy từ commit message của `feature/security` |

### 3.3 Phân quyền dựa trên permission, tính lại ở mỗi request

`CustomUserDetailsService` dựng danh sách authority ở mỗi request đã xác thực, từ:

1. `ROLE_<tên>` cho từng role user đang có. Tên role: `USER`, `APPRAISER`, `STAFF`, `ADMIN`, `OWNER`.
2. Mọi permission code có grant type `FULL` của các role đó.
3. Nếu user là staff của gian hàng: các permission code **được ủy quyền cho bản ghi staff đó**.

Controller dùng `@PreAuthorize("hasAuthority('<PERMISSION>')")`. Các permission code được khai báo trong `PermissionConstants` (ví dụ `PRODUCT_CREATE`, `STORE_STAFF_MANAGE`, `ADMIN_PORTAL_ACCESS`, `CATEGORY_MANAGE`, `USER_STORE_MANAGE`, `PRODUCT_MODERATE`).

Entity `UserRole` là `(user_id, role_id, store_id)`. Cột `store_id` làm cho việc gán role **gắn theo từng gian hàng**.

### 3.4 Frontend biết được gì về permission

| Nhu cầu | Hiện có không? |
|---|---|
| Tên role của user hiện tại | Có: `GET /api/v1/users/me` trả `roles: string[]`. |
| Permission code của user hiện tại | Có: `GET /api/v1/users/me` trả `permissions: string[]` từ các authority hiện tại sau khi lọc các giá trị bắt đầu bằng `ROLE_`. |
| Permission của một staff | `StaffResponse.permissions` qua `GET /api/v1/stores/my-store/staff/me`, yêu cầu `STORE_WORKSPACE_ACCESS` từ bản sửa local 2026-11-21. Không dùng permissions gộp của `/users/me` để suy ra quyền được cấp trong shop. |
| Store ID của user hiện tại | `GET /api/v1/users/me` trả `storeId` đầu tiên khác null từ các bản ghi gán role, hoặc null. |

Frontend có thể dùng `permissions` để hiển thị thao tác phù hợp. Backend xác minh quyền ở mỗi request. Frontend xử lý `403` nếu quyền đã thay đổi.

Đối chiếu source Backend `main` tại `21d16cd` cho hồ sơ cá nhân:

- `GET` và `PUT /api/v1/users/me` trả cùng DTO `UserProfileReSponse` trong envelope `ApiResponse`. DTO gồm `id`, `email`, `fullName`, `phone`, `avatarUrl`, `status`, `trustPoints`, `roles`, `permissions`, `storeId` và `createdAt`.
- Body của `PUT` gồm `fullName` bắt buộc, tối đa 100 ký tự, và `phone` tùy chọn. Số điện thoại bắt đầu bằng `0` hoặc `+84`, theo sau là đúng 9 chữ số ASCII. Bỏ qua `phone` hoặc gửi null sẽ giữ nguyên số hiện tại.
- Số điện thoại đã thuộc về tài khoản khác trả `409 PHONE_ALREADY_EXISTS`. Cập nhật yêu cầu quyền `PROFILE_MANAGE`.

`PUT /api/v1/users/me/password` trên cùng commit nhận hai trường bắt buộc `currentPassword` và `newPassword`. DTO đặt độ dài tối thiểu 8 ký tự cho mật khẩu mới. Thành công trả `200` với `ApiResponse<Void>`. Sai mật khẩu hiện tại trả `401 INVALID_CREDENTIALS` và mật khẩu mới trùng mật khẩu hiện tại trả `400 SAME_PASSWORD`. Frontend hiển thị lỗi sai mật khẩu tại ô mật khẩu hiện tại. Service cập nhật hash và giữ nguyên refresh token.

### 3.5 Kích hoạt tài khoản sau khi đăng ký (team đã xác nhận)

Theo đọc code, và team Backend đã xác nhận ngày 2026-11-08 rằng chưa có luồng nào đặt user thành `ACTIVE`:

1. Đăng ký đặt trạng thái user là `PENDING_VERIFICATION` (`AuthenticationService`, entity `User`).
2. Đăng nhập đi qua Spring `authenticate`, và `CustomUserDetails.isEnabled()` chỉ cho phép `ACTIVE`. User chưa `ACTIVE` gây `DisabledException`, Backend trả lỗi `ACCOUNT_DISABLED`.
3. Không tìm thấy endpoint xác minh email hay OTP. Chỉ có hai nơi đặt `ACTIVE`: tài khoản admin được tạo lúc khởi động (`RoleInitializer`) và `PUT /api/v1/users/{id}/status` của admin.
4. `StoreStaffService` cũng yêu cầu staff phải `ACTIVE`.

Hệ quả: user tự đăng ký xong thì chưa đăng nhập được cho đến khi có luồng kích hoạt. Xem B10 và Q14. Trong lúc chờ, để phát triển và thử giao diện, tài khoản test phải được admin chuyển sang `ACTIVE` bằng `PUT /api/v1/users/{id}/status`, hoặc dùng tài khoản admin được tạo sẵn lúc khởi động.

---

## 4. Ma trận tính năng

`Dùng bởi`: U = User Frontend, A = Admin Frontend.

### 4.1 Đã xác minh trên `main`

| Tính năng | Trạng thái | Controller | Endpoint | Xác thực / permission | Dùng bởi | FE |
|---|---|---|---|---|---|---|
| Đăng ký / đăng nhập / refresh / logout | `IMPLEMENTED` | `AuthController` | xem 3.1 | công khai | U, A | NOT_STARTED |
| Chat REST: hội thoại và lịch sử | `IMPLEMENTED` (audit local dc11b09 ngày 2026-11-19) | `ConversationController` | POST/GET `/api/v1/conversations`, GET `/{id}/messages` | đã đăng nhập; kiểm tra participant khi đọc lịch sử | U | API layer IMPLEMENTED_LOCAL, 281/281 frontend tests pass; chưa kiểm thử HTTP chat. Xem docs/learning/chat-api.md |
| Danh sách đơn mua của tôi | `IMPLEMENTED` (audit local dc11b09 ngày 2026-11-19) | `OrderController` | `GET /api/v1/orders/me` | đã đăng nhập; service lọc theo buyerId hiện tại | U | IMPLEMENTED_LOCAL; Chu đã chép code, chờ kiểm thử HTTP |
| Hồ sơ của tôi | `IMPLEMENTED` | `UserController` | `GET /api/v1/users/me` | đã đăng nhập | U, A | NOT_STARTED |
| Cập nhật hồ sơ | `IMPLEMENTED` | `UserController` | `PUT /api/v1/users/me` | `PROFILE_MANAGE` | U | NOT_STARTED |
| Đổi mật khẩu | `IMPLEMENTED` | `UserController` | `PUT /api/v1/users/me/password` | đã đăng nhập | U | NOT_STARTED |
| Admin: danh sách / chi tiết / đổi trạng thái user | `IMPLEMENTED` | `UserController` | `GET /api/v1/users`, `GET /api/v1/users/{id}`, `PUT /api/v1/users/{id}/status` | `USER_STORE_MANAGE` | A | NOT_STARTED |
| Tạo gian hàng | `IMPLEMENTED` | `StoreController` | `POST /api/v1/stores` | đã đăng nhập (controller không có `@PreAuthorize`; Backend giới hạn mỗi user một gian hàng bằng `STORE_002`) | U | NOT_STARTED |
| Gian hàng của tôi (xem / sửa) | `IMPLEMENTED` | `StoreController` | `GET` / `PUT /api/v1/stores/my-store` | đã đăng nhập | U | NOT_STARTED |
| Trang công khai của gian hàng | `IMPLEMENTED` | `StoreController` | `GET /api/v1/stores/{id}` | công khai | U | NOT_STARTED |
| Admin: danh sách store / đổi trạng thái | `IMPLEMENTED` | `StoreController` | `GET /api/v1/stores`, `PUT /api/v1/stores/{id}/status` | `USER_STORE_MANAGE` | A | NOT_STARTED |
| Staff: thêm / danh sách / permission / xóa / me | `IMPLEMENTED` | `StoreStaffController` | `POST`, `GET`, `PUT /{staffId}/permissions`, `DELETE /{staffId}`, `GET /me` dưới `/api/v1/stores/my-store/staff` | `STORE_STAFF_MANAGE` | U | NOT_STARTED |
| Quy trình **mời** staff | `PLANNED` | không có | không có (chỉ có thêm trực tiếp bằng email) | không áp dụng | U | NOT_STARTED |
| Category: cây / chi tiết | `IMPLEMENTED` | `CategoryController` | `GET /api/v1/categories`, `GET /api/v1/categories/{id}` | công khai | U, A | U: cây `INTEGRATED`, chi tiết `NOT_STARTED`; A: `NOT_STARTED` |
| Category: CRUD cho admin | `IMPLEMENTED` | `CategoryController` | `POST`, `PUT /{id}`, `DELETE /{id}` | `CATEGORY_MANAGE` | A | NOT_STARTED |
| Product: tạo / sửa / xóa / đổi trạng thái | `IMPLEMENTED` | `ProductController` | `POST /api/v1/products`, `PUT /{id}`, `DELETE /{id}`, `PATCH /{id}/status?status=` | `PRODUCT_CREATE`, `PRODUCT_MANAGE_OWN` | U | NOT_STARTED |
| Product: danh sách / chi tiết | `IMPLEMENTED` | `ProductController` | `GET /api/v1/products`, `GET /api/v1/products/{id}` | công khai | U, A | NOT_STARTED |
| Product: tìm kiếm và gợi ý | `IMPLEMENTED` | `ProductController` | `GET /api/v1/products/search`, `GET /api/v1/products/suggest?q=` | công khai | U | NOT_STARTED |
| Admin kiểm duyệt product | `IMPLEMENTED` | `ProductController` | `PUT /{id}/remove` (body `{ reason }`), `PUT /{id}/restore` | `PRODUCT_MODERATE` | A | NOT_STARTED |
| Chiến lược định giá của product | `PARTIALLY_IMPLEMENTED` | `ProductService` | enum có `SELLER_SET`, `AUTO_PRICING`, `APPRAISER`; lỗi `PROD_003` ghi "This pricing strategy is not supported yet" | không áp dụng | U | NOT_STARTED |

#### Contract mở gian hàng trên `main` tại `21d16cd`

- `POST /api/v1/stores` nhận `name` bắt buộc, tối đa 255 ký tự, và hai trường tùy chọn `description`, `pickupAddress`. Khi thành công, API trả `201` và Backend gán role `OWNER` kèm ID gian hàng. Nếu user đã có gian hàng, API trả `409 STORE_ALREADY_EXISTS`.
- `GET /api/v1/stores/my-store` tìm theo ID chủ gian hàng của tài khoản hiện tại. Nếu chưa có gian hàng, API trả `404 STORE_NOT_FOUND`.
- Cả hai trả `StoreResponse` trong `ApiResponse`, gồm `id`, `ownerId`, `name`, `description`, `pickupAddress`, `status` và `createdAt`.
- `PUT /api/v1/stores/my-store` nhận `name` bắt buộc (tối đa 255 ký tự), `description` và `pickupAddress` có thể gửi `null` để xóa giá trị cũ. API trả `200` với `StoreResponse`; tên trùng trả `409 STORE_NAME_TAKEN`, gian hàng bị khóa trả `403 STORE_BLOCKED`.

### 4.2 Chỉ có ở branch chưa merge (`IN_PROGRESS`)

| Tính năng | Branch | Endpoint | Xác thực quan sát được | Dùng bởi | FE |
|---|---|---|---|---|---|
| Notification | `feature/notification`, `feature/cart`, `integration/demo` | `GET /api/v1/notifications?limit&token`, `GET /{id}`, `PATCH /{id}/read`, `DELETE /{id}` (xóa mềm), `PATCH /{id}/restore` | chỉ cần đăng nhập | U | NOT_STARTED |
| Đánh dấu chat đã đọc | local main, controller còn stub | PATCH `/api/v1/conversations/{id}/read` | chỉ trả 204, chưa gọi service | U | Chưa dùng (STUB) |
| Chat WebSocket | như trên | xem mục 5.2 | JWT trong header của STOMP CONNECT | U | NOT_STARTED |
| Checkout (tạo checkout group, order, payment trong một lần gọi) | codex/selective-checkout-integration local; mục 5.7.2 | POST /api/v1/checkout-groups | buyer từ session; chặn owner/staff tự mua | U | Backend IMPLEMENTED_LOCAL; Frontend INTEGRATED_LOCAL_SANDBOX: online tạo đơn và thanh toán đã được Chu kiểm thử |
| Xem checkout group | codex/selective-checkout-integration local | GET /api/v1/checkout-groups/{id} | chỉ buyer | U | Backend IMPLEMENTED_LOCAL; Frontend INTEGRATED_LOCAL_SANDBOX: QR, polling và reload đã được Chu kiểm thử |
| Chi tiết order theo ID | codex/selective-checkout-integration local | GET /api/v1/orders/{orderId} | kiểm tra buyer, foreign ID trả ORDER_NOT_EXISTED | U | Backend đã sửa B11 local; UI vẫn dùng /orders/me |
| Admin xác nhận đã thu tiền COD | codex/selective-checkout-integration local | POST /api/v1/orders/admin/{orderId}/cod-collected | @IsAdmin và service ADMIN; COD DELIVERED, idempotent | A | Backend IMPLEMENTED_LOCAL; Admin UI chưa làm |
| Xem payment | codex/selective-checkout-integration local | GET /api/v1/payments/my-payments, GET /api/v1/payments/{id} | chỉ payer; response có paymentStatus và method | U | Backend IMPLEMENTED_LOCAL; Frontend NOT_STARTED |
| Webhook SePay | `feature/order` | `POST /api/v1/payment_transactions/webhook/sepay` | công khai, xác thực bằng chữ ký HMAC. **Chỉ SePay gọi.** | không ai (server-to-server) | không áp dụng |
| Cart | `feature/cart` | `GET /api/v1/carts`, `/summary`, `/by-seller`, `POST /items`, `PATCH /items/{listingId}`, `DELETE /items/{listingId}`, `DELETE /api/v1/carts`, `GET /items/{listingId}/exists`, `GET /items/count` | chỉ cần đăng nhập | U | NOT_STARTED |
| Số dư ví | `feature/escrow-wallet`, `feature/cart`, `integration/demo` | `GET /api/v1/wallets/{userId}/balance` | chỉ cần đăng nhập (xem B2) | U | NOT_STARTED |
| Escrow | như trên | `POST /api/v1/escrows/hold`, `POST /orders/{orderId}/capture`, `POST /orders/{orderId}/release` | chỉ cần đăng nhập (xem B2) | A (và dùng nội bộ) | NOT_STARTED |
| Rút tiền | như trên | `POST /api/v1/withdrawals`, `PATCH /{id}/approve`, `/complete`, `/reject`, `/fail` | chỉ cần đăng nhập (xem B2) | U (gửi yêu cầu), A (xử lý) | NOT_STARTED |
| Voucher | `feature/voucher`, `feature/cart`, `integration/demo` | `GET /api/vouchers/{code}`, `POST/GET /api/admin/vouchers`, `GET /api/admin/vouchers/{code}` | `GET /api/vouchers/**` công khai; đường dẫn admin chỉ cần đăng nhập | U, A | NOT_STARTED |
| Auto pricing | `feature/pricing`, `feature/cart`, `integration/demo` | `POST /api/pricing/auto` | chỉ cần đăng nhập | U | NOT_STARTED |
| Reference price | như trên | `GET/POST /api/admin/reference-prices`, `GET/PUT/DELETE /{id}` | chỉ cần đăng nhập | A | NOT_STARTED |
| Hồ sơ appraiser | `feature/cart` | `POST /api/pricing/appraiser/apply`, `GET /me`, `GET /{id}`, `GET /list`, `GET /api/admin/appraisers`, `PUT /api/admin/appraisers/{id}/approve`, `PUT .../suspend` | chỉ cần đăng nhập | U, A | NOT_STARTED |
| Yêu cầu thẩm định | `feature/cart` | `POST /api/pricing/appraiser/request`, `GET /queue`, `POST /{requestId}/claim`, `/submit`, `/accept`, `/reject`, `GET /api/pricing/requests/{requestId}`, `GET /api/pricing/{listingId}` | chỉ cần đăng nhập | U | NOT_STARTED |

Đã đọc DTO của notification, chat, cart, escrow, trạng thái withdrawal và voucher (mục 5). **DTO của pricing, appraiser, wallet và withdrawal chưa được audit.** Chưa được viết service code cho các mục này.

### 4.3 Không tìm thấy ở bất kỳ branch nào đã đọc

| Tính năng | Trạng thái | Bằng chứng |
|---|---|---|
| Order phía người bán và buyer hủy | PARTIALLY_IMPLEMENTED_LOCAL, mục 5.7.2 | Đã có owner confirm, admin shipping/delivery/COD collection, buyer hủy chưa thu tiền. Chưa có API danh sách order gian hàng hoặc buyer xác nhận nhận hàng online. |
| Cập nhật trạng thái order/checkout sau thanh toán, tự động hết hạn | IMPLEMENTED_LOCAL trên codex/selective-checkout-integration | Listener đồng bộ, reservation, cart cleanup, job hết hạn và kiểm tra deadline đã test; mục 5.7.2. Chưa commit/merge/push. |
| Offer / thương lượng / counteroffer | `NOT_FOUND` | Không có code offer. `offer-negotiation.md` rỗng. Giới hạn số vòng chưa biết. |
| Yêu cầu và duyệt refund | `NOT_FOUND` dưới dạng API. Class `Refund` (trên `feature/order`) hiện **rỗng**, không có trường nào. Module escrow có `DisputeOutcome { PAY_SELLER, REFUND_BUYER }` và trạng thái `DISPUTED`, nhưng chưa controller nào mở refund hay dispute ra ngoài. | Xem các endpoint escrow ở 4.2. |
| Quy trình return / dispute | `REQUIRES_BUSINESS_CLARIFICATION` | Có permission `DISPUTE_*`. Entity `DisputeRequest` (trên `feature/order`) có `userId`, `orderId`, `description`, `imagesUrl`, `createdAt` nhưng chưa có controller hay service. Tài liệu thiết kế mô tả các trạng thái `OPEN`, `UNDER_REVIEW`, `RESOLVED_REFUND`, `RESOLVED_RELEASE`, `CLOSED` nhưng chưa được triển khai. |
| Wishlist | `NOT_FOUND` | không có code |
| Follow gian hàng | `NOT_FOUND` | không có code |
| Đánh giá gian hàng / người bán | `NOT_FOUND` | có permission `REVIEW_CREATE`, không có code |
| Tổng quan doanh thu / giao dịch của gian hàng | `NOT_FOUND` | có permission `STORE_STATS_VIEW`, không có controller |
| Thống kê dashboard admin | `NOT_FOUND` | có permission `ANALYTICS_SYSTEM_VIEW`, không có controller |
| Admin: quản lý giao dịch, khiếu nại, báo cáo/vi phạm, cấu hình hệ thống | `NOT_FOUND` | không có controller |
| Biểu đồ giá / phân tích thị trường | `NOT_FOUND` | Reference price chỉ có CRUD cho admin (4.2). Không endpoint nào trả giá trung bình theo category hay sản phẩm tương tự. |
| Sản phẩm tương tự | `NOT_FOUND` | không có endpoint riêng (endpoint search có thể đáp ứng một phần, cần hỏi team) |
| Upload ảnh | `NOT_FOUND` | `image-upload.md` rỗng. Ảnh product được gửi dưới dạng **URL HTTPS** (tối đa 10, mỗi URL tối đa 500 ký tự). Cơ chế upload chưa rõ. Xem Q5. |
| Notification thời gian thực | `NOT_FOUND` | Notification lưu trong DynamoDB và phát qua SQS publisher. Không thấy kênh đẩy xuống trình duyệt. |

---

## 5. Contract đã xác minh của các module đang phát triển

> Các contract này lấy từ branch chưa merge. Hãy coi là **tạm thời**.

### 5.1 Notification

```text
NotificationRecord {
  notificationId: string, userId: string, type: string,
  referenceType: string, referenceId: string,
  title: string, content: string, isRead: boolean,
  createdAt: string, deletedAt: string | null
}
NotificationPageResponse { items: NotificationRecord[], nextToken: string | null, pageSize: number }
```

- `type` và `referenceType` là chuỗi thường. **Không có enum liệt kê giá trị trong code**, nên Frontend phải có cách hiển thị dự phòng cho type chưa biết.
- Trường cờ đã đọc có thể được serialize thành `read` hoặc `isRead` tùy cấu hình Jackson với record component tên `isRead`. Phải kiểm tra bằng response thật trước khi code.
- Các thao tác `PATCH` và `DELETE` trả body rỗng.
- ID của notification là chuỗi (không phải kiểu UUID).

### 5.2 Chat và WebSocket

> Bản sửa TEXT realtime 2026-11-21: Backend **IMPLEMENTED_LOCAL** sau khi Chu chép 5 file. Đã sửa regex /send bị escape nhầm, dùng findForMessage có lock, bỏ save thứ hai, đổi import validation exception sang messaging và broadcast=false cho domain errors. Tests đã cài vào src/test; full Maven verify/package chính pass 300 tests (299 pass, 1 QA-010 disabled có sẵn), có 3 real SockJS/STOMP/PostgreSQL tests trong 12 tests mới. Guide: Backend docs/testing/CHAT-REALTIME-TEXT.md. Frontend **IMPLEMENTED_LOCAL**: TEXT trong hội thoại có sẵn, full 419/419 tests trong 46 file, format/lint/format:check/build pass. Vitest giới hạn 4 workers sau khi full suite mặc định gặp timeout điều hướng đơn hàng có sẵn khi chạy đồng thời Maven; không bỏ test hoặc nới timeout/assertions. Chờ Chu kiểm thử UI. Điểm vào sản phẩm/storefront đã nối ownerId và Chu xác nhận nút hiện; xem cập nhật tên/policy bên dưới.

> Audit REST: POST/GET /api/v1/conversations và GET /{id}/messages là IMPLEMENTED. Controller lấy current user; service kiểm tra người tham gia khi đọc history. Query tìm hội thoại xử lý cả hai chiều của cặp user. PATCH /{id}/read yêu cầu {messageId}, lưu mốc ID đơn điệu của caller và trả 204. ConversationResponse có lastReadMessageIdParticipant1/2 và unreadCount theo caller. Frontend đã nối badge và peer read receipt. MessageService local cập nhật lastMessageAt và chặn CLOSED. DTO có tên hai participant và canSend/sendBlockedReason; chưa có avatar. PublicStoreResponse có ownerId đã kiểm tra trên Backend chính.


| Mục | Giá trị đã xác minh |
|---|---|
| Giao thức | STOMP qua SockJS |
| Endpoint kết nối | `/chat` (nằm trên origin của Backend; SockJS tự thêm các sub-path của nó) |
| Xác thực | Frame STOMP `CONNECT` phải có native header `Authorization: Bearer <accessToken>`. Thiếu hoặc token sai sẽ bị từ chối kết nối. |
| Destination để gửi | `/app/conversations/{conversationId}/send` |
| Payload gửi | `{ type: "TEXT" \| "IMAGE" \| "FILE", content?: string, attachmentUrl?: string }` |
| Destination để nhận | `/user/queue/messages` (server đẩy cho cả người gửi lẫn người nhận) |
| Payload nhận | `MessageResponse { id: number, conversationId, senderId, type, content, attachment, sentAt }` |
| Broker prefix | `/topic`, `/queue`; application prefix `/app`; user prefix `/user` |
| Kênh báo lỗi | `/user/queue/errors`, chỉ session gửi yêu cầu (broadcast=false). ChatErrorResponse {code,errorMessage,timestamp}; code dùng ErrorCode.getCode(), khác REST dùng tên enum. Domain errors giữ code; validation/malformed payload dùng COMMON_002; lỗi nội bộ COMMON_005 không lộ chi tiết. |
| Subscribe | Chỉ queue riêng messages/errors/chat-reads hoặc topic conversation có participant. Client không được SEND trực tiếp vào broker queue/topic/user destination. Frontend subscribe ba queue riêng này. |
| Read receipt | /user/queue/chat-reads: {conversationId,readerId,messageId,readAt}, tới cả hai participant sau transaction commit; rollback không phát. REST là nguồn trạng thái chính. |
| Token hết hạn | Kiểm tra JWT/account tại CONNECT và mỗi SEND/SUBSCRIBE; token hết hạn không được gửi/subscribe tiếp. Frontend kiểm tra session qua REST trước mỗi CONNECT, dùng refresh interceptor có sẵn và thay socket khi token đổi. Không claim server chủ động đóng mọi subscription idle ngay khi token/account hết hiệu lực. |

Mapping local 2026-11-21: MessageMapper map conversation.id sang conversationId thật. attachment chưa được map và giữ null; UI chưa gửi ảnh/file hoặc đính kèm sản phẩm. Service có transaction và khóa dòng hội thoại khi gửi; insert message và lastMessageAt cùng commit hoặc cùng rollback. Frontend chỉ xóa draft sau echo của server, không optimistic append; frame hợp lệ kích hoạt tải lại REST history/inbox, giữ phân trang và quyền phía Backend. Khi lỗi/timeout/mất kết nối giữ draft, không tự gửi lại; reconnect tải lịch sử để đối chiếu. Protocol chưa có clientMessageId/idempotency key nên không claim exactly-once.

Đối chiếu 2026-11-20: đã fetch origin/feature/dispute tại 4a58390 (fix: completed flows: checkout-payment by cod and online banking), không checkout/merge. Trong phạm vi chat và store DTO, khác biệt với main local chỉ là bỏ Swagger tag ở ChatController; các contract và blocker chat ở trên vẫn còn. Chưa audit hoặc xác minh checkout/payment của nhánh này.

Phần REST:

| Endpoint | Request | `data` trả về |
|---|---|---|
| `POST /api/v1/conversations` | `{ targetUserId }` | `ConversationResponse { id, participant1Id, participant2Id, status(ACTIVE\|CLOSED), lastMessageAt, lastReadAtParticipant1, lastReadAtParticipant2, createdAt, participant1Name, participant2Name, canSend, sendBlockedReason, lastReadMessageIdParticipant1, lastReadMessageIdParticipant2, unreadCount }` (tạo mới hoặc trả lại cuộc hội thoại có sẵn) |
| `GET /api/v1/conversations` | không | `ConversationResponse[]` (không phân trang) |
| `GET /api/v1/conversations/{id}/messages?page&size` | xem 2.2 | `Page<MessageResponse>`, tin mới nhất trước |
| `PATCH /api/v1/conversations/{id}/read` | `{ messageId: positiveLong }` bắt buộc | IMPLEMENTED_LOCAL: caller phải là participant, ID phải thuộc phòng; mốc chỉ tiến tới prefix đã hiển thị, trả 204; tin đến sau vẫn chưa đọc |

Lưu ý quan trọng: một conversation chỉ là giữa **hai user** và được tạo chỉ với `targetUserId`. **Không có liên kết tới offer, order hay product** trong bất kỳ DTO nào. Điều này khác với ý tưởng chat gắn với offer. Xem Q6.
Endpoint read cập nhật ID cursor và timestamp của caller; không đánh dấu cả phòng bằng thời gian hiện tại.

#### Tên người tham gia và policy chat mua bán — cập nhật 2026-11-21

Chu cho phép trợ lý sửa trực tiếp Backend/frontend và tự rà nghiệp vụ chat. Bản hiện tại **IMPLEMENTED_LOCAL** có ConversationResponse.participant1Name, participant2Name, canSend và sendBlockedReason. Tên lấy batch từ User.fullName, chỉ trả cho participant của hội thoại; không trả email/phone. Mapper dùng context đã nạp sẵn, không query từng dòng inbox. Frontend chọn peer theo ID tài khoản đang đăng nhập, hiện tên ở inbox/header và đúng sender trên từng tin; tên trống dùng fallback trung tính, không đoán danh tính.

Policy mới thay thế việc staff được nhắn owner ở bản trước: chat hiện là chat mua bán giữa hai tài khoản, chưa có inbox chung hoặc chat nội bộ đội ngũ. Owner không tự chat; cặp staff và owner shop đang làm không tạo/gửi customer chat theo cả hai chiều; staff vẫn nhắn shop khác. Lịch sử cũ được giữ và read-only bằng canSend=false, không xóa hoặc tự đổi status thành CLOSED. Khi hết quan hệ staff, phòng ACTIVE/tài khoản ACTIVE được gửi lại. Người nhận thiếu/không ACTIVE bị từ chối. Backend kiểm tra ở REST start và mỗi message STOMP, không tin UI/role cache. REST CHAT_STORE_MEMBER/CHAT_PARTICIPANT_UNAVAILABLE tương ứng STOMP CHAT_005/CHAT_006. Các quan hệ staff cũ nhiều dòng được kiểm tra đầy đủ.

Start khóa cả hai user theo UUID đã sort để request A→B/B→A không tạo trùng. Nếu DB cũ đã có nhiều phòng cùng cặp, start tái sử dụng phòng cũ nhất theo createdAt/id; không merge/xóa lịch sử các ID khác. PATCH read kiểm tra participant, khóa phòng như send và lưu ID cursor đơn điệu trước 204. History chặn paging sai bằng INVALID_REQUEST, sort ổn định theo sentAt/id.

Checks: Backend chính full verify/package **311 tests: 310 pass, 1 QA-010 disabled có sẵn**; có tests PostgreSQL/HTTP/STOMP thật cho names/privacy, membership, foreign read, target locked/missing/self, read timestamp, paging và tạo chat đồng thời. Frontend full **437/437 trong 48 file**, format/lint/format:check/build pass. Đã rerun MoldyMarketApplication trong IntelliJ, tiến trình mới trả HTTP 200. Chưa claim trợ lý kiểm tra UI chat của tài khoản thật hoặc gửi tin thay Chu. Không schema/dependency mới, commit hoặc push. Backend guide hiện tại: docs/testing/CHAT-NAMES-AND-POLICY.md; guide chép code cũ chỉ giữ để học.

#### Đọc/chưa đọc — cập nhật 2026-11-21

Read/unread follow-up 2026-11-21 — IMPLEMENTED_LOCAL: badge tổng ở menu và từng phòng, outgoing “Đã đọc” từ peer cursor. MainLayout giữ một socket dùng chung; poll inbox mỗi 30 giây khi foreground để bù event mất. Chỉ ack khi history thành công, document visible/focus và bubble incoming mới nhất đã tải nằm ít nhất 50% trong viewport. Chọn phòng/gửi tin/ẩn tab không tự ack. Request đang chạy bị giới hạn ID; lỗi giữ unread và retry thủ công. Legacy timestamp được giữ nghĩa khi chuyển sang ID. Schema bổ sung hai nullable BIGINT, SQL Backend V20261121__chat_read_cursors.sql; local ddl-auto=update đã kiểm chứng, DB validate/none cần chạy SQL trước deploy. Backend full verify 314 tests (313 pass, 1 disabled cũ); FE 449/449 trong 49 file, format/lint/format:check/build pass. Backend guide: docs/testing/CHAT-READ-UNREAD.md. UI hai tài khoản chờ Chu kiểm tra; không commit/push.

#### 5.2.1 Điểm vào Chat với gian hàng — 2026-11-21

Chu yêu cầu một nút trên trang chi tiết sản phẩm và một nút trên trang gian hàng công khai. Frontend đã thêm cùng StoreChatButton/useStartStoreChat cho cả hai. Sản phẩm do staff đăng vẫn nhắn owner, không fallback sang product.sellerId. Guest sang Login với return URL, sau đăng nhập bấm Chat lại; owner không tự chat; theo policy mới staff không dùng chat mua bán với owner của chính shop; vẫn được chat shop khác.

Backend bổ sung **IMPLEMENTED_LOCAL, Chu đã chép và xác nhận nút hiện**: chỉ thêm UUID ownerId vào PublicStoreResponse của GET /api/v1/stores/{id}. StoreMapper tự map getOwnerId() theo tên; không cần endpoint/controller/schema mới. Bản review riêng pass full Maven verify/package 301 tests (300 pass, 1 disabled có sẵn), có HTTP test public ownerId và không lộ email/phone/pickupAddress. DTO ứng dụng chính đã được đối chiếu và HTTP regression test đã cài. Guide một file: Backend docs/testing/STORE-CHAT-ENTRY.md; tests tham khảo trong store-chat-tests/. Fixture StoreServiceTest chính đã thích ứng với DTO cũ/mới và kiểm tra pass.

Frontend **IMPLEMENTED_LOCAL**, ownerId đã có; Chu đã xác nhận hai nút xuất hiện. Dùng POST /api/v1/conversations {targetUserId: ownerId} đã IMPLEMENTED; phản hồi phải có đúng hai participant và status hợp lệ. Khóa double click, retry:false, bỏ callback sau logout/unmount, seed inbox từ response thật rồi invalidate để tải lại canonical list. Không thêm productId, message tự gửi hay recipient của staff vào request. Nếu Backend chưa có ownerId, giữ nút disabled và cho tải lại thông tin. Trang public truyền query có sẵn để tránh GET thừa; sản phẩm dùng chung cache store detail.

Checks: frontend full **429/429 tests trong 47 file**, format/lint/format:check/build pass. Có 10 tests entry flow mới: hai điểm vào đúng owner, guest Login return URL, owner self-chat, staff nhắn owner, ownerId thiếu không fallback, double click, server denial, participant sai và phản hồi muộn sau logout. Test hồi quy storefront đã bắt GET thừa khi child mount; đã tái sử dụng query của trang, không thay assertions để che lỗi. Backend review thêm focused 14 tests pass sau khi đổi fixture sang mapper thật; main StoreServiceTest 8 tests pass với DTO cũ. OwnerId đã được kiểm tra trên repo chính; kiểm tra UI tên/policy mới còn dành cho Chu.

### 5.3 Cart

`CartResponse { id, userId, status, items[], subtotal, totalItems, createdAt, lastUpdatedAt, abandonedAt }` với `CartItemResponse { id, listingId, sellerId, quantity, priceAtAddTime, totalPrice, note, createdAt, updatedAt }`.
Request: thêm `{ listingId, quantity >= 1, note }`, cập nhật `{ quantity >= 1, note }`.
Backend gọi product là `listingId`, trong khi `ProductResponse` dùng trường `id`. Xem Q7. Các giá trị của `CartStatus` chưa audit.

### 5.4 Escrow và withdrawal (chỉ mô hình dữ liệu)

- `EscrowStatus`: `HELD`, `CAPTURED`, `RELEASED`, `DISPUTED`.
- `DisputeOutcome`: `PAY_SELLER`, `REFUND_BUYER`.
- `WithdrawalStatus`: `REQUESTED`, `PROCESSING`, `COMPLETED`, `FAILED`, `REJECTED`.
- `EscrowHoldRequest { orderId: string, buyerId, sellerId, amount, fee }`; `EscrowHoldResponse { id: number, orderId: number, amount, feeAmount, status, createdAt, resolvedAt }` (lưu ý `orderId` là chuỗi ở request nhưng là số ở response).
- Các endpoint này trông giống **thao tác nội bộ của service** (client có thể gọi `hold` với buyer và số tiền tùy ý). Frontend có nên gọi chúng hay không là câu hỏi nghiệp vụ và bảo mật, xem B2 và Q4.

### 5.5 Voucher

`VoucherCheckResponse { code, discountType, discountValue, expiredAt, valid }`; `VoucherResponse { code, discountType, discountValue, remainingQuantity, expiredAt }`; request tạo `{ code, discountType, discountValue > 0, remainingQuantity > 0, expiredAt }`.
Hiện chỉ có API voucher cho **hệ thống/admin**. Chưa có API voucher cho người bán, dù đã có permission `VOUCHER_SELLER_MANAGE`. Các giá trị của `DiscountType` chưa audit.

### 5.6 Điểm chính của contract Product (`main`)

- Tạo product bắt buộc có `categoryId`, `title (<=150)`, `price (0 < price <= 1.000.000.000, tối đa 2 chữ số thập phân)`, `condition`, `pricingStrategy`. Tùy chọn: `storeId` (null nghĩa là đăng bán cá nhân), `description (<=2000)`, `images (<=10, chỉ https)`, `attributes` (kiểm tra bằng `@ValidProductAttributes`).
- Theo yêu cầu ngày 2026-11-16, User Frontend chỉ mở form đăng tin khi tài khoản có gian hàng và gửi `storeId` từ `GET /api/v1/stores/my-store`. Backend `main` tại `dc11b09` vẫn chấp nhận `storeId = null`. Thay đổi Backend local thêm `@NotNull` vào `CreateProductRequest.storeId`.
- Q19 trên Backend local: `GET /api/v1/products/me` yêu cầu đăng nhập, lấy seller ID từ phiên và trả tin cá nhân `ACTIVE` hoặc `HIDDEN`. Response là `PagedResponse<ProductResponse>` với `content`, `page`, `size`, `hasNext`, `totalElements`. Trang đầu là `1`, mặc định 20 tin, sắp xếp `createdAt` giảm dần. Đã đối chiếu code, chờ kiểm tra HTTP.
- Quản lý tin gian hàng trên Backend local dùng `GET /api/v1/stores/my-store/products`. Backend lấy gian hàng từ tài khoản chủ gian hàng đang đăng nhập và kiểm tra quyền truy cập trước khi liệt kê `ACTIVE` và `HIDDEN`. Response và phân trang dùng cùng cấu trúc với Q19. Tài khoản chưa có gian hàng nhận `404 STORE_NOT_FOUND`, gian hàng bị khóa nhận `403 STORE_BLOCKED`. Đã đối chiếu code, chờ kiểm tra HTTP.
- Cập nhật bắt buộc có `version` (optimistic locking). Version cũ trả HTTP 409 với `code: "CONCURRENT_MODIFICATION"` (`COMMON_010` trong enum). Ở `dc11b09`, `ProductResponse` chưa có `version`. Thay đổi Backend local thêm `Long version` vào DTO. Mapper đã generate lấy `Product.version` cho response đầy đủ của chủ sở hữu và người có quyền kiểm duyệt. Mapper công khai để giá trị null để Jackson bỏ trường này khỏi JSON.
- Enum: `ProductCondition { NEW, LIKE_NEW, USED, DAMAGED }`, `ProductStatus { ACTIVE, HIDDEN, SOLD, DELETED, REMOVED }`, `PricingStrategy { SELLER_SET, AUTO_PRICING, APPRAISER }`.
- Người bán chuyển qua lại giữa `ACTIVE` và `HIDDEN` bằng `PATCH /api/v1/products/{id}/status?status=`. Endpoint yêu cầu `PRODUCT_MANAGE_OWN`, không nhận body và trả HTTP 200 với `ApiResponse<Void>`. Trạng thái đích không hợp lệ trả `400 PRODUCT_STATUS_NOT_ALLOWED`. Trạng thái hiện tại ngoài `ACTIVE` và `HIDDEN` trả `409 PRODUCT_STATUS_LOCKED`, riêng tin đã gỡ hoặc đã xóa có kiểm tra riêng.
- Tham số search: `q (<=100)`, `categoryId[] (<=20)`, `condition[] (<=10)`, `minPrice`, `maxPrice`, `storeId`, `sellerType`, `attr[] (<=10)`, `sort`, `facets`. Giá trị `sort` hợp lệ: `relevance`, `newest`, `price_asc`, `price_desc`. `attr` được parse thành khóa và danh sách giá trị (OR trong cùng một khóa); định dạng chuỗi chính xác chưa audit.
- Các enum khác đã xác minh: `UserStatus { ACTIVE, LOCKED, PENDING_VERIFICATION }`, `StoreStatus { ACTIVE, BLOCKED }`.

### 5.7 Checkout và Order (`feature/order`, chưa merge)

> Contract local mới nhất ở mục 5.7.2: Backend chọn lọc đã nối và qua verify; Frontend submit/QR chưa nối. Mục 5.7.1 giữ audit riêng của origin/feature/dispute 4a58390 (raw branch compile thất bại), không phải trạng thái code local sau khi sửa. Các đoạn audit cũ dưới đây được giữ cho lịch sử.

> Frontend ngày 2026-11-19: theo quyết định của Chu, tạm dừng sửa Backend và chuẩn bị UI chọn sản phẩm/form checkout trước. Chu đã chép code theo docs/learning/checkout-ui.md; các lỗi gõ được sửa. Form đã có điền sẵn fullName/phone từ session, giữ nguyên field đã sửa. Format/lint/build và 256/256 test pass trên repo chính. Dùng GET cart/product/profile đã tích hợp. Chưa có service tạo checkout hay payment; nút Đặt hàng tắt. Kiểm thử giao diện thực tế còn chờ Chu xác nhận.

> Đối chiếu local ngày 2026-11-19: CheckoutGroupController, CheckoutGroupRequest, OrderItemRequest và CheckoutGroupService đã có trên main tại dc11b09. OrderItemRequest và service đã giới hạn quantity đúng 1; service chặn seller và chủ/staff cùng gian hàng bằng 403 CHECKOUT_OWN_PRODUCT (ORDER_012). CheckoutGroupServiceTest 10 test và CartServiceTest 21 test pass. Giữ hàng và xóa cart sau thanh toán theo Q16/Q17 chưa triển khai; Frontend chưa tích hợp checkout. Các mô tả vòng đời order/payment bên dưới là audit cũ trừ phần được xác minh lại rõ ràng.

**Tạo checkout:** `POST /api/v1/checkout-groups`

> Lưu ý: team đã quyết định bỏ `quantity` (mỗi sản phẩm cũ chỉ bán 1 món, xem Q17). Request dưới đây là bản **hiện tại trên branch** và sẽ thay đổi khi Backend sửa.

```text
CheckoutGroupRequest {
  orderItems: [{ productId: UUID, quantity: 1..100 }]   // 1 đến 20 phần tử
  receiverName: string (<=255)
  phoneNumber: string, theo regex ^(\+84|0)\d{9,10}$
  shippingAddress: string (<=500)
  method: "COD" | "ONLINE_BANKING"
  note?: string (<=500)
}
```

Quy tắc đã xác minh trong code:
- **Giá do Backend tính** từ `product.price`. Frontend không gửi giá và không được tự tính tổng để quyết định số tiền thanh toán; chỉ hiển thị `totalAmount` do Backend trả.
- Không được trùng `productId` trong một request (lỗi `ORDER_005`). Mọi product phải tồn tại và đang `ACTIVE` (lỗi `PROD_010` nếu không).
- Backend **tự tách thành nhiều order** theo cặp `(sellerId, storeId)`. Một lần checkout có thể trả về nhiều order.
- `ONLINE_BANKING`: `expiredAt = bây giờ + 15 phút`. `COD`: `expiredAt = null`.
- Phí ship luôn là 0. Voucher chưa được áp dụng (phần code bị comment). Tồn kho chưa được giữ hoặc trừ (`//todo: subtract quantity, reverse stock`). Xem B14.

```text
CheckoutResponse {
  id: UUID, totalAmount, expiredAt | null,
  orders: OrderSummaryResponse[], status: CheckoutGroupStatus,
  paymentResponse: PaymentResponse
}
OrderSummaryResponse { id, orderCode, checkoutGroupId, buyerId, sellerId, status, totalAmount, createdAt, expiredAt, items[] }
PaymentResponse { id, amount, paymentStatus: string, qrBankUrl: string | null, checkoutGroupId }
```

Đọc lại: `GET /api/v1/checkout-groups/{id}` trả cùng `CheckoutResponse`. Chỉ người mua được xem (`ORDER_011` nếu không phải).

**Order của người mua:**

> Orders local, audit 2026-11-19: GET /api/v1/orders/me is IMPLEMENTED on main at dc11b09. OrderController and OrderService resolve the authenticated buyer and call findAllByBuyerId(user.id); OrderMapper maps orderItems to items. Response is ApiResponse<OrderResponse[]>. Empty list throws ORDER_LIST_NOT_FOUND (HTTP 404); ORDER_003 is its internal identifier, while GlobalExceptionHandler serializes ErrorCode.name(). This endpoint may be integrated into the User Frontend. GET /orders/{id} still lacks buyer authorization (B11). The local detail page finds an order in the current buyer list returned by /orders/me; it does not call the detail endpoint. Frontend format, lint, build and all 272 tests pass after the source copy; live HTTP verification is pending. No Backend code changes are made.


```text
OrderResponse {
  id, orderCode, checkoutGroupId, buyerId, sellerId, storeId, status,
  totalAmount, receiverName, receiverPhone, shippingFee, shippingAddress,
  shopDiscount, platformDiscount,
  confirmedAt, shippedAt, deliveredAt, returnDeadline, completedAt, cancelledAt, createdAt,
  items: [{ id: number, orderId, productId, productName, unitPrice, quantity, imageUrl }]
}
```

- `GET /api/v1/orders/me` trả `OrderResponse[]`, không phân trang, và trả **404 `ORDER_LIST_NOT_FOUND`** khi rỗng (mã nội bộ `ORDER_003`, B13).
- `GET /api/v1/orders/{orderId}` **không kiểm tra chủ sở hữu** (B11).
- `POST /api/v1/orders/admin/{orderId}/cod-collected` (`@IsAdmin`): chỉ cho order đang `DELIVERED`, chuyển sang `COMPLETED`; order ở trạng thái khác trả `ORDER_009`.

**Enum (đã xác minh):**
- `CheckoutGroupStatus`: `PENDING_PAYMENT`, `PAID`, `CANCELLED`, `EXPIRED`.
- `OrderStatus`: `PENDING_PAYMENT`, `CONFIRMED`, `SHIPPING`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `DISPUTED`, `REFUNDED`.
- `PaymentMethod`: `COD`, `ONLINE_BANKING`.
- `PaymentStatus`: `PENDING`, `PROCESSING`, `SUCCESSFUL`, `FAILED`.

**Chuyển trạng thái order thực sự có trong code:** order được tạo ở `PENDING_PAYMENT`; `DELIVERED` sang `COMPLETED` do admin. Mọi chuyển trạng thái khác chưa có code, kể cả các trạng thái có trong enum. Frontend không được vẽ timeline order như thể các bước này đã chạy.

### 5.7.1 Đối chiếu checkout/payment trên feature/dispute — 2026-11-20

> Local sau khi Chu duyệt hợp nhất có chọn lọc: branch codex/selective-checkout-integration đã ghép lượt 1 giữ hàng khi tạo checkout và scheduler hết hạn. Giữ reservation riêng, validation owner/staff và quantity=1 hiện có, chưa đưa dispute/refund hoặc listener thanh toán vào. Full Maven verify/package pass với cấu hình runtime từ IntelliJ: 214 test pass, 1 test auth đã disabled từ trước; 71 test liên quan không skip. Chưa bật submit Frontend. Mô tả audit phía dưới vẫn phản ánh đúng source feature/dispute tại commit được review, không phải toàn bộ bản local đã sửa. Chi tiết source và giới hạn: Backend docs/testing/CHECKOUT-SELECTIVE-INTEGRATION.md.

Phạm vi: commit 4a58390df1d1469aeb37b2230bd484c747128d47; đọc controller/DTO/service/entity/repository của checkout, order, payment và giữ hàng. Đối chiếu CheckoutPage, CheckoutForm, checkoutSchema, OrderStatusLabel và Q15–Q17. Không checkout/merge nhánh, không sửa source Backend. Không coi kết quả build của working tree main có thay đổi local là bằng chứng cho nhánh được review.

**Phần khớp hoặc đã tiến triển**

- POST /api/v1/checkout-groups và GET /api/v1/checkout-groups/{id} giữ nguyên đường dẫn. Field nhận hàng, method COD/ONLINE_BANKING, giới hạn 20 item và validation form khớp Frontend hiện tại. Mỗi orderItems chỉ còn { productId }, không còn quantity. Giá/tổng tiền do Backend tính; voucher chưa áp dụng, shippingFee hiện bằng 0.
- Có giữ hàng bằng ProductStatus.RESERVED, reservedCheckoutGroupId và khóa ghi khi reserve/release. Online đặt expiredAt sau 15 phút; COD không có expiredAt. Release chỉ trả đúng reservation của checkout tương ứng.
- Có listener PaymentCompletedEvent gọi markCheckoutGroupPaid trong luồng webhook; có scheduler dự kiến chạy mỗi 60 giây. Đây là source đã có, chưa phải luồng chạy thành công.
- GET /api/v1/payments/{id} kiểm tra payer. QR lấy từ paymentResponse.qrBankUrl, không tự dựng QR hoặc coi nút xác nhận chuyển khoản là bằng chứng thanh toán.
- GET /api/v1/orders/me giữ nguyên. Chi tiết đơn đổi sang GET /api/v1/orders/buyer/{orderId} và đã kiểm tra buyer trên nhánh này; B11 vẫn còn ở main local. Frontend hiện tìm chi tiết trong danh sách của mình nên chưa bị đổi đường dẫn này ảnh hưởng.

**Chặn tích hợp**

1. **P0 — nhánh không compile.** Bản source sạch xuất bằng git archive đúng commit, chạy Maven Wrapper offline với JDK 23.0.1 và release 17: compile thất bại. Hai lỗi đầu là RefundRequest.java khai báo public class Refund và RefundRequestListener.java khai báo public class CancelOrderEventListener. Còn có nhiều lỗi dây chuyền nên không kết luận các lỗi Lombok getter riêng lẻ là nguyên nhân độc lập. Đọc source cũng xác nhận scheduler gọi expireExpiredCheckouts() nhưng CheckoutExpirationService chỉ có expireOne(UUID); RefundService rỗng và RefundReason rỗng trong khi caller dùng các method/enum chưa có. Cần chốt một commit compile được trước khi test HTTP.
2. **P1 — nhánh chưa có module cart.** git ls-tree không có src/main/java/com/moldy/moldymarket/cart; main đã có cart ở commit b4f1af4, merge-base hai nhánh là 3b3d67c. Đây là chênh lệch lịch sử tích hợp, không kết luận tác giả chủ động xóa cart. Không chạy nguyên nhánh này thay main để thử UI checkout hiện tại vì UI cần GET cart; chưa có nối xóa đúng item sau thanh toán online/COD theo Q16.
3. **P1 — chặn tự mua chưa đủ Q17.** CheckoutGroupService chỉ so sellerId với userId. Owner mua tin do staff đăng, hoặc staff mua tin của đồng nghiệp cùng store, vẫn qua validation. Working tree local đã có StoreAccessGuard.isStoreMember; phải giữ phần này khi tích hợp. Đây là thiếu so với quy tắc đã duyệt, không phải regression đã chứng minh so với merge-base.
4. **P1 — online chưa tự xác nhận theo Q15.** markCheckoutGroupPaid đổi checkout thành PAID và product thành SOLD nhưng gọi order.markPendingConfirmation(), đưa order về PENDING_CONFIRMED, còn cần endpoint seller confirm. Cần online chuyển thẳng CONFIRMED, ghi timestamp và xóa đúng cart item trong cùng luồng giao dịch. Không đổi COD thành tự xác nhận theo suy đoán.
5. **P1 — job hết hạn có query sai kiểu.** CheckoutGroupRepository.findExpiredCheckoutIds khai báo List<UUID> nhưng JPQL select cg trả entity; caller lặp UUID và gọi expireOne. Cần select cg.id hoặc đổi contract caller cho thống nhất. Chưa kiểm chứng lỗi runtime vì branch chưa compile.
6. **P1 — hủy/refund đang lệch.** OrderService.cancelOrderFromBuyer chỉ nhận CONFIRMED/PENDING_CONFIRMED, không nhận online đang PENDING_PAYMENT nên chưa trả giữ hàng khi người mua hủy trước thanh toán. Điều kiện phát RefundRequestEvent là method khác ONLINE_BANKING, tức COD bị phát refund trong khi online đã trả tiền thì không. Cần sửa theo trạng thái thực thu tiền và quyết định Q16/Q17; không tự hoàn tiền chỉ vì order bị hủy.
7. **P1 — hạn online chưa được kiểm tra tại webhook.** PaymentRepository.markPaid chỉ kiểm tra PENDING, không kiểm tra expiredAt so với now. Nếu job chậm, chuyển khoản đến sau phút 15 nhưng trước lần quét vẫn được nhận SUCCESSFUL. Đây là rủi ro deadline có sẵn ở truy vấn cũ, nay ảnh hưởng trực tiếp quy tắc giữ 15 phút; cần xử lý đồng bộ với expire, kể cả tình huống tiền thật đến trễ.
8. **P2 — COD chưa đồng bộ toàn trạng thái.** receivedCOD có đặt payment SUCCESSFUL khi các order không còn mở, nhưng không ghi paidAt, không chuyển checkout khỏi PAY_ON_DELIVERY và không xóa cart item. Cần thống nhất trạng thái kết thúc và xử lý checkout có nhiều order trước khi UI dựa vào nó.

**Frontend cần làm sau khi Backend được thống nhất**

- Giữ nút Đặt hàng tắt hiện tại. Thêm checkout service/mutation, gửi { orderItems: [{ productId }], receiverName, phoneNumber, shippingAddress, method, note }; không gửi giá hoặc userId, không auto-retry POST có thể đã thành công.
- Nối route /checkout/:checkoutGroupId và đọc lại checkout để reload vẫn xem được. Online lấy QR/tổng tiền/hạn từ server và polling endpoint đã xác minh; dừng khi terminal/logout. Không tự kết luận hết hạn thanh toán chỉ bằng đồng hồ client.
- Bổ sung nhãn đúng cho PENDING_CONFIRMED, PAY_ON_DELIVERY và PaymentStatus.EXPIRED khi những trạng thái này còn trong contract cuối. OrderItem entity đã bỏ quantity nhưng OrderItemResponse vẫn có int quantity, mapper không set field này; cần Backend bỏ field hoặc bảo đảm trả 1, tránh UI hiển thị 0.
- Sau server xác nhận thanh toán, refetch/invalidate đúng cart, orders và checkout; Frontend không tự xóa cart thay Backend. Không tự bật hủy/confirm/shipping/refund trước khi chốt quyền và flow liên quan.

**Thứ tự đề xuất và kiểm chứng**

1. Tạo bản tích hợp từ main giữ thay đổi local đã làm; hợp nhất có chọn lọc checkout/payment của nhánh mới. Chỉ làm khi Chu duyệt sửa/tích hợp Backend.
2. Sửa build, query hết hạn, chặn owner/staff và giữ hàng; thống nhất online CONFIRMED, COD, hủy và cart cleanup đúng Q15–Q17.
3. Test Backend: owner/staff tự mua; hai buyer giữ cùng product; hết hạn và webhook đồng thời; tiền đến trễ; hủy COD chưa thu tiền không refund; hủy online chưa thanh toán trả hàng; online trả tiền tự CONFIRMED; xóa đúng cart item sau thực thu tiền, giữ item khác; checkout nhiều seller và COD thu tiền từng order.
4. Khi bản tích hợp compile và test pass, mới nối submit và trang thanh toán Frontend thành từng flow nhỏ để Chu chép.

Giới hạn kiểm chứng: chưa gọi HTTP, chưa thanh toán thật, chưa chạy mutation test hoặc unit/integration test nghiệp vụ trên nhánh vì compile đã thất bại. Nhánh chỉ có application context test trong src/test tại commit đã đọc, chưa có test riêng checkout/payment. Full suite Frontend 297 test đã pass ở bước inbox trước đó; không dùng kết quả đó để kết luận Backend mới hoạt động.

### 5.7.2 Contract local sau hợp nhất chọn lọc — 2026-11-20

> Hủy checkout: Kiểm chứng repo chính ngày 2026-11-21: format check, lint, build và 362/362 tests trong 41 file pass sau khi sửa lỗi chép. Chu xác nhận ngày 2026-11-21 đã thử hủy checkout với Backend thật từ UI thành công: hủy các đơn trong checkout, ẩn QR, giữ giỏ, reload giữ trạng thái và có thể đặt lại. INTEGRATED_LOCAL cho hủy online chưa thanh toán; không bao gồm refund hoặc hủy COD.

Frontend hủy checkout online: **INTEGRATED_LOCAL** sau khi Chu chép ngày 2026-11-21, hướng dẫn docs/learning/checkout-cancel-ui.md. Đã đối chiếu OrderController/OrderService local: POST /api/v1/orders/buyer/{orderId}/cancel không body, trả OrderResponse; ONLINE_BANKING chỉ hủy khi payment PENDING, group PENDING_PAYMENT và mọi order PENDING_PAYMENT, hủy cả group. UI chỉ dùng một order đại diện, không gọi endpoint group tưởng tượng hoặc lặp POST cho từng order. Phải GET lại canonical checkout; không suy trạng thái group từ một OrderResponse. INVALID_ORDER_STATE là tên enum trả ra API, ORDER_002 là mã nội bộ. Source UI/i18n đã có trong repo chính và được sửa lỗi chép; tests được trợ lý thêm. Chu xác nhận ngày 2026-11-21 đã thử hủy checkout với Backend thật từ UI thành công: hủy các đơn trong checkout, ẩn QR, giữ giỏ, reload giữ trạng thái và có thể đặt lại. INTEGRATED_LOCAL cho hủy online chưa thanh toán; không bao gồm refund hoặc hủy COD. Không thay đổi Backend trong task này.

Kiểm chứng Frontend trên repo chính sau khi Chu chép: format check, lint, build và 337/337 tests pass (38 file); source đã đối chiếu hướng dẫn. Chu xác nhận ngày 2026-11-20: online checkout → QR → SePay Test mode → webhook HMAC → thanh toán thành công, order đã xác nhận, xóa đúng món khỏi giỏ và giữ trạng thái sau reload. INTEGRATED_LOCAL_SANDBOX; chưa kiểm thử tiền thật/SePay Live hoặc toàn bộ vòng đời COD.

> Frontend **INTEGRATED_LOCAL_SANDBOX** (online): Chu đã chép source submit/QR theo docs/learning/checkout-payment-ui.md và đã sửa lỗi chép trên repo chính. POST không tự retry; GET checkout làm snapshot và polling online 5 giây khi còn chờ/đồng bộ (mặc định kỹ thuật cho Q11), COD cập nhật thủ công. Chỉ SUCCESSFUL + PAID mới báo đã trả tiền. Không tự xóa giỏ hoặc kết luận EXPIRED từ countdown. Đã kiểm chứng HTTP với SePay Test mode theo xác nhận của Chu; chưa chuyển khoản thật. Phần “Frontend chưa nối” bên dưới lưu trạng thái trước khi chép.

Backend branch codex/selective-checkout-integration giữ nền main dc11b09 và các sửa local auth/cart/store. Source feature/dispute 4a58390 chưa được merge nguyên nhánh. Toàn bộ flow đã duyệt được nối local; Frontend submit/QR chưa nối. Hướng dẫn source đầy đủ: Backend docs/testing/CHECKOUT-PAYMENT-FLOW.md.

- POST /api/v1/checkout-groups nhận { orderItems: [{ productId }], receiverName, phoneNumber, shippingAddress, method, note? }. quantity cũ bằng 1 còn hợp lệ, thiếu thì mặc định 1, >1 bị chặn. Giá, buyer, seller lấy server.
- CheckoutResponse vẫn { id, totalAmount, expiredAt, orders, status, paymentResponse }. PaymentResponse nay { id, amount, paymentStatus, method: COD|ONLINE_BANKING, qrBankUrl, checkoutGroupId }. Dùng method khi reload, không đoán từ QR.
- Online: PENDING_PAYMENT → PAID; orders PENDING_PAYMENT → CONFIRMED; product ACTIVE có reservation → SOLD. COD: group PAY_ON_DELIVERY, orders PENDING_CONFIRMED → CONFIRMED → SHIPPING → DELIVERED → COMPLETED sau thu tiền. Group/payment còn pending trong lúc chỉ một số order đã thu tiền.
- Action đã chọn từ branch: POST /api/v1/orders/seller/{orderId}/confirm (store owner); POST /api/v1/orders/buyer/{orderId}/cancel (buyer); PATCH /api/v1/orders/admin/{orderId}/start-shipping và /mark-delivered; POST /api/v1/orders/admin/{orderId}/cod-collected (admin). Buyer detail giữ GET /api/v1/orders/{orderId} và nay kiểm tra ownership.
- Hủy online chỉ khi chưa thanh toán và hủy toàn bộ checkout chung QR; COD chỉ hủy order chưa giao/chưa thu tiền và giảm tổng còn phải trả. Không phát refund khi chưa thu tiền. Online đã trả tiền cần flow refund riêng.
- Hết hạn/hủy online: payment FAILED, group EXPIRED/CANCELLED tương ứng, giữ giỏ. Receipt muộn ghi LATE, lệch tiền AMOUNT_MISMATCH, trả vào payment đã SUCCESSFUL ghi DUPLICATE; không tự báo paid hoặc refund.
- DB migration V20261120__checkout_statuses.sql đã áp dụng local: giữ ordinal cũ, append PENDING_CONFIRMED=9/PAY_ON_DELIVERY=4, mở rộng constraints và sửa index expired_at. DB khác đã tồn tại cần chạy SQL trong transaction; Maven không tự chạy migration vì chưa có Flyway runner.
- Source mapper đã sửa paymentStatus, checkoutGroupId và orderId để response không null. Full Maven verify/package cuối pass 264 test: 263 pass, 1 skip auth có sẵn, không failure/error; có 8 integration PostgreSQL/HTTP test. Chưa kiểm thử ngân hàng/SePay Live. Không coi kết quả Backend là FE đã tích hợp.

### 5.7.3 Danh sách đơn gian hàng — 2026-11-21

Trạng thái Backend: **IMPLEMENTED_LOCAL** sau khi Chu chép ngày 2026-11-21. Đã sửa typo :staus thành :status trong query, cài 19 tests mới và full Maven verify/package trên repo chính pass 283 tests: 282 pass, 1 auth QA-010 disabled có sẵn. Endpoint đã được PostgreSQL/JWT/MockMvc kiểm tra. Guide đủ 5 file: Backend docs/testing/STORE-ORDERS-API.md. Frontend từ task này do trợ lý trực tiếp code, Backend vẫn gửi code để Chu chép; tests do trợ lý thêm. Không nối service frontend trước khi source Backend chính được kiểm tra.

- GET /api/v1/stores/{storeId}/orders?page=1&size=20&status=PENDING_CONFIRMED. Cần đăng nhập. Chu chốt owner và staff cùng store có ORDER_PROCESS được xem; quyền xem không cấp quyền xác nhận COD. Tái sử dụng StoreAccessGuard, bao gồm STORE_BLOCKED.
- page từ 1, mặc định 1; size 1–100, mặc định 20. status tùy chọn theo OrderStatus. Sort cố định createdAt DESC, id DESC; sai UUID/int/enum/bounds/offset trả INVALID_REQUEST (400).
- ApiResponse<PagedResponse<OrderResponse>>, data có content/page/size/hasNext/totalElements. Trang rỗng trả 200, không dùng lỗi rỗng legacy của /orders/me. Filter bằng Order.storeId, không dùng sellerId; owner thấy đơn từ mọi staff đúng shop, không lấy đơn shop khác hoặc đơn cá nhân cũ.
- OrderResponse giữ nguyên, chưa có paymentMethod/paymentStatus. UI không được coi CONFIRMED là đã thu tiền COD. POST /api/v1/orders/seller/{orderId}/confirm hiện có vẫn chỉ owner; admin shipping/delivery/collection giữ nguyên.
- Chu duyệt sửa CustomAuthenticationEntryPoint và CustomAccessDeniedHandler: dùng Jackson 3 ObjectMapper được Spring inject, giữ status/code/message. Test anonymous tái hiện lỗi mapper Jackson 2 không serialize được Instant của ApiResponse.timestamp.
- Bản review riêng (từ working tree Backend hiện tại, không phải committed ref) pass full Maven verify/package: 283 tests, 282 pass và 1 auth QA-010 disabled có sẵn; 19 test mới, gồm 11 PostgreSQL/HTTP và 8 unit. Tests mới không skip, fixtures tự rollback. Hibernate 7.4.1.Final đã được đối chiếu; pagination với nhiều items và count được kiểm tra trên PostgreSQL.

Frontend **IMPLEMENTED_LOCAL**: trợ lý trực tiếp nối /store/orders và menu owner/staff; dùng query key theo userId/storeId/page/status, AbortSignal, lọc trạng thái và phân trang URL, tái sử dụng snapshot món/người nhận; không dùng link /orders/:id dành cho buyer. Xác nhận chỉ owner và order PENDING_CONFIRMED; đọc lại cache trước POST, khóa bấm đúp, không retry/optimistic CONFIRMED, invalidate đúng các page của user/store sau thành công hoặc lỗi. GET lỗi 403/404 ẩn cached private data; response muộn sau logout không phục hồi cache. Full frontend pass 398 tests trong 44 file (36 test mới), format check/lint/build pass. Chưa claim kiểm thử giao diện/HTTP thủ công bởi Chu. Cần restart Backend sau khi chép để nạp controller/query/handler mới.

### 5.7.4 Quyền staff trong workspace — 2026-11-21

Backend **IMPLEMENTED_LOCAL**: Chu duyệt trợ lý sửa trực tiếp Backend trong task này. GET `/api/v1/stores/my-store/staff/me` dùng `STORE_WORKSPACE_ACCESS`, trả StaffResponse của chính principal (userId/storeId/permissions). Các API thêm/list/đổi quyền/xóa nhân viên vẫn yêu cầu `STORE_STAFF_MANAGE` và owned-store check.

GET `/api/v1/stores/{storeId}/products` cần đăng nhập; dùng service/StoreAccessGuard có sẵn: owner hoặc staff đúng shop được cấp `PRODUCT_MANAGE_OWN`. Trả PagedResponse<ProductResponse> với ACTIVE/HIDDEN, page bắt đầu 1, mặc định size 20, sort createdAt DESC. Sai shop hoặc thiếu quyền trả STORE_ACCESS_DENIED, shop khóa trả STORE_BLOCKED. API owner `/stores/my-store/products` giữ nguyên.

Chu duyệt bổ sung `PRODUCT_MANAGE_OWN` vào quyền owner được cấp riêng cho staff; không tự cấp cho staff cũ, không gộp với PRODUCT_CREATE. `/users/me.permissions` vẫn gộp quyền role và delegated; USER có ORDER_PROCESS/PRODUCT_MANAGE_OWN không đồng nghĩa được quản lý shop. Không nới StoreAccessGuard.

Full Maven verify/package pass 288 tests: 287 pass, 1 QA-010 disabled có sẵn. Năm integration tests mới kiểm tra self-profile, quyền global khác delegated, đúng shop, thu hồi quyền với cùng token, shop khóa và anonymous. Unit test đổi quyền bao gồm PRODUCT_MANAGE_OWN. Frontend lấy quyền/storeId từ self-profile, link quản lý `/store/products` khác “Xem trang công khai”; trang công khai giữ bộ lọc tìm kiếm. Chờ Chu restart Backend và kiểm thử UI thật.

Frontend full test pass **406/406 trong 44 file**; npm run format, lint, format:check và build pass. Regression tests kiểm tra quyền role USER không thay quyền delegated, storeId phiên cũ không ghi đè membership, lỗi kiểm tra lại quyền 403 ẩn cached orders, staff quản lý sản phẩm không gọi API my-store của owner, mở form sửa tin đồng nghiệp và owner cấp PRODUCT_MANAGE_OWN độc lập. Chưa kiểm thử giao diện thật; Chu tự kiểm tra.

### 5.8 Thanh toán SePay (`feature/order`, chưa merge)

> Phần này lưu audit protocol/branch cũ. Trạng thái đồng bộ mới và contract cho Frontend dùng mục 5.7.2: B12 đã sửa local, payment có method, job hết hạn đã có. Không áp dụng các kết luận B12 cũ bên dưới cho bản tích hợp local mới.

**Phía Frontend nhận được gì:** trong `PaymentResponse`, `qrBankUrl` là một URL ảnh QR do Backend tạo (dạng `https://vietqr.app/img?acc=...&bank=...&amount=...&des=<mã thanh toán>`), và là `null` với `COD`. Mã thanh toán có dạng `MM` + 8 ký tự chữ hoa hoặc số, được dùng làm nội dung chuyển khoản. Số tài khoản và tên ngân hàng nằm trong cấu hình Backend. Frontend chỉ hiển thị ảnh theo URL này và **không tự dựng QR**. Chưa có endpoint nào trả thông tin chuyển khoản dạng chữ (số tài khoản, ngân hàng, nội dung), xem Q11.

**Luồng webhook (chỉ để hiểu, Frontend không gọi):**

1. SePay gọi `POST /api/v1/payment_transactions/webhook/sepay`. Endpoint công khai, nhưng Backend kiểm tra chữ ký HMAC-SHA256 trong header `X-SePay-Signature` (dạng `sha256=<hex>`, tính trên `timestamp + "." + body`) cùng `X-SePay-TimeStamp` lệch không quá 300 giây. Sai thì trả `PAYMENT_002`.
2. Mỗi giao dịch được lưu theo `(provider, externalId)`, nên SePay gửi lại cùng giao dịch sẽ bị bỏ qua (idempotent).
3. Giao dịch tiền ra (`OUT`) chỉ ghi nhận (`IGNORED`).
4. Backend tìm payment theo mã `MM[A-Z0-9]{8}` trong nội dung chuyển khoản. Không tìm thấy thì ghi `UNMATCHED`.
5. **Số tiền phải khớp chính xác** với `payment.amount`. Lệch thì ghi `AMOUNT_MISMATCH` và payment vẫn `PENDING`.
6. Khớp và payment đang `PENDING`: payment chuyển `SUCCESSFUL`, ghi `paidAt`, phát `PaymentCompletedEvent`. Nếu payment không còn `PENDING`: ghi `DUPLICATE` (đã thành công) hoặc `LATE` (đã hết hạn hay thất bại).
7. `MatchStatus`: `MATCHED`, `UNMATCHED`, `AMOUNT_MISMATCH`, `LATE`, `DUPLICATE`, `IGNORED`.

**Hệ quả cho Frontend:**

- Không có kênh push. Để biết đã thanh toán, Frontend phải **polling** `GET /api/v1/payments/{id}` (hoặc `GET /api/v1/checkout-groups/{id}`) và chỉ coi là thành công khi `paymentStatus === "SUCCESSFUL"` do Backend trả. Bấm nút "Tôi đã chuyển khoản" không bao giờ được coi là thanh toán thành công.
- Chỉ tin `paymentStatus`. `CheckoutGroup.status` và `Order.status` hiện **không** được cập nhật sau khi thanh toán (B12), nên chúng vẫn là `PENDING_PAYMENT` dù tiền đã về.
- `expiredAt` chỉ để hiển thị đếm ngược. Không thấy job tự động chuyển trạng thái hết hạn, nên đếm ngược về 0 không có nghĩa Backend đã huỷ. Chuyển khoản trễ hoặc lệch số tiền chưa có đường xử lý (code ghi `//todo: late/duplicate -> refund or re-reserve`).
- `paymentStatus` trong DTO là chuỗi, giá trị theo enum `PaymentStatus`. Hãy xử lý giá trị lạ bằng nhánh mặc định.

---

## 6. Vấn đề cần báo team Backend

Đây là những điều quan sát được khi đọc code, không phải việc của Frontend.

| ID | Quan sát | Vì sao Frontend cần quan tâm |
|---|---|---|
| B1 | Không có cấu hình CORS cho REST. | Trình duyệt không gọi được API khác origin, trừ khi đi qua Vite proxy. |
| B2 | Trên `feature/cart` (và các feature branch khác), **không** controller nào của cart, wallet, escrow, withdrawal, voucher admin, pricing, reference-price hay appraiser admin có `@PreAuthorize`, và `SecurityConfig` chỉ yêu cầu `authenticated()`. Bất kỳ user nào đã đăng nhập đều có thể gọi `/api/admin/**`, `/api/v1/escrows/**` và `/api/v1/withdrawals/*/approve`. | Frontend có ẩn giao diện admin thì cũng không phải là bảo mật. Backend cần sửa trước khi phát hành. |
| B3 | Các branch lệch nhau: `SecurityConfig` của `feature/cart` cho phép công khai `GET /api/categories/**` và `GET /api/vouchers/**` nhưng không liệt kê `/api/v1/products...` hay `/api/v1/categories`, trong khi `main` thì ngược lại. | Sau khi merge, việc duyệt công khai có thể âm thầm bắt phải đăng nhập. Cần kiểm tra lại danh sách route công khai sau khi tích hợp. `SecurityConfig` của `feature/order` (đã gộp `main`) liệt kê đủ route công khai của product, category, store, `/chat/**` và webhook, nên có thể dùng làm mốc đối chiếu. |
| B4 | Prefix URL lẫn lộn (`/api/v1` và `/api`). | Xem 2.3. |
| B5 | Đã được xử lý ở `feature/chat` mới nhất: lỗi `AppException` được gửi tới `/user/queue/errors`. Các branch cũ hơn (`cart`, `integration/demo`) vẫn chưa có. Lỗi không phải `AppException` vẫn chưa có đường báo. | Cần chốt branch tích hợp để biết dùng bản nào. |
| B6 | Lịch sử chat mặc định `size = 4` và `page` bắt đầu từ 0, trong khi các endpoint khác bắt đầu từ 1. | Dễ gây lỗi lệch trang. |
| B7 | `orderId` là chuỗi ở `EscrowHoldRequest` nhưng là số ở `EscrowHoldResponse`, trong khi `Order.id` trên `feature/order` là UUID. | Contract không nhất quán, và escrow hiện chưa thể gắn với order thật. |
| B8 | Các tài liệu thiết kế cho chat, offer, vòng đời order, payment/escrow và upload ảnh đều rỗng (0 byte) trên `main`. | Frontend không có contract viết sẵn cho các phần này. |
| B9 | Tên class `UserProfileReSponse` bị viết sai chính tả. | Chỉ là thẩm mỹ, nội bộ, không ảnh hưởng JSON. |
| B10 | Đăng ký đặt user ở `PENDING_VERIFICATION`, đăng nhập chỉ cho `ACTIVE`, và không có endpoint xác minh nào. Chỉ admin (qua `PUT /users/{id}/status`) hoặc tài khoản admin seed mới có `ACTIVE`. Team xác nhận ngày 2026-11-08. | User tự đăng ký xong không đăng nhập được. Frontend chưa thể làm luồng đăng ký rồi đăng nhập hoàn chỉnh. |
| B11 | Đã sửa local: GET /api/v1/orders/{orderId} kiểm tra buyer; không có quyền trả ORDER_NOT_EXISTED. | Unit regression chặn buyer khác. Chưa nằm trong main đã commit; UI hiện vẫn lấy chi tiết từ danh sách riêng. |
| B12 | Đã sửa local: online SUCCESSFUL → listener trong transaction → checkout PAID, order CONFIRMED, product SOLD, xóa đúng cart item. Có scheduler và kiểm tra deadline trong webhook. | Integration PostgreSQL/HTTP kiểm tra settlement, rollback/retry và trễ/trùng. COD CONFIRMED chưa đồng nghĩa đã thu tiền. Main đã commit chưa có phần này. |
| B13 | `GET /api/v1/orders/me` trả 404 (`ORDER_003`) khi người mua chưa có order. | Trạng thái rỗng bị trả như lỗi. Frontend phải xử lý riêng. |
| B14 | Đã giữ hàng local và khóa product theo ID; mỗi product một món. quantity có thể bỏ qua và mặc định 1, giá trị >1 bị chặn. Giữ online 15 phút, COD không tự hết hạn. | Test hai buyer cùng giữ một product chỉ một checkout thành công. Voucher chưa áp, shippingFee vẫn 0; không suy ra đã có shipping calculator. |

---

## 7. Câu hỏi nghiệp vụ và kỹ thuật còn mở

| ID | Câu hỏi | Chặn việc gì |
|---|---|---|
| Q1 | `GET /api/v1/users/me` đã trả permission code và một `storeId` (mục 3.4). Cần xác minh cách chọn gian hàng nếu một user có nhiều bản ghi gán role với các store khác nhau. | Menu theo permission trong Store Dashboard. |
| Q2 | **Chu đã chốt 2026-11-10:** access token lưu `localStorage`; refresh token dùng cookie `HttpOnly` do Backend set. Contract đã xác minh hiện vẫn trả token trong JSON; **chờ Backend hỗ trợ cookie trước khi triển khai auth/refresh**. Chưa xác minh tên cookie, thuộc tính cookie hoặc request/response auth mới. | Doc 08 và lớp Axios; không tự sửa Backend hoặc giả định contract cookie. |
| Q3 | **Đã trả lời từ source** (xem 3.2): khi gặp `AUTH_007`, Backend thu hồi toàn bộ phiên của user. Cách UI thông báo cho user sẽ ghi ở doc 08. | Doc 08. |
| Q4 | Ai gọi escrow `hold` / `capture` / `release`: service order nội bộ hay Frontend? | Frontend có cần các endpoint này không. |
| Q5 | Ảnh product upload bằng cách nào (API chỉ nhận URL HTTPS)? Pre-signed URL? Dịch vụ bên thứ ba? | Trang tạo/sửa product. |
| Q6 | Chu chốt ngày 2026-11-19: khách nhắn chủ gian hàng, kể cả khi staff đăng sản phẩm. Chat API hiện chỉ nhận targetUserId, chưa gắn product/order/store trong DTO. PublicStoreResponse đã có ownerId; conversation đã có tên hai participant và quyền gửi do server tính. Chưa có avatar/inbox chung cho staff. Chu cho phép sửa Backend trực tiếp trong task tên/policy chat. | Điểm vào chat và hiển thị người đối thoại. |
| Q7 | Chu đã chốt `listingId = Product.id`. Backend local đọc Product để lấy seller, giá và kiểm tra ACTIVE. Mỗi dòng có quantity 1; thêm lại giữ một dòng. `GET /api/v1/carts`, `POST /api/v1/carts/items`, `DELETE /api/v1/carts/items/{listingId}` đã được sửa và test local, được dùng cho tích hợp Frontend. Chu đã xác nhận flow thêm → xem → tải lại → xóa với Backend thật ngày 2026-11-18. Cả ba trả `CartResponse` trong ApiResponse. Giỏ chưa tồn tại trả id null, items [], subtotal 0, totalItems 0. Chủ hoặc staff cùng gian hàng và người bán của tin cá nhân bị chặn thêm bằng `403 CART_OWN_PRODUCT`. | Liên kết cart với product. |
| Q8 | Thương lượng offer: số vòng, thời hạn, ai được counter? | Quy tắc giao diện offer. `REQUIRES_BUSINESS_CLARIFICATION`. |
| Q9 | Refund: ai được yêu cầu, có những trạng thái nào, có hoàn một phần không? Requirements nói Admin xử lý refund thủ công; hiện chưa có API. | Các trang refund. |
| Q10 | Quy trình dispute chưa được định nghĩa. | Các trang dispute giữ ở `PLANNED`. |
| Q11 | **Đã biết một phần** (mục 5.8): QR là URL ảnh do Backend trả, trạng thái lấy bằng polling `GET /payments/{id}`. Còn thiếu: thông tin chuyển khoản dạng chữ (số tài khoản, ngân hàng, nội dung), tần suất polling hợp lý, và cách xử lý chuyển khoản trễ hoặc sai số tiền. | Trang thanh toán. |
| Q12 | Branch nào là đích tích hợp, và khi nào `order`, `payment`, `notification`, `chat`, `cart`, `voucher`, `pricing`, `escrow-wallet` được merge vào `main`? Lưu ý `feature/order` đã gộp `main`, `chat`, `voucher`, `escrow-wallet` nhưng **không có** `cart`, `notification`, `pricing`. | Quyết định khi nào các dòng `IN_PROGRESS` được phép code. |
| Q13 | `isRead` trong JSON của notification được serialize thành `read` hay `isRead`? | Hiển thị danh sách notification. |
| Q14 | Chu đã chốt kích hoạt qua OTP email. Backend local có `POST /api/v1/auth/verify-email` nhận `{ email, code, password }` và `POST /api/v1/auth/resend-verification` nhận `{ email }`. Cả hai trả `200` với `data: null`. OTP 6 số, hạn 5 phút, gửi lại sau 60 giây, tối đa 5 lần sai mỗi mã. OTP đúng mới cho lưu mật khẩu cuối cùng, chuyển `PENDING_VERIFICATION` sang `ACTIVE` và xóa mã. Tài khoản đã ACTIVE hoặc LOCKED bị chặn xác nhận. Đăng ký lại email pending trả `403 EMAIL_NOT_VERIFIED` để tiếp tục xác nhận. Chu đã kiểm tra gửi OTP qua Gmail thật; thay đổi mật khẩu cuối cùng chờ thử lại toàn luồng. | Trang đăng ký, xác nhận email và đăng nhập. |
| Q15 | Đã chốt và triển khai local: online đúng hạn SUCCESSFUL tự CONFIRMED, checkout PAID, product SOLD và xóa đúng item giỏ. Admin shipping/delivery chỉ cho các trạng thái hợp lệ; DELIVERED online không tự COMPLETED. | Chưa có buyer xác nhận nhận hàng hoặc refund online đã trả tiền; xem 5.7.2. |
| Q16 | Đã chốt và nối local: tạo checkout giữ giỏ; online xóa đúng item sau server xác nhận tiền; COD xóa item của order sau admin ghi nhận đã thu tiền, không đợi các order khác. Giữ item không mua. | Cùng transaction với trạng thái tiền/đơn/sản phẩm; cart lỗi rollback toàn bộ, receipt có thể retry. |
| Q17 | Đã chốt và nối local: một product một món; chặn seller/owner/staff cùng store; online giữ 15 phút, COD giữ tới thu tiền hoặc hủy. Webhook và expire/cancel cùng thứ tự khóa checkout → payment → product. | Chu chốt hủy một order online chưa trả tiền sẽ hủy toàn checkout chung QR, trả mọi reservation và giữ giỏ. Tiền cũ/trễ không được bán một reservation mới. |
| Q18 | Chu chốt 2026-11-20: COD chờ chủ store xác nhận (staff đăng không có quyền xác nhận thay owner); admin cập nhật SHIPPING, DELIVERED và thu tiền. Buyer hủy trước SHIPPING khi chưa thu tiền, không refund COD. Hủy một phần giảm đúng tổng phải trả. | Đã nối và test local. Escrow, refund đã thu tiền và API danh sách đơn gian hàng còn riêng, chưa đưa stub vào. |

---

## 8. Bảo trì tài liệu

### Ghi nhận khi bàn giao Appraiser — 2026-11-21

Decision update sau khi Chu trả lời “duyệt 4 điểm” ngày 2026-11-21: chặn appraiser thẩm định sản phẩm của bản thân/shop sở hữu/shop đang làm staff; phải enforce ở apply, accept invitation và tạo/nhận assignment. BUSINESS_APPROVED, BACKEND_IMPLEMENTATION_PENDING: chưa sửa code hoặc có test chứng minh rule mới. Admin MVP là auth/users/stores/moderation/categories, chưa cho admin bypass OTP. Shared baseline sẽ review/tách commit rồi xin duyệt commit/push riêng, chưa phải baseline đã phát hành. Nội dung đầy đủ ở handoff; không hỏi lại các quyết định đã chốt.

Xem [HANDOFF-APPRAISER-FRONTEND.md](HANDOFF-APPRAISER-FRONTEND.md). Đã đọc scoped controller/DTO/service của local Backend `dc11b09` trên codex/selective-checkout-integration; chưa HTTP/security audit appraisal. Module hiện có `/api/v1/appraisal-requests`, appraisal-applications/invitations/assignments/reports/reviews, khác flow `/api/pricing/appraiser/queue` + claim trong snapshot cũ mục 4.2. Không coi các route cũ hoặc DTO chưa audit là contract triển khai. Application mới là ứng tuyển cho request, không phải hồ sơ xin role. `AppraisalConversationService` đang trả UUID placeholder; không nối chat từ field này. Apply chưa thấy APPRAISER guard ở controller/service đã đọc, cần test USER/foreign IDs và trao đổi Chu trước phát hành. PaginationConfig đặt request Pageable 1-based, Spring Page response number 0-based; chat nhận int page riêng nên không chép page-1 sang appraisal. Các phát hiện này chưa nâng trạng thái endpoint thành IMPLEMENTED/INTEGRATED. Chỉ ghi tài liệu, không sửa Backend trong lần bàn giao.

- Cập nhật tài liệu này **trong cùng Pull Request** mỗi khi một branch Backend được merge hoặc một Frontend service được thêm.
- Khi một dòng đổi trạng thái, ghi lại commit hoặc PR của Backend làm căn cứ.
- Giữ file này giống hệt nhau ở cả hai repo Frontend.
