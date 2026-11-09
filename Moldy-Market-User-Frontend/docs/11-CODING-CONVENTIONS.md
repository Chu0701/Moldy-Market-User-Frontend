# 11 - Coding Conventions (Quy ước viết code)

- Trạng thái: BẢN NHÁP v0.1
- Cập nhật: 2026-11-08
- Áp dụng cho: Moldy-Market-User-Frontend
- Mục đích: thống nhất cách đặt tên, cách tổ chức và cách viết code để các thành viên đọc code của nhau không phải đoán.

Quy ước nhãn: `[ĐÃ CẤU HÌNH]` là thứ đã có thật trong repo (Prettier, ESLint, alias...). `[ĐỀ XUẤT]` là quy ước team cần đồng ý, hiện chưa có code nào áp dụng. Mọi ví dụ code trong doc này là **ví dụ minh họa, chưa có trong repo**.

---

## 1. Công cụ tự động bắt buộc tuân theo `[ĐÃ CẤU HÌNH]`

### 1.1 Prettier

File `.prettierrc`:

| Tùy chọn | Giá trị | Ý nghĩa |
|---|---|---|
| `semi` | `false` | Không dùng dấu chấm phẩy cuối câu lệnh |
| `singleQuote` | `true` | Dùng nháy đơn trong JS |
| `trailingComma` | `all` | Luôn có dấu phẩy cuối trong object, array, tham số |
| `printWidth` | `100` | Xuống dòng khi vượt 100 ký tự |
| `tabWidth` | `2` | Thụt lề 2 dấu cách |
| `endOfLine` | `lf` | Kết thúc dòng kiểu LF, khớp `.gitattributes` |

`.prettierignore` loại `dist`, `node_modules`, `package-lock.json`, `src/components/ui` (code shadcn sinh ra, không format tay).

Lệnh: `npm run format` (ghi đè), `npm run format:check` (chỉ kiểm tra, dùng cho CI sau này). Trong Antigravity, `.vscode/settings.json` đã bật format khi lưu. **Đừng cãi nhau về style, Prettier quyết định.**

### 1.2 ESLint 10 (flat config)

File `eslint.config.js`, có plugin `react-hooks` và `react-refresh`. Điều cần nhớ:

- `react-hooks/rules-of-hooks` và `exhaustive-deps`: không gọi hook trong điều kiện hoặc vòng lặp; khai báo đủ dependency. Không tắt rule bằng comment trừ khi có lý do ghi ngay bên cạnh.
- `react-refresh/only-export-components`: một file component chỉ nên export component. Hook, hằng số, hàm helper tách ra file khác. Khối override riêng cho `src/components/ui/**` đã tắt rule này vì đó là code shadcn.
- `no-unused-vars`: xóa biến và import không dùng. Với biến bắt đầu bằng chữ hoa hoặc `_` trong `src/components/ui/**` đã được nới.
- Lệnh: `npm run lint`. Trước khi mở Pull Request phải chạy `npm run lint`, `npm run format:check`, `npm run build` đều sạch.

### 1.3 Alias `@`

`@` trỏ tới `src` (khai báo ở `jsconfig.json` và `vite.config.js`). Quy tắc import:

- Từ file khác thư mục cấp cao: dùng alias, ví dụ `import { cn } from '@/lib/utils'`.
- Trong cùng một feature (ví dụ `features/products/components/*`): có thể dùng đường dẫn tương đối ngắn `./ProductCard`.
- **Không** dùng `../../../` quá hai cấp. Nếu cần, đổi sang alias.

---

## 2. Đặt tên `[ĐỀ XUẤT]`

### 2.1 File và thư mục

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Thư mục | `kebab-case` hoặc một từ thường, tiếng Anh | `features/products`, `components/common` |
| Component | `PascalCase.jsx`, tên file trùng tên component | `ProductCard.jsx` |
| Page | `PascalCase` kết thúc bằng `Page` | `ProductDetailPage.jsx` |
| Layout | `PascalCase` kết thúc bằng `Layout` | `MainLayout.jsx` |
| Hook | `camelCase` bắt đầu bằng `use`, đuôi `.js` | `useProductSearch.js` |
| Service | `camelCase` kết thúc bằng `Service`, đuôi `.js` | `productService.js` |
| Schema Zod | `camelCase` kết thúc bằng `Schema` | `loginSchema.js` |
| Zustand store | `camelCase` bắt đầu bằng `use`, kết thúc bằng `Store` | `useUiStore.js` |
| Hằng số | `SCREAMING_SNAKE_CASE` cho giá trị, file `camelCase.js` | `constants/queryKeys.js` |
| Test (sau này) | cùng tên file, đuôi `.test.jsx` | `ProductCard.test.jsx` |

Đuôi `.jsx` cho file có JSX, `.js` cho file không có JSX.

### 2.2 Biến, hàm, hằng

- Biến, hàm: `camelCase`. Boolean bắt đầu bằng `is`, `has`, `can`, `should` (`isLoading`, `canEditStore`).
- Event handler truyền xuống: prop `onXxx`, hàm xử lý bên trong `handleXxx`.
- Hằng số cấp module: `SCREAMING_SNAKE_CASE` (`DEFAULT_PAGE_SIZE`).
- Không dùng tên viết tắt khó hiểu (`prd`, `usr`). Dùng `product`, `user`.
- **Từ "store" có hai nghĩa**: `store` trong nghiệp vụ là gian hàng; Zustand dùng thư mục `state/` và hậu tố `Store` chỉ cho store của Zustand. Khi nói về gian hàng, đặt tên rõ `shop`/`storeProfile` trong tên biến và dùng `stores` (số nhiều) chỉ cho feature gian hàng. Không đặt biến tên `store` mơ hồ.

### 2.3 Query key

Dạng mảng, từ chung đến riêng: `['products', 'list', params]`, `['products', 'detail', productId]`, `['users', 'me']`. Tạo qua hàm factory trong `constants/queryKeys.js` hoặc ngay trong feature (xem doc 09), không viết chuỗi rải rác.

---

## 3. JavaScript và JSDoc `[ĐỀ XUẤT]`

Dự án dùng JavaScript thuần, nên JSDoc là cách duy nhất để editor gợi ý kiểu.

Quy tắc:

- Dùng `const` mặc định, `let` khi bắt buộc, không dùng `var`.
- Dùng `async/await`, không trộn với `.then()` trong cùng một hàm.
- Optional chaining `?.` và nullish `??` được khuyến khích; tránh `||` cho giá trị có thể là `0` hoặc chuỗi rỗng.
- Không để `console.log` trong code đã commit (`console.error` có chủ đích thì được).
- **Mọi hàm của `services/` phải có JSDoc** ghi tham số, kiểu trả về, endpoint tương ứng và trạng thái Backend. Component và hook có JSDoc khi props hoặc giá trị trả về không hiển nhiên.

Ví dụ minh họa (chưa có trong repo):

```js
/**
 * Tìm kiếm sản phẩm.
 * Endpoint: GET /api/v1/products/search (IMPLEMENTED, doc 14 mục 4.1)
 * @param {{ keyword?: string, page?: number, size?: number }} params
 * @returns {Promise<object>} dữ liệu đã bóc phong bì ApiResponse
 */
export async function searchProducts(params) {
  const { data } = await apiClient.get('/api/v1/products/search', { params })
  return data.data
}
```

Dùng `@typedef` cho kiểu dữ liệu lặp lại nhiều nơi, và **chỉ mô tả trường đã xác minh trong doc 14**. Trường chưa audit thì ghi chú, không đoán.

---

## 4. React best practices `[ĐỀ XUẤT]`

1. **Component nhỏ, một trách nhiệm.** Một component quá ~150 dòng thường nên tách. Page chỉ ghép các component và hook, không chứa logic gọi API trực tiếp.
2. **Không gọi Axios trong component.** Component gọi hook (TanStack Query), hook gọi `services/`. Lý do: tách UI khỏi mạng để dễ test và dễ thay đổi.
3. **Không lưu dữ liệu API vào Zustand hay `useState` để "đồng bộ".** Dữ liệu từ server là việc của TanStack Query (doc 09).
4. **Props:** truyền ít, rõ ràng, có JSDoc. Tránh truyền cả object lớn khi chỉ cần một vài trường. Dùng `children` và composition thay vì cờ boolean chồng chéo.
5. **`key` ổn định** khi render danh sách: dùng id từ Backend, không dùng index (trừ danh sách tĩnh).
6. **Effect chỉ cho đồng bộ với hệ thống ngoài** (WebSocket, timer, DOM). Không dùng `useEffect` để tính dữ liệu phái sinh, hãy tính trực tiếp khi render hoặc dùng `useMemo` khi thật sự nặng.
7. **Form dùng React Hook Form + Zod** (doc 09). Không tự quản lý từng field bằng `useState`.
8. **Có đủ ba trạng thái** cho mọi chỗ lấy dữ liệu: loading, rỗng, lỗi. Đừng chỉ làm trạng thái thành công.
9. **Trang đặt tên chuỗi giao diện qua i18n:** mọi chữ hiển thị đi qua `useTranslation`, không viết cứng tiếng Việt trong JSX (trừ nội dung demo tạm có đánh dấu `TODO`). Key camelCase theo nhóm.
10. **Không đặt logic nghiệp vụ quan trọng ở Frontend.** Giá, phí, quyền, trạng thái thanh toán đều do Backend quyết định; Frontend chỉ hiển thị (doc 08, doc 10).

---

## 5. Xử lý lỗi `[ĐỀ XUẤT]`

- Lỗi HTTP được chuẩn hóa tại một chỗ (interceptor Axios, doc 07) thành một đối tượng lỗi gồm `status`, `code`, `message`. Component không tự đọc cấu trúc thô của Axios.
- Hiển thị cho người dùng bằng **thông điệp đã dịch theo `code`**, không in nguyên `message` của Backend nếu là tiếng Anh kỹ thuật. Mã lỗi chưa có bản dịch thì dùng thông điệp chung và ghi log.
- Lỗi form (400 kèm chi tiết trường) gắn vào đúng field qua React Hook Form (`setError`).
- `401` do hết hạn: tự refresh một lần (doc 08). `403`: hiển thị trang hoặc thông báo "không có quyền", **không** thử lại. `409` ở product (`COMMON_010`, optimistic locking): báo dữ liệu đã bị sửa, tải lại.
- Có một `ErrorBoundary` ở cấp app và cấp route để lỗi render không làm trắng màn hình.
- **Không nuốt lỗi** bằng `catch {}` rỗng.

---

## 6. Tầng service API `[ĐỀ XUẤT]`

- Một thư mục mỗi module Backend: `services/auth`, `users`, `stores`, `categories`, `products` (đã tạo thư mục). Dùng chung một Axios instance ở `services/api`.
- Hàm service: thuần, async, trả `data` đã bóc phong bì `ApiResponse`; **không** dùng hook, không đụng Zustand/React.
- Đường dẫn viết đầy đủ (`/api/v1/...` hoặc `/api/...`) vì baseURL không gắn cứng prefix (doc 07).
- **Chỉ viết service cho endpoint `IMPLEMENTED` trong doc 14.** Endpoint `IN_PROGRESS` chỉ viết khi branch đã merge vào `main` và doc 14 đã cập nhật. Endpoint `NOT_FOUND` không viết gì cả, chỉ để skeleton `TODO` ở UI.
- Mỗi hàm có JSDoc ghi endpoint và trạng thái. Không viết hàm "đoán" tham số.

---

## 7. Tailwind CSS và giao diện `[ĐỀ XUẤT]`

- Tailwind v4: token cấu hình trong `src/index.css`, **không có** `tailwind.config.js`.
- Dùng **class theo token** (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, `text-success`...) thay vì mã màu hex. Mã hex chỉ xuất hiện trong `index.css`.
- Gộp class có điều kiện bằng `cn()` từ `@/lib/utils`.
- Hạn chế giá trị tùy ý kiểu `w-[347px]`; ưu tiên thang spacing mặc định. Giá trị tùy ý cần lý do.
- Thứ tự class: bố cục, kích thước, khoảng cách, kiểu chữ, màu, hiệu ứng. (Có thể dùng plugin sắp xếp class của Prettier sau, hiện chưa cấu hình.)
- Thiết kế **desktop-first** cho sàn thương mại, nhưng luôn kiểm tra màn hình mobile; dùng tiền tố responsive `sm:`, `md:`, `lg:` mặc định của Tailwind (doc 03).
- Không sửa tay `src/components/ui/*`. Muốn đổi, bọc lại trong `components/common` hoặc chạy lại lệnh shadcn.
- Thêm component shadcn bằng CLI, ví dụ `npx shadcn@latest add input`. Commit riêng, đừng trộn với thay đổi tính năng.

---

## 8. Git và review

Chi tiết quy trình nằm ở doc 15. Tóm tắt quy ước liên quan tới code:

- Commit theo Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Một Pull Request làm một việc, nhỏ vừa đủ để review trong một lần ngồi.
- Không commit `.env.local`, file build, hoặc code bị comment bỏ.
- Reviewer kiểm tra: đúng ranh giới lớp (UI, hook, service), đủ loading/rỗng/lỗi, không bịa endpoint, không lưu dữ liệu API trong Zustand, không hard-code chuỗi hay màu, lint và build sạch.

---

## 9. Checklist nhanh trước khi mở PR

- [ ] `npm run lint`, `npm run format:check`, `npm run build` đều sạch.
- [ ] Không có `console.log`, code chết, biến thừa.
- [ ] Endpoint dùng có trong doc 14 và ở trạng thái `IMPLEMENTED`.
- [ ] Có xử lý loading, rỗng, lỗi.
- [ ] Chuỗi giao diện đi qua i18n (`vi` và `en`).
- [ ] Cập nhật docs nếu thay đổi kiến trúc, route hoặc contract.

---

## Tài liệu liên quan

- Doc 02: kiến trúc và ranh giới các lớp.
- Doc 03: design system và Tailwind token.
- Doc 06: kiến trúc component.
- Doc 07: lớp API và Axios.
- Doc 09: state, form và Zod.
- Doc 14: ma trận tích hợp Backend.
- Doc 15: quy trình đóng góp.
