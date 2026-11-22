# 01 - Project Overview (Tổng quan dự án)

> **Trạng thái:** BẢN NHÁP v0.1
> **Cập nhật:** 2026-11-08
> **Áp dụng cho:** `Moldy-Market-User-Frontend`
> **Mục đích:** Giới thiệu Moldy Market là gì, ai dùng, Frontend này chịu trách nhiệm phần nào, Backend đã có gì, và mọi tài liệu khác nên được đọc theo thứ tự nào.

Quy ước nhãn dùng xuyên suốt bộ tài liệu:

| Nhãn | Ý nghĩa |
|---|---|
| `[ĐÃ XÁC MINH BACKEND]` | Thông tin có trong doc 14, rút từ việc đọc source code Backend. |
| `[ĐÃ CẤU HÌNH]` | Đã thực sự có trong repo Frontend (công cụ, cấu hình, thư mục). |
| `[ĐỀ XUẤT]` | Kiến trúc Frontend dự kiến, **chưa có code**. Có thể thay đổi sau khi team review. |

> Hiện tại repo chỉ có phần nền (công cụ, cấu hình, cấu trúc thư mục, design tokens, i18n). **Chưa có trang, router, service, hook hay store nào.** Mọi thứ thuộc lớp ứng dụng trong bộ tài liệu này là `[ĐỀ XUẤT]`.

---

## 1. Moldy Market là gì

Moldy Market là một sàn thương mại điện tử **C2C (consumer to consumer) chuyên đồ cũ**: người dùng bình thường đăng bán đồ đã qua sử dụng, và người khác mua lại. Ngoài người bán cá nhân, hệ thống còn có **gian hàng (store)** để một người bán nhiều sản phẩm, có thể thêm nhân viên (staff) cùng quản lý.

Đây là **đồ án tốt nghiệp** của một nhóm sinh viên. Backend (Spring Boot) và Frontend (React) được làm song song bởi các thành viên khác nhau, nên việc ghi lại chính xác "Backend hiện có gì" (doc 14) quan trọng không kém việc viết code.

### 1.1 Vấn đề sản phẩm muốn giải quyết

Đồ cũ khó mua bán vì thiếu tin cậy: không biết giá có hợp lý không, tình trạng thật ra sao, người bán có đáng tin không, thanh toán xong có nhận được hàng không. Theo các tài liệu thiết kế của team, hệ thống hướng tới giải quyết bằng các cơ chế sau. **Chỉ phần ghi `IMPLEMENTED` ở mục 4 là đã có code Backend trên `main`**; các cơ chế còn lại là ý định thiết kế:

- Định giá hỗ trợ (auto pricing, appraiser/thẩm định viên, giá tham chiếu): phần Backend nằm ở branch chưa merge.
- Thanh toán an toàn qua escrow (giữ tiền, giải ngân sau): phần Backend nằm ở branch chưa merge, và chưa nối với order thật (doc 14, B7).
- Thương lượng giá (offer): chưa có code ở bất kỳ branch nào (`NOT_FOUND`).
- Đánh giá, theo dõi gian hàng, wishlist: chưa có code (`NOT_FOUND`).

Frontend **không được** trình bày một cơ chế như thể nó đã hoạt động khi Backend chưa có.

---

## 2. Người dùng và vai trò

Backend định nghĩa 5 tên role `[ĐÃ XÁC MINH BACKEND]`: `USER`, `APPRAISER`, `STAFF`, `ADMIN`, `OWNER`. Việc gán role **gắn theo từng gian hàng** (`UserRole(user_id, role_id, store_id)`).

Bảng dưới là cách **Frontend này** nhìn các nhóm người dùng. Cột "Role Backend" là điều đã xác minh; cột "Ghi chú" là cách dùng trong giao diện.

| Nhóm người dùng | Role Backend | Làm được gì trong User Frontend | Ghi chú |
|---|---|---|---|
| Khách (chưa đăng nhập) | không có | Xem trang chủ, tìm kiếm, xem sản phẩm, danh mục, trang gian hàng | Các endpoint đọc công khai: category, product, store theo id `[ĐÃ XÁC MINH BACKEND]`. |
| Người dùng thường | `USER` | Hồ sơ, đổi mật khẩu, đăng tin cá nhân, mở gian hàng; mua hàng, giỏ hàng, chat, notification khi Backend merge | Một user vừa mua vừa bán được, không có role riêng "buyer" hay "seller". |
| Chủ gian hàng | `OWNER` (gắn `store_id`) | Store Dashboard: hồ sơ gian hàng, sản phẩm, staff | Mỗi user chỉ có một gian hàng (`STORE_002`). |
| Nhân viên gian hàng | `STAFF` (gắn `store_id`) | Phần của Store Dashboard theo quyền được chủ ủy quyền | Frontend chưa đọc được permission của chính mình (Q1). |
| Thẩm định viên | `APPRAISER` | Hàng đợi thẩm định giá | Toàn bộ là `IN_PROGRESS` (branch pricing). |
| Quản trị viên | `ADMIN` | **Không dùng User Frontend.** Dùng Admin Frontend (repo riêng). | Xem `Moldy-Market-Admin-Frontend`. |

> Ghi chú: Frontend không phải ranh giới bảo mật. Ẩn một nút chỉ để giao diện gọn; việc cho phép hay từ chối thật sự là của Backend (trả `403`).

---

## 3. Phạm vi của repo này

### 3.1 Hai ứng dụng Frontend độc lập

Dự án có **hai repo Frontend tách biệt, không chia sẻ code**:

| Repo | Đối tượng | Nội dung chính |
|---|---|---|
| `Moldy-Market-User-Frontend` (repo này) | Khách, người mua, người bán, chủ và staff gian hàng, thẩm định viên | Duyệt và tìm sản phẩm, đăng tin, quản lý gian hàng, (sau này) giỏ hàng, thanh toán, chat |
| `Moldy-Market-Admin-Frontend` | Quản trị viên | Quản lý user, gian hàng, kiểm duyệt sản phẩm, danh mục |

Lý do tách riêng `[ĐỀ XUẤT]`: hai ứng dụng có người dùng, bố cục, rủi ro bảo mật và nhịp phát hành khác nhau. Tách repo giúp bundle của người dùng không chứa mã quản trị, và mỗi bên deploy độc lập. Đổi lại, các phần chung (design tokens, quy ước) bị lặp ở hai nơi; hai repo phải được đối chiếu định kỳ (nằm trong roadmap, doc 13).

### 3.2 Việc Frontend làm và không làm

| Frontend LÀM | Frontend KHÔNG làm |
|---|---|
| Hiển thị dữ liệu Backend trả về | Tự tính giá, tổng tiền, phí để quyết định số tiền thanh toán (Backend tính, doc 14 mục 5.7) |
| Kiểm tra form để người dùng sửa lỗi sớm (validation phía client) | Coi validation phía client là bảo mật (Backend vẫn kiểm tra lại) |
| Ẩn/hiện menu theo role để giao diện gọn | Quyết định ai được làm gì (`403` của Backend là quyết định cuối) |
| Hiển thị QR thanh toán từ `qrBankUrl` do Backend trả | Tự dựng QR, hoặc tự tuyên bố "thanh toán thành công" (chỉ tin `paymentStatus === "SUCCESSFUL"`) |
| Ánh xạ mã lỗi (`code`) sang câu thông báo i18n | Hiển thị nguyên văn `message` tiếng Anh của Backend |
| Polling trạng thái thanh toán (Backend chưa có kênh push) | Tự suy luận trạng thái order từ đồng hồ đếm ngược |

---

## 4. Các module và tình trạng Backend / Frontend (Cập nhật 2026-11-22)

Bảng tóm tắt từ doc 14 (xem doc 14 mục 4 để có endpoint chi tiết).

| Module | Trạng thái Backend | Ghi chú cho User Frontend | FE |
|---|---|---|---|
| Xác thực & Email OTP (đăng ký, OTP, đăng nhập, refresh cookie, logout) | `IMPLEMENTED` | HttpOnly cookie `moldy_refresh` + `X-Moldy-Auth: 1`; OTP kích hoạt ngay | `IMPLEMENTED_LOCAL` |
| Hồ sơ cá nhân, đổi mật khẩu | `IMPLEMENTED` | `/users/me` trả `roles`, `permissions`, `storeId` | `IMPLEMENTED_LOCAL` |
| Gian hàng (tạo, xem, sửa, trang công khai) | `IMPLEMENTED` | Mỗi user một gian hàng; `PublicStoreResponse` có `ownerId` | `IMPLEMENTED_LOCAL` |
| Staff của gian hàng | `IMPLEMENTED` (thêm trực tiếp bằng email), mời staff `PLANNED` | `GET /staff/me` dùng `STORE_WORKSPACE_ACCESS` | `IMPLEMENTED_LOCAL` |
| Danh mục (category) | `IMPLEMENTED` | Đọc công khai | `INTEGRATED` |
| Sản phẩm (CRUD, đổi trạng thái, tìm kiếm, tin cá nhân/shop) | `IMPLEMENTED` | Update cần `version`; reservation giữ chỗ; ảnh URL https | `IMPLEMENTED_LOCAL` |
| Giỏ hàng (Cart, qty=1) | `IMPLEMENTED` | `listingId = Product.id`; chặn tự mua `CART_001` | `IMPLEMENTED_LOCAL` |
| Checkout, Order (người mua & gian hàng), SePay + COD | `IMPLEMENTED_LOCAL` | B11/B12 đã sửa local; B13 (`orders/me` 404 khi rỗng) FE chuyển thành `[]` | `IMPLEMENTED_LOCAL` |
| Chat (REST + WebSocket STOMP + Read cursors) | `IMPLEMENTED_LOCAL` | 1 kết nối STOMP ở `MainLayout`; chặn chat staff–owner cùng shop (`CHAT_005`) | `IMPLEMENTED_LOCAL` |
| Notification (DynamoDB) | `IMPLEMENTED` | Phân trang cursor, chưa có push realtime | `NOT_STARTED` |
| Appraiser & Appraisal 6 bước, Voucher, Auto Pricing, Wallet, File Storage | Đã merge `main`, cần Audit | Xem `HANDOFF-APPRAISER-FRONTEND.md`; B2 mở trên Wallet/Escrow/Withdrawal | `NOT_STARTED` |
| Offer, refund, dispute, wishlist, follow, review, thống kê doanh thu | `NOT_FOUND` | Chỉ có skeleton `TODO`, không viết code API | `NOT_STARTED` |

Quy tắc phát triển rút từ doc 14 mục 1.2: chỉ viết service gọi API cho endpoint đã xác minh/audit; `PLANNED`/`NOT_FOUND` chỉ làm skeleton.

---

## 5. Công nghệ sử dụng `[ĐÃ CẤU HÌNH]`

Ngôn ngữ: **JavaScript** (không TypeScript), dùng JSDoc cho kiểu dữ liệu khi cần. Phiên bản lấy từ `package.json`.

| Mảng | Công nghệ | Phiên bản | Vai trò |
|---|---|---|---|
| Runtime | Node.js | `>=22.12.0` (`.nvmrc` = 22) | Chạy công cụ build |
| Build | Vite, `@vitejs/plugin-react` | ^8.3.5, ^6.1.2 | Dev server, build, proxy `/api` & `/chat` |
| UI | React, react-dom | ^19.3.1 | Thư viện giao diện |
| Style | Tailwind CSS (qua `@tailwindcss/vite`) | ^4.3.4 | Utility CSS, cấu hình trong `src/index.css` |
| Component | shadcn/ui (`radix-nova`), radix-ui, cva, tw-animate-css, lucide-react | shadcn ^4.23.0 | Component nền (`button`), icon |
| Tiện ích class | clsx, tailwind-merge (hàm `cn` ở `src/lib/utils.js`) | | Gộp class Tailwind |
| Routing | react-router | ^7.18.5 | Điều hướng (`createBrowserRouter`) |
| HTTP & Realtime | axios, `@stomp/stompjs`, `sockjs-client` | ^1.21.0 | Gọi REST & WebSocket STOMP/SockJS (`/chat`) |
| Server state | @tanstack/react-query | ^5.105.3 | Cache và đồng bộ dữ liệu từ API |
| Client state | zustand | ^5.0.16 | Trạng thái giao diện cục bộ (hiện chưa cần dùng) |
| Form | react-hook-form, zod, @hookform/resolvers | ^7.91.0, ^4.6.7, ^7.0.1 | Form và validation |
| i18n | i18next, react-i18next | ^26.7.1, ^17.1.11 | Đa ngôn ngữ (`vi`, `en`, 514 keys, 100% parity) |
| Kiểm thử & Chất lượng | Vitest, React Testing Library, ESLint 10, Prettier, GitHub Actions CI | | 49 test files / 449 tests pass, lint, format, build |
| Font | @fontsource/be-vietnam-pro, @fontsource-variable/playfair-display | | Tự host font |

Playwright E2E mới chỉ là kế hoạch.

---

## 6. Ranh giới hệ thống

```mermaid
flowchart LR
  subgraph Client["Trình duyệt người dùng"]
    FE["Moldy-Market-User-Frontend<br/>React + Vite"]
  end
  subgraph Dev["Máy dev"]
    PX["Vite dev server<br/>proxy /api & /chat"]
  end
  subgraph Server["Hệ thống Backend"]
    BE["Spring Boot REST API<br/>/api/v1 và /api"]
    WS["WebSocket STOMP /chat<br/>(SockJS)"]
    DB[("PostgreSQL + DynamoDB")]
  end
  SEPAY["SePay<br/>(cổng thanh toán)"]

  FE -->|"gọi /api/... cùng origin"| PX
  PX -->|"chuyển tiếp tới API_PROXY_TARGET"| BE
  FE -->|"STOMP qua SockJS (/chat)"| WS
  BE --> DB
  SEPAY -->|"webhook HMAC<br/>(chỉ Backend nhận)"| BE
```

Điểm cần nhớ:

- Khi dev, trình duyệt gọi `/api/...` và `/chat` trên **cùng origin** với Vite; Vite proxy chuyển tiếp tới Backend (`API_PROXY_TARGET`, mặc định `http://localhost:8080`).
- Khi production cross-origin dùng HttpOnly cookie, Backend cần bổ sung `allowCredentials(true)` và `X-Moldy-Auth` vào `SecurityConfig` CORS (doc 14 mục 2.4).
- Frontend **không bao giờ gọi** webhook SePay. Chỉ SePay gọi Backend.
- Không có kênh push cho notification và thanh toán; Frontend polling checkout (`paymentStatus === "SUCCESSFUL"`).

---

## 7. Tình trạng hiện tại của repo (2026-11-22)

| Hạng mục | Trạng thái |
|---|---|
| Công cụ (Vite, React, Tailwind, shadcn, ESLint, Prettier, Vitest/RTL, CI, PR template, `index.html`) | `[ĐÃ TRIỂN KHAI]` |
| App shell (AppProviders, queryClient, routes.js, MainLayout, AuthLayout, RequireAuth, GuestOnly, feedback components) | `[ĐÃ TRIỂN KHAI]` |
| API core (`client`, `unwrap`, `ApiError`, `pagination`, `authRefreshInterceptor`, `tokenStorage`) | `[ĐÃ TRIỂN KHAI]` |
| i18n (`vi`, `en`, namespace `common`) | `[ĐÃ TRIỂN KHAI]` — 514 keys, 100% parity |
| 9 feature modules (auth/OTP, marketplace, products, stores/staff, profile, cart, checkout/payment, buyer & store orders, chat realtime/read) | `[ĐÃ TRIỂN KHAI]` (local) — 49 test files / 449 tests pass, `lint` & `build` pass |
| Appraiser workspace, Notifications, Wallet/Voucher | `NOT_STARTED` (xem `HANDOFF-APPRAISER-FRONTEND.md` và doc 13) |

---

## 8. Hướng dẫn đọc bộ tài liệu

| Bạn muốn... | Đọc |
|---|---|
| Hiểu kiến trúc, thư mục, quy tắc phụ thuộc | 02 |
| Xem màu, font, component UI, responsive | 03 |
| Biết có những route/trang nào | 04, 05 |
| Biết cách tổ chức component | 06 |
| Biết Backend thật sự có gì để gọi | 14 (và 07 cho cách gọi) |
| Làm đăng nhập, phân quyền | 08 |
| Biết state nằm ở đâu | 09 |
| Xem luồng nghiệp vụ end-to-end | 10 |
| Quy tắc đặt tên và code | 11 |
| Cài đặt, biến môi trường, build | 12 |
| Biết thứ tự việc cần làm | 13 |
| Đóng góp code, mở PR | 15 |

**Nguyên tắc vàng:** nếu một thông tin không có trong doc 14, hãy coi là *chưa biết*; hỏi team Backend và cập nhật doc 14, đừng tự bịa endpoint, DTO hay quy tắc nghiệp vụ.

---

## 9. Thuật ngữ

| Thuật ngữ | Nghĩa trong dự án |
|---|---|
| Store (gian hàng) | Cửa hàng của một user, có thể có staff. **Không** phải "store" của Zustand (vì vậy thư mục Zustand tên `state/`). |
| Listing / product | Một tin đăng bán một món đồ. Backend gọi là `Product`, riêng cart gọi `listingId` (Q7). |
| Tin cá nhân | Product có `storeId = null` (người bán không qua gian hàng). |
| Staff | Nhân viên của gian hàng, quyền do chủ ủy quyền. |
| Appraiser | Thẩm định viên định giá sản phẩm. |
| Escrow | Cơ chế giữ tiền tạm thời đến khi giao dịch hoàn tất. |
| Checkout group | Một lần thanh toán có thể gồm nhiều order (tách theo người bán và gian hàng). |
| Envelope | Khung `ApiResponse { success, code, message, data, timestamp }` bọc mọi REST response. |

---

## Tài liệu liên quan

- 02 - Frontend Architecture
- 03 - Design System
- 07 - API Integration
- 13 - Development Roadmap
- 14 - Backend Integration Matrix (nguồn sự thật về Backend)
