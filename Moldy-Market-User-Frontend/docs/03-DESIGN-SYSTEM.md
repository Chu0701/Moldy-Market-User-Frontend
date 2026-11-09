# 03 - Design System (Hệ thống thiết kế)

> **Trạng thái:** BẢN NHÁP v0.1
> **Cập nhật:** 2026-11-08
> **Áp dụng cho:** `Moldy-Market-User-Frontend`
> **Mục đích:** Chốt các quy tắc nhìn và cảm (màu, chữ, khoảng cách, bo góc, bóng, thành phần, responsive) để mọi người code giao diện giống nhau, không phải đoán.

Nhãn dùng trong tài liệu:
- `[ĐÃ CẤU HÌNH]`: đã thật sự có trong repo (chủ yếu là `src/index.css` và `components.json`).
- `[ĐỀ XUẤT]`: quy tắc dự kiến, **chưa có code**. Các đoạn code là ví dụ minh họa, chưa có trong repo.
- `[ĐÃ XÁC MINH BACKEND]`: có trong doc 14 (ở đây chỉ dùng cho giá trị enum cần màu trạng thái).

Phạm vi hiện tại: **chỉ giao diện sáng (light)**. Khối `.dark` có trong `index.css` do shadcn sinh ra nhưng dark mode **nằm ngoài phạm vi** và không được dùng.

---

## 1. Nguyên tắc thiết kế `[ĐỀ XUẤT]`

1. **Đơn sắc, tinh tế.** Giao diện dựa trên nền trắng và thang xám trung tính, chữ gần đen. Màu sắc chỉ xuất hiện khi mang **ý nghĩa** (thành công, cảnh báo, lỗi, thông tin). Điều này làm ảnh sản phẩm đồ cũ nổi bật, vì ảnh là thứ người mua cần nhìn nhất.
2. **Tham chiếu Mercari chỉ về UX.** Mercari là sàn đồ cũ nổi tiếng nên ta học cách tổ chức trải nghiệm: lưới sản phẩm dày, giá rõ, tìm kiếm là trung tâm, đăng bán đơn giản. Ta **không sao chép** giao diện, logo, màu, hình ảnh hay chữ của họ.
3. **Mật độ vừa phải, ưu tiên đọc.** Chữ tiếng Việt có dấu cần dòng cao hơn chữ không dấu (mục 3).
4. **Nhất quán hơn sáng tạo.** Dùng token và component có sẵn; nếu cần một giá trị mới, thêm vào token trước rồi mới dùng, không gõ mã màu trực tiếp trong component.
5. **Không dựa vào màu một mình.** Trạng thái phải có chữ hoặc biểu tượng đi kèm (người mù màu, màn hình in trắng đen).

---

## 2. Màu sắc và design token

### 2.1 Cách hoạt động `[ĐÃ CẤU HÌNH]`

Token màu là **biến CSS** khai báo trong `:root` của `src/index.css` theo chuẩn shadcn (ví dụ `--background`, `--primary`). Khối `@theme inline` ánh xạ chúng thành màu của Tailwind, nên bạn viết `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`... chứ không viết mã màu.

Vì sao dùng biến CSS thay vì viết thẳng màu: đổi một giá trị ở `index.css` là cả app đổi theo, và component shadcn (đọc cùng bộ biến) tự khớp. Tailwind 4 **không có** `tailwind.config.js`; mọi cấu hình nằm trong CSS.

### 2.2 Bảng token `[ĐÃ CẤU HÌNH]`

| Token | Giá trị | Class Tailwind | Dùng cho |
|---|---|---|---|
| `--background` | `#ffffff` | `bg-background` | Nền trang |
| `--foreground` | `#252525` | `text-foreground` | Chữ chính |
| `--primary` | `#252525` | `bg-primary` | Nút chính, điểm nhấn chính |
| `--primary-foreground` | trắng | `text-primary-foreground` | Chữ trên nền primary |
| `--secondary`, `--muted`, `--accent` | `#f3f4f6` | `bg-secondary`, `bg-muted`, `bg-accent` | Bề mặt phụ (surface): thẻ nhạt, vùng nhóm, hover |
| `--muted-foreground` | `#777777` | `text-muted-foreground` | Chữ phụ, chú thích |
| `--card`, `--popover` | trắng | `bg-card`, `bg-popover` | Thẻ, hộp nổi |
| `--border`, `--input` | `oklch(0.922 0 0)` | `border-border`, `border-input` | Viền, viền ô nhập |
| `--ring` | `oklch(0.708 0 0)` | `ring-ring` | Viền focus |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `bg-destructive`, `text-destructive` | Lỗi, hành động xóa |
| `--success` | `#15803d` | `text-success`, `bg-success` | Thành công |
| `--warning` | `#b45309` | `text-warning`, `bg-warning` | Cảnh báo |
| `--info` | `#1d4ed8` | `text-info`, `bg-info` | Thông tin |
| `--success-foreground`, `--warning-foreground`, `--info-foreground` | trắng | `text-success-foreground`... | Chữ trên nền màu ngữ nghĩa |
| `--chart-1` đến `--chart-5` | thang xám | `fill-chart-1`... | Biểu đồ (chưa dùng ở User) |
| `--sidebar-*` | bộ biến sidebar | `bg-sidebar`... | Sidebar (dùng cho Store Dashboard khi code) |

Ghi chú:
- Ba màu ngữ nghĩa `success`, `warning`, `info` là **giá trị khởi đầu** do team thêm vào, cần xem lại khi có thiết kế chính thức. Mã màu chính xác nằm ở `index.css`; nếu bảng này và `index.css` khác nhau thì `index.css` đúng.
- Tên class `text-success`... chỉ chạy nếu khối `@theme inline` đã ánh xạ chúng. Nếu không thấy màu, kiểm tra `index.css` trước khi nghi ngờ code khác.

### 2.3 Độ tương phản (accessibility) `[ĐỀ XUẤT]`

Tiêu chuẩn WCAG AA cho chữ thường là tỉ lệ tương phản tối thiểu 4,5:1. Số liệu dưới đây là **tính toán xấp xỉ** từ mã màu, cần đo lại bằng công cụ khi có thiết kế chính thức:

| Chữ | Trên nền trắng | Trên nền `#f3f4f6` | Nhận xét |
|---|---|---|---|
| `#252525` (chữ chính) | khoảng 15,3:1 | khoảng 13,9:1 | Rất tốt |
| `#777777` (chữ phụ) | khoảng 4,48:1 | khoảng 4,07:1 | **Sát ngưỡng, hơi thiếu.** Chỉ dùng cho chữ phụ cỡ từ 14px trở lên khi đặt trên nền trắng. Không dùng cho chữ quan trọng và không đặt trên nền xám nhạt |
| `#15803d` (success) | khoảng 5,0:1 | khoảng 4,6:1 | Đạt |
| `#b45309` (warning) | khoảng 5,0:1 | khoảng 4,6:1 | Đạt |
| `#1d4ed8` (info) | khoảng 6,7:1 | khoảng 6,1:1 | Tốt |

Hệ quả: nếu cần chữ phụ ở cỡ nhỏ (12px) hoặc trên nền xám, hãy dùng màu tối hơn (ví dụ `#5f5f5f`) bằng cách chỉnh token `--muted-foreground`, không tự chọn màu riêng trong component.

### 2.4 Màu trạng thái nghiệp vụ `[ĐÃ XÁC MINH BACKEND]` + `[ĐỀ XUẤT]`

Component `StatusBadge` (doc 06) ánh xạ giá trị enum Backend sang màu. Nhớ: enum Backend **không** được dịch ở Backend, Frontend tự ánh xạ sang key i18n và màu, và có nhánh mặc định (xám) cho giá trị lạ.

| Enum (doc 14 mục 5.6, 5.7) | Giá trị | Màu đề xuất |
|---|---|---|
| `ProductStatus` | `ACTIVE` | success |
| | `HIDDEN` | muted (xám) |
| | `SOLD` | info |
| | `DELETED`, `REMOVED` | destructive |
| `ProductCondition` | `NEW`, `LIKE_NEW`, `USED`, `DAMAGED` | muted (nhãn trung tính; `DAMAGED` có thể warning) |
| `StoreStatus` | `ACTIVE` | success |
| | `BLOCKED` | destructive |
| `PaymentStatus` (`IN_PROGRESS`) | `PENDING`, `PROCESSING` | warning |
| | `SUCCESSFUL` | success |
| | `FAILED` | destructive |

Không dùng màu cho `OrderStatus` lúc này vì phần lớn chuyển trạng thái chưa có code Backend (doc 14 mục 5.7); sẽ bổ sung khi luồng order được chốt.

---

## 3. Typography (chữ)

### 3.1 Font `[ĐÃ CẤU HÌNH]`

| Vai trò | Font | Cách cài | Biến | Weight đang nạp |
|---|---|---|---|---|
| Nội dung (body), UI | **Be Vietnam Pro** | `@fontsource/be-vietnam-pro`, tự host | `--font-sans` | 400, 500, 600, 700 |
| Tiêu đề `h1`, `h2`, `h3` | **Playfair Display** (biến thể variable) | `@fontsource-variable/playfair-display`, tự host | `--font-heading` | variable (một file phủ nhiều weight) |

Vì sao hai font: Be Vietnam Pro được thiết kế cho tiếng Việt nên dấu hiển thị đẹp ở cỡ nhỏ, hợp cho nội dung và nút. Playfair Display là chữ có chân (serif) cho tiêu đề, tạo cảm giác "biên tập" (editorial) khác biệt với giao diện chung chung.

Vì sao **tự host** (fontsource) thay vì nhúng Google Fonts: không phụ thuộc dịch vụ ngoài khi chạy, không gửi địa chỉ IP người dùng sang Google, và font được bundle cùng app nên tải ổn định.

Thẻ `h1`, `h2`, `h3` tự dùng `--font-heading` (đã khai báo trong `index.css`). `h4` trở xuống dùng font body.

Lưu ý: người dùng nhận xét font này "tạm được", nên có thể đổi sau. Ứng viên thay thế đã nêu: Fraunces cho tiêu đề và Inter cho body. Vì mọi component dùng `font-sans` và `font-heading` qua biến, **đổi font chỉ cần sửa `index.css` và `package.json`**, không sửa component. Nếu đổi, phải kiểm tra lại hiển thị dấu tiếng Việt (ví dụ "ặ", "ữ", "ợ") ở mọi weight.

### 3.2 Thang cỡ chữ `[ĐỀ XUẤT]`

Dùng class Tailwind mặc định. Cỡ chữ Tailwind kèm `line-height` mặc định; với tiếng Việt có dấu chồng nên **không dùng line-height nhỏ hơn 1,4 cho nội dung đoạn văn**.

| Vai trò | Class gợi ý | Ghi chú |
|---|---|---|
| Tiêu đề trang `h1` | `text-3xl md:text-4xl font-semibold` | Font heading. Mỗi trang đúng một `h1` |
| Tiêu đề khối `h2` | `text-2xl font-semibold` | Font heading |
| Tiêu đề nhỏ `h3` | `text-xl font-semibold` | Font heading |
| Tiêu đề thẻ (tên sản phẩm) | `text-sm font-medium` hoặc `text-base font-medium`, `line-clamp-2` | Font body. Không dùng thẻ `h3` mặc định nếu chỉ là tên trên card, vì `h3` bị ép font serif |
| Nội dung | `text-base` (16px) | Mặc định |
| Nội dung phụ | `text-sm` (14px) | Chú thích, thông tin phụ |
| Nhãn rất nhỏ | `text-xs` (12px) | Chỉ cho nhãn/badge, không dùng cho đoạn văn |
| Giá | `text-lg` đến `text-2xl font-semibold` | Số căn đều, xem mục 3.4 |

Quy tắc dùng:
- Độ đậm: 400 cho đoạn văn, 500 cho nhãn và nút, 600 cho tiêu đề, 700 chỉ để nhấn mạnh hiếm (giá lớn).
- Độ dài dòng đọc thoải mái: khoảng 60 đến 75 ký tự (`max-w-prose` cho đoạn mô tả sản phẩm).
- Không dùng chữ in hoa toàn bộ cho đoạn dài (khó đọc, và dấu tiếng Việt in hoa rối).
- Cỡ chữ ô nhập trên mobile tối thiểu 16px để iOS không tự phóng to khi focus.

### 3.3 Chữ ở thẻ sản phẩm `[ĐỀ XUẤT]`

Tên sản phẩm tối đa 150 ký tự (doc 14 mục 5.6) nên **phải cắt dòng** bằng `line-clamp-2`, nếu không lưới sản phẩm lệch hàng.

### 3.4 Hiển thị giá và số `[ĐỀ XUẤT]`

- Định dạng bằng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`, đóng gói ở component `ProductPrice` (doc 06). Không nối chuỗi tay.
- Dùng `tabular-nums` cho cột giá trong bảng để các chữ số thẳng hàng.
- Giá hiển thị là giá Backend trả. Ở checkout, **không tự tính tổng** mà chỉ hiển thị `totalAmount` do Backend trả (doc 14 mục 5.7).
- Giá sản phẩm hợp lệ trong khoảng lớn hơn 0 đến 1.000.000.000, tối đa 2 chữ số thập phân (doc 14 mục 5.6): cột giá cần đủ rộng cho 13 ký tự.

---

## 4. Khoảng cách (spacing) `[ĐỀ XUẤT]`

Dùng thang mặc định của Tailwind (đơn vị cơ bản `0,25rem` = 4px; `p-4` = 16px). Không dùng giá trị tùy ý như `p-[13px]`.

| Mục đích | Giá trị gợi ý |
|---|---|
| Khoảng cách giữa icon và chữ | `gap-2` (8px) |
| Khoảng cách giữa các trường form | `space-y-4` hoặc `gap-4` (16px) |
| Padding thẻ (card) | `p-4` mobile, `p-6` desktop |
| Khoảng cách giữa các khối trong trang | `space-y-8` hoặc `gap-8` (32px) |
| Khoảng cách giữa hai section lớn | `py-12` hoặc `py-16` |
| Khoảng cách các thẻ trong lưới | `gap-3` mobile, `gap-4` đến `gap-6` desktop |
| Lề ngang của trang (gutter) | `px-4` mobile, `px-6` từ `md`, `px-8` từ `lg` |

Chiều rộng nội dung tối đa: đề xuất `max-w-7xl` (80rem) cho `MainLayout`, căn giữa bằng `mx-auto`. Trang form (đăng nhập, đăng ký) dùng `max-w-md`.

---

## 5. Bo góc, viền, bóng

### 5.1 Bo góc `[ĐÃ CẤU HÌNH]`

`--radius: 0.625rem` (10px) là gốc; thang `rounded-sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl` được suy ra từ nó theo mẫu shadcn, nên đổi `--radius` là mọi góc đổi theo. Công thức suy ra chính xác xem `index.css`.

Quy tắc dùng `[ĐỀ XUẤT]`:
- Nút, ô nhập: `rounded-md` (mặc định của shadcn).
- Thẻ sản phẩm, hộp thoại: `rounded-lg` hoặc `rounded-xl`.
- Ảnh sản phẩm trong lưới: cùng bo góc với thẻ.
- Avatar: `rounded-full`.
- Không trộn quá nhiều mức bo góc trong cùng một màn hình.

### 5.2 Viền `[ĐỀ XUẤT]`

Ưu tiên **viền mảnh** (`border`, màu `border-border`) thay cho bóng để phân tách, hợp với phong cách đơn sắc. Viền 1px, không dùng viền đậm trừ trạng thái focus hoặc đang chọn.

### 5.3 Bóng đổ `[ĐỀ XUẤT]`

Dùng bóng mặc định của Tailwind, ít và nhẹ:

| Dùng cho | Class |
|---|---|
| Thẻ mặc định | không bóng, chỉ viền |
| Hover thẻ sản phẩm | `shadow-sm` hoặc `shadow-md` |
| Menu thả xuống, popover | `shadow-md` |
| Hộp thoại (dialog) | `shadow-lg` |

---

## 6. Thành phần giao diện (component)

Mọi thành phần dưới đây là **quy tắc nhìn và cảm**. Vai trò, props và vị trí thư mục nằm ở doc 06. Chỉ `button` đã có trong repo `[ĐÃ CẤU HÌNH]`; còn lại thêm bằng `npx shadcn@latest add <tên>` khi cần.

### 6.1 Button

- Biến thể của shadcn: `default` (nền primary, dùng cho **một** hành động chính mỗi khu vực), `outline` (hành động phụ), `secondary`, `ghost` (hành động nhẹ trong thanh công cụ), `destructive` (xóa), `link`.
- Mỗi màn hình chỉ có **một** nút `default` nổi bật (ví dụ "Đăng tin", "Mua ngay").
- Nút đang gửi: vô hiệu hóa và hiện spinner, chữ không đổi chiều rộng để khỏi nhảy bố cục. Chống gửi hai lần.
- Chiều cao tối thiểu 40px trên mobile (vùng chạm 44px là lý tưởng).
- Nút chỉ có icon phải có `aria-label`.

### 6.2 Input và form

- Mỗi ô có `label` hiển thị rõ (không thay label bằng placeholder). Placeholder chỉ là ví dụ.
- Lỗi hiện **dưới ô**, màu `text-destructive`, kèm chữ nói rõ lỗi gì. Không chỉ đổi màu viền.
- Thông báo lỗi lấy từ key i18n, **không** hiển thị `message` tiếng Anh của Backend (doc 07).
- Ràng buộc hiển thị cho người dùng lấy đúng từ Backend, ví dụ mật khẩu 8 đến 100 ký tự, tên sản phẩm tối đa 150, mô tả tối đa 2000 (doc 14 mục 3.1, 5.6). Validation ở Frontend chỉ để phản hồi nhanh, Backend vẫn là nơi quyết định.
- Trạng thái focus phải thấy rõ (viền `ring`). Không tắt outline mà không thay thế.

### 6.3 Card

- Thẻ sản phẩm: ảnh vuông hoặc tỉ lệ cố định (`aspect-square` hoặc `aspect-[4/5]`) với `object-cover`, bên dưới là tên (`line-clamp-2`), giá, và thông tin phụ (tình trạng, gian hàng). Cố định tỉ lệ ảnh để lưới không giật khi ảnh tải xong.
- Có ảnh dự phòng khi URL ảnh lỗi (ảnh product là URL ngoài chưa kiểm soát được, Q5), qua `ImageWithFallback`.
- Cả thẻ là một vùng bấm (liên kết tới `/products/:productId`).

### 6.4 Table

Dùng ở Store Dashboard (danh sách sản phẩm, staff).
- Tiêu đề cột `text-sm font-medium text-muted-foreground`; dòng cách nhau bằng viền mảnh.
- Cột số và giá căn phải, `tabular-nums`.
- Dưới `md` (mobile), bảng nhiều cột **không** nhét vừa: hoặc cuộn ngang trong `overflow-x-auto`, hoặc chuyển thành danh sách thẻ. Chọn một cách và dùng nhất quán.
- Phân trang bằng `PaginationBar` với dạng phân trang đã chuẩn hóa (doc 07 mục 6).

### 6.5 Modal (Dialog) và Sheet

- `Dialog` cho xác nhận ngắn và form nhỏ (thêm staff, xác nhận xóa). `ConfirmDialog` cho hành động nguy hiểm: nêu **rõ đối tượng** bị ảnh hưởng ("Xóa sản phẩm X?"), nút xác nhận có nhãn động từ cụ thể, không chỉ "OK".
- `Sheet` (ngăn kéo) cho menu mobile và bộ lọc sản phẩm trên mobile.
- Mở modal phải đưa focus vào trong và đóng được bằng phím `Esc`; component shadcn (Radix) đã lo việc này, đừng tự viết lại.

### 6.6 Badge và nhãn trạng thái

- `StatusBadge` ánh xạ enum sang màu theo mục 2.4. Chữ ngắn, `text-xs`, kèm chấm hoặc biểu tượng nhỏ nếu cần, không chỉ dựa vào màu.

### 6.7 Thành phần phản hồi (feedback) `[ĐỀ XUẤT]`

| Tình huống | Thành phần | Quy tắc |
|---|---|---|
| Tải lần đầu | `PageSkeleton`, `CardSkeleton` | Giữ đúng bố cục thật để không giật |
| Tải ngắn, nút đang gửi | `LoadingSpinner` | Dùng ít |
| Danh sách rỗng | `EmptyState` | Có câu giải thích và, nếu hợp lý, nút hành động. Cũng dùng cho `orders/me` khi Backend trả 404 `ORDER_003` (B13), không hiện như lỗi |
| Lỗi tải | `ErrorState` | Có nút "Thử lại" |
| Không đủ quyền (403) | `ForbiddenState` | Không đăng xuất người dùng |
| Thao tác xong | Toast (`sonner`) | Ngắn, tự tắt sau vài giây, không dùng cho lỗi nghiêm trọng cần đọc kỹ |
| Lỗi trong form | `InlineError` | Ngay tại chỗ |

Thông báo hệ thống không che nội dung chính và không chặn thao tác tiếp theo.

---

## 7. Responsive `[ĐỀ XUẤT]`

### 7.1 Breakpoint

Dùng breakpoint mặc định của Tailwind 4 (không tùy chỉnh):

| Tên | Từ độ rộng | Thiết bị điển hình |
|---|---|---|
| (mặc định) | 0 | Điện thoại |
| `sm` | 640px | Điện thoại lớn, ngang |
| `md` | 768px | Máy tính bảng |
| `lg` | 1024px | Laptop nhỏ |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Màn hình lớn |

### 7.2 Cách tiếp cận

Class Tailwind là **mobile-first** (viết cho màn nhỏ trước, rồi thêm `md:`, `lg:` cho màn lớn). Còn **chiến lược thiết kế** là desktop-first về nội dung: người mua đồ cũ dùng cả điện thoại và máy tính, nên mọi trang phải dùng được ở mọi cỡ, nhưng bố cục phong phú nhất thiết kế cho desktop rồi rút gọn.

### 7.3 Hành vi bố cục

| Thành phần | Desktop (`lg` trở lên) | Tablet (`md`) | Mobile (dưới `md`) |
|---|---|---|---|
| `Header` (`MainLayout`) | Logo, ô tìm kiếm rộng, menu, tài khoản trên một hàng | Ô tìm kiếm thu hẹp | Logo + biểu tượng; ô tìm kiếm thành hàng riêng hoặc mở khi bấm; menu vào `Sheet` |
| Lưới sản phẩm | 4 đến 5 cột | 3 cột | 2 cột |
| Bộ lọc sản phẩm | Cột bên trái cố định | Cột bên trái thu gọn hoặc `Sheet` | `Sheet` mở bằng nút "Bộ lọc" |
| Chi tiết sản phẩm | Hai cột: thư viện ảnh + thông tin | Hai cột | Một cột: ảnh, rồi thông tin, rồi nút mua cố định dưới đáy nếu cần |
| `StoreDashboardLayout` | Sidebar trái luôn hiện | Sidebar thu gọn thành icon | Sidebar thành ngăn kéo, mở bằng nút trên header |
| Bảng | Đủ cột | Ẩn bớt cột phụ | Cuộn ngang hoặc dạng thẻ |

Quy tắc chung:
- Không có thanh cuộn ngang cho cả trang ở bất kỳ độ rộng nào (kiểm tra ở 360px).
- Vùng chạm tối thiểu khoảng 44x44px trên mobile.
- Ảnh dùng `max-w-full` và tỉ lệ cố định. Không dùng chiều rộng pixel cố định cho khối nội dung.

---

## 8. Thương hiệu và Logo `[ĐỀ XUẤT]`

- **Hiện chưa có logo chính thức.** Đừng giả định có file logo. Component `Logo` (doc 06) tạm hiển thị chữ "Moldy Market" bằng font heading, và dễ thay bằng ảnh SVG khi có logo.
- Tên hiển thị lấy từ key i18n `app.name` (đã có `[ĐÃ CẤU HÌNH]`), không gõ cứng trong component.
- Một số hướng ý tưởng logo để team cân nhắc (chỉ là gợi ý, chưa chốt):
  1. **Chữ cái "M" làm từ hai nét như chiếc áo hoặc nếp gấp** gợi đồ được trao tay lần hai.
  2. **Vòng tròn tuần hoàn hoặc mũi tên vòng** quanh một món đồ, thể hiện tái sử dụng.
  3. **Chữ "Moldy Market" thuần chữ** bằng font heading, đơn sắc `#252525`, đúng phong cách tối giản.
- Logo đơn sắc `#252525` trên nền trắng là phiên bản chuẩn; phiên bản trắng trên nền đen cho vùng tối. Không dùng màu ngữ nghĩa (success, warning, info) cho thương hiệu.
- Favicon và thẻ `<title>` nằm trong bước cấu hình `index.html` sắp làm (doc 13).

---

## 9. Biểu tượng và hình ảnh

- Thư viện icon: **lucide-react** `[ĐÃ CẤU HÌNH]`. Dùng cỡ nhất quán: 16px (`size-4`) trong nút và chữ, 20px (`size-5`) cho thanh điều hướng, 24px cho minh họa trạng thái rỗng.
- Icon đi cùng chữ thì đặt `aria-hidden`; icon đứng một mình có `aria-label`.
- Ảnh sản phẩm là URL HTTPS bên ngoài (Backend chưa có upload, doc 14 mục 4.3, Q5). Hệ quả cho thiết kế: dùng `loading="lazy"` cho ảnh ngoài màn hình đầu, luôn có ảnh dự phòng, và dự phòng bố cục khi ảnh chậm (tỉ lệ cố định).

---

## 10. Cách thêm hoặc thay đổi token `[ĐỀ XUẤT]`

1. Thêm biến ở `:root` trong `src/index.css` (và ánh xạ vào `@theme inline` nếu cần class Tailwind).
2. Ghi vào bảng ở mục 2.2 trong **cùng Pull Request**.
3. Hai repo (User và Admin) dùng chung bộ token gốc. Khi sửa token dùng chung, sửa **cả hai repo** để giao diện không lệch nhau, và nhắc trong mô tả PR (doc 15).
4. Chạy `npm run format:check`, `npm run lint`, `npm run build` trước khi đẩy.

---

## 11. Lỗi thường gặp cần tránh

| Lỗi | Cách đúng |
|---|---|
| Gõ mã màu thẳng trong component (`text-[#777]`) | Dùng token (`text-muted-foreground`) |
| Dùng chữ phụ `#777777` cỡ 12px hoặc trên nền xám | Tăng độ đậm token hoặc dùng cỡ lớn hơn (mục 2.3) |
| Dùng thẻ `h3` cho tên sản phẩm trên card | Dùng thẻ `p` hoặc `span` với `font-medium` (vì `h3` bị ép font serif) |
| Để tên sản phẩm dài làm vỡ lưới | `line-clamp-2` |
| Sửa `components/ui/button.jsx` để làm biến thể | Bọc component, dùng `className` (doc 06) |
| Chỉ dùng màu để phân biệt trạng thái | Thêm chữ hoặc icon |
| Làm dark mode theo khối `.dark` có sẵn | Ngoài phạm vi hiện tại |
| Dùng placeholder thay label | Luôn có label |

---

## Tài liệu liên quan

- 02 - Frontend Architecture: vị trí `index.css`, `components/ui` trong cấu trúc.
- 04 - Routing and Pages: layout nào cho route nào.
- 05 - Page by Page Guide: bố cục từng trang.
- 06 - Component Architecture: vai trò, props của từng component.
- 07 - API Integration: ánh xạ lỗi sang giao diện, phân trang.
- 11 - Coding Conventions: dùng Tailwind, `cn`, đặt tên.
- 13 - Development Roadmap: bước cấu hình `index.html`, favicon.
- 14 - Backend Integration Matrix: enum trạng thái, ràng buộc dữ liệu.
