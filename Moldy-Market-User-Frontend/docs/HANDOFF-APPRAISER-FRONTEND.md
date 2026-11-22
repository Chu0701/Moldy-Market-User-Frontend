# Bàn giao Frontend Appraiser — Moldy Market

> Cập nhật phát hành 22/11/2026: Chu đã yêu cầu commit và push bản mới nhất lên main của cả 3 repo. Quy tắc “chưa được commit/push” bên dưới ghi lại thời điểm duyệt 4 quyết định ngày 21/11, không hủy ủy quyền phát hành mới này. Baseline và exact code refs được ghi tại [SHARED-BASELINE.md](https://github.com/Chu0701/Moldy-Market-User-Frontend/blob/main/Moldy-Market-User-Frontend/docs/SHARED-BASELINE.md); chỉ dùng sau khi xác nhận main remote đã có commit tương ứng.

Ngày đối chiếu: 21/11/2026. Người phụ trách: dev Frontend Appraiser. Owner quyết định nghiệp vụ: Chu.

File này là brief triển khai cho cả dev và AI. Đọc cùng checkout mới nhất của User Frontend; không cần đọc toàn bộ docs. Chỉ là tài liệu bàn giao, chưa triển khai tính năng hoặc xác nhận các API appraisal chạy đúng qua HTTP.

## Quyết định đã được Chu duyệt — 21/11/2026

Chu đã trả lời “duyệt 4 điểm”. Các quyết định sau thay thế đề xuất tương ứng; không hỏi lại khi triển khai cùng phạm vi:

1. Review thay đổi local, chia commit hợp lý và trình danh sách cho Chu duyệt trước commit/push để tạo shared baseline. Hai dev lấy đúng baseline được phát hành sau đó. Lần duyệt này chưa phải lệnh commit/push ngay; chưa có baseline commit mới để checkout.
2. Admin MVP: login/guard ADMIN → users → stores → product moderation → categories. Orders, dispute/refund, analytics và quản lý Appraiser để giai đoạn sau khi contract đã xác minh.
3. Appraiser không được thẩm định sản phẩm của bản thân hoặc bất kỳ gian hàng nào mình sở hữu/đang làm staff. Backend phải kiểm tra lúc ứng tuyển, accept invitation và tạo/nhận assignment; UI chỉ hỗ trợ chặn/ẩn. Đây là BUSINESS_APPROVED, BACKEND_IMPLEMENTATION_PENDING, không phải tính năng đã được enforce/test.
4. Admin chưa được bypass email OTP để kích hoạt PENDING_VERIFICATION. Giữ flow đúng OTP → ACTIVE → người dùng tự login; khóa/mở khóa theo quyền/transition Backend đã xác minh.

Rule thẩm định này độc lập với policy chat mua bán. Không bỏ guard chat hoặc tự sửa Backend trong task bàn giao; chuẩn bị patch/test cụ thể để review theo phạm vi được giao.

## 1. Mục tiêu và ranh giới công việc

Xây workspace cho người thẩm định: tìm yêu cầu đang mở, ứng tuyển hoặc nhận lời mời, theo dõi công việc được giao, bắt đầu thẩm định, gửi báo cáo và xem phản hồi. Kết quả phải dùng được với Backend thật và ghép vào User Frontend đang có mà không tạo một hệ auth/design system mới.

- Làm trong repo **Moldy-Market-User-Frontend**, dưới `src/features/appraiser/` và `src/services/appraiser/`. Không tạo app Vite mới, không làm trong Admin Frontend.
- Tái sử dụng session, login, HTTP client, QueryClient, i18n, design tokens và các feedback component hiện tại.
- Chu tiếp tục phụ trách phần buyer/seller/store/chat/payment. Các thao tác seller tạo request, chọn appraiser, duyệt báo cáo là điểm tích hợp; không tự mở rộng sang sửa toàn bộ những flow này.
- Dev Admin phụ trách giao diện quản trị hệ thống, không phụ trách workspace Appraiser. Hai bên không tự thiết kế API cấp role/hồ sơ Appraiser thay nhau.
- Không sửa Backend trong task Frontend. Ghi thiếu sót kèm request/response và đề xuất để Chu duyệt trước.

## 2. Snapshot và nguồn sự thật

Đã đọc source local ngày 21/11: User FE nhánh `codex/user-product-detail`, HEAD `754cb90`; Backend nhánh `codex/selective-checkout-integration`, HEAD `dc11b09`. **Có nhiều thay đổi local chưa commit ở User FE và Backend**. Hai HEAD này không đại diện đầy đủ cho bản Chu đang chạy. Trước khi code, lấy baseline/commit hoặc patch đã được Chu thống nhất; chỉ clone remote chưa chắc có auth/chat/store mới nhất. Không stash/reset hay ghi đè working tree của người khác.

Các đường dẫn trong file, trừ khi ghi Backend, đều tương đối với repo root chứa `package.json` và `src/`. Đây là một repo có thư mục docs lồng, không phải hai app:

- Hướng dẫn agent hiện tại: `user/AGENTS.md`; skills: `user/.agents/skills/`.
- Tài liệu: `Moldy-Market-User-Frontend/docs/` (gọi tắt là `DOCS` bên dưới).
- Đọc `moldy-task-start` cho mỗi task; thêm `moldy-feature`, `moldy-api-service`, `moldy-ui`, `moldy-auth-guard` khi phù hợp. Một số nội dung auth trong skill/docs là snapshot cũ: áp dụng các quyết định cập nhật tại mục 4 của file này, không quay về token strategy cũ.
- `AGENTS.md` Project state ngày 10/11 đã cũ: app shell, auth/OTP, store, product, cart, checkout, orders và chat hiện đã có code. Không scaffold lại.
- `DOCS/04-ROUTING-AND-PAGES.md` mục 3.4, `05-PAGE-BY-PAGE-GUIDE.md` mục 6 và `14-BACKEND-INTEGRATION-MATRIX.md` mục appraisal còn mô tả flow pricing cũ. Chỉ đọc các đoạn liên quan và cập nhật contract sau xác minh; không lấy chúng làm bằng chứng API hiện tại đã dùng được.

Thứ tự xử lý khi nguồn mâu thuẫn: yêu cầu/decision mới đã chốt với Chu → controller/DTO/service và response thật của đúng Backend ref → cập nhật doc 14 → code theo contract đó. Báo mâu thuẫn thay vì tự chọn nghiệp vụ. Có controller không đồng nghĩa đã đủ quyền, đủ flow hay đã kiểm thử.

## 3. Thực tế Backend: không làm nhầm flow cũ

Đã đối chiếu có giới hạn các controller/DTO/service trong Backend `src/main/java/com/moldy/moldymarket/appraisal/`. Đây là **source reference, chưa HTTP/security audit đầy đủ**, chưa tự chuyển trạng thái doc 14 sang IMPLEMENTED. Không code gọi API cho đến khi task audit ở mục 5 hoàn tất.

Flow thấy trong source:

1. Seller có một `AppraisalRequest`.
2. Appraiser gửi `Application` cho request, hoặc seller gửi `Invitation` cho appraiser.
3. Seller chọn application, hoặc appraiser accept invitation, để tạo `Assignment`.
4. Appraiser bắt đầu assignment, gửi `Report`.
5. Seller accept report thì assignment/request hoàn thành; reject là phản hồi cần xử lý theo policy Backend, không tự biến thành hoàn thành.

**Application ở đây là đơn ứng tuyển cho một yêu cầu thẩm định, không phải hồ sơ xin cấp role APPRAISER.** Không tạo màn hình “Admin duyệt application để trở thành Appraiser” từ DTO này. Luồng cấp tài khoản/role Appraiser chưa được xác minh trong bàn giao này.

Các endpoint tìm thấy trong source, cần audit trước khi nối:

- Khám phá yêu cầu: `GET /api/v1/appraisal-requests/market/open`; chi tiết `GET /api/v1/appraisal-requests/{requestId}`.
- Ứng tuyển: `POST /api/v1/appraisal-requests/{requestId}/applications`; danh sách cá nhân `GET /api/v1/appraisal-applications/my-applications`; chi tiết `GET /api/v1/appraisal-applications/{applicationId}`; rút `PATCH /api/v1/appraisal-applications/{applicationId}/withdraw`.
- Lời mời: `GET /api/v1/appraisal-invitations/my-invitations`, `GET /api/v1/appraisal-invitations/{invitationId}`, `PATCH .../{invitationId}/accept`, `PATCH .../{invitationId}/reject`. Tạo/hủy lời mời là thao tác phía seller, không dùng action của seller cho appraiser.
- Công việc: `GET /api/v1/appraisal-assignments/my-assignments`, `GET /api/v1/appraisal-assignments/{assignmentId}`, `PATCH .../{assignmentId}/start`, `PATCH .../{assignmentId}/cancel`.
- Báo cáo: `POST /api/v1/appraisal-reports/assignments/{assignmentId}`, `GET /api/v1/appraisal-reports/{reportId}`, `GET /api/v1/appraisal-reports/assignments/{assignmentId}/history` (history trả List, không phải Page).
- Điểm nối seller, Chu phụ trách: `POST /api/v1/appraisal-assignments/select-appraiser?requestId=...` body `{applicationId}`; `PATCH /api/v1/appraisal-reports/{reportId}/accept` hoặc `/reject` (reject có DTO lý do).
- Review có controller riêng `AppraisalReviewController`; là phần sau MVP, audit riêng. Không nhập nhằng với review sản phẩm hoặc review gian hàng.

Các ID `requestId`, `applicationId`, `invitationId`, `assignmentId`, `reportId`, `listingId` là những thực thể khác nhau. `listingId` là tên trường DTO request; phải xác minh nó liên kết product nào, không tự đổi JSON thành `productId`. Không dùng `requestId` thay `assignmentId` khi submit report.

Enum đã thấy, chỉ là giá trị wire, không phải danh sách tất cả hành động được phép:

- Request: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `EXPIRED`.
- Assignment: `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- Application: `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `EXPIRED`.
- Invitation: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `EXPIRED`.
- Report: `SUBMITTED`, `ACCEPTED`, `REJECTED`. Không có enum `DRAFT` trong report này; draft form nếu cần chỉ là UI state.

Validation source reference:

- `CreateApplicationDto`: introduction 20–1000 ký tự, experienceDescription 50–5000, proposedFee >= 0.01, estimatedCompletionHours là integer 1–480.
- `SubmitAppraisalReportDto`: description và conditionAssessment mỗi trường 20–5000, assessedValue >= 0.01, imageUrls/documentUrls mỗi danh sách tối đa 10.
- `AppraisalReportResponse` có revisionNumber, status, rejectionReason, submittedAt, reviewedAt. Lịch sử revision phải giữ, không ghi đè thành một “report mới nhất” giả.
- Chưa xác minh upload API cho ảnh/tài liệu. Không tự upload Cloudinary/Firebase, không gửi blob/file thay URL. Cần audit quy tắc URL trước khi mở link/preview.

### Các điểm phải báo Chu trước khi nối sâu

1. `appraisal/assignment/service/AppraisalConversationService.java` hiện trả `UUID.randomUUID()` làm placeholder, chưa tạo conversation thật. **Không điều hướng `/chat/:id` chỉ vì AssignmentResponse có conversationId.** Chờ sửa bridge Backend và kiểm tra participant/policy; không tự tạo room dự phòng hoặc thêm socket riêng.
2. `AppraiserApplicationController.apply` và phần service apply đã đọc chưa kiểm tra role APPRAISER; có kiểm tra self-request, deadline và duplicate. `SecurityConfig` dùng authenticated fallback. Cần test tài khoản USER thường có bị chặn không; UI guard không vá được thiếu quyền Backend. Những controller khác có annotation riêng hoặc kiểm tra participant, không được suy rộng rằng cả module đều an toàn.
3. Nhiều service dùng IllegalStateException/RuntimeException; mã HTTP/domain error chưa audit. Không parse câu tiếng Anh làm quy tắc nghiệp vụ hoặc gán các code tưởng tượng.
4. Chu đã chốt chặn thẩm định sản phẩm bản thân/shop sở hữu/shop đang làm staff, nhưng chưa triển khai/kiểm thử đầy đủ ở Backend; source apply mới thấy chặn sellerId của chính request. Cần test bằng tài khoản nhiều role và khi membership thay đổi; không chỉ kiểm tra role APPRAISER ở frontend. Policy chat mua bán hiện chặn cặp staff–owner cùng shop; không bỏ policy này để nối appraisal.
5. Phí thẩm định, hoàn phí, deadline, giới hạn reject/revision và tác động đến giá/trạng thái product phải đối chiếu service/decision thật. Submit report không tự đổi giá bán hoặc tự đánh dấu “đã thanh toán”.

## 4. Chuẩn code bắt buộc để ghép tương thích

### Stack và lớp code

JavaScript ES modules, JSX, React 19, Vite, Tailwind 4, shadcn radix-nova, TanStack Query 5, Axios, react-router 7, react-hook-form + Zod, i18next, Vitest + RTL. Dùng package-lock hiện có và `npm ci`, Node theo `.nvmrc` (hiện 22; package yêu cầu >=22.12). Không đổi sang TypeScript/Next.js/Redux/UI framework khác hoặc upgrade hàng loạt dependencies.

```text
src/services/appraiser/                 # pure API functions, unwrap + pagination adapter
  appraisalRequestService.js
  appraisalApplicationService.js
  appraisalInvitationService.js
  appraisalAssignmentService.js
  appraisalReportService.js
src/features/appraiser/
  appraiserKeys.js                       # stable query key factory
  appraiserStatus.js                     # verified enums -> i18n keys
  components/                           # focused UI/form components
  hooks/                                # queries/mutations, no JSX
  pages/                                # named XxxPage exports
  schemas/                              # Zod, validation messages are i18n keys
```

Chỉ tạo file khi task thực sự cần. Page ghép hooks + components; không gọi Axios hoặc fetch trong JSX/useEffect để tải server data. API responses nằm trong Query cache, không nhân bản vào Zustand/localStorage. Zustand thuộc `src/state/` và chỉ dùng UI state khi có nhu cầu thật.

### Auth đã chốt — không hỏi lại Q2

- Appraiser dùng chính `useSession` và phiên của User Frontend; access token qua `src/lib/tokenStorage.js`, key `moldy-market:user:access-token` trong localStorage. Không tạo token riêng cho role APPRAISER.
- Refresh token là **HttpOnly cookie do Backend set**, JavaScript không đọc/ghi. Auth requests hiện dùng `withCredentials: true` và header `X-Moldy-Auth: 1`; refresh/logout không gửi refreshToken JSON.
- `['users', 'me']` là query key session hiện tại (`meQueryKey`), không tạo thêm `['me']` hoặc tự decode JWT để lấy role.
- Refresh interceptor đã cài một lần trong `src/App.jsx`, có single-flight và retry-once. Không cài thêm ở AppraiserLayout/hooks; 403 không được refresh rồi thử vượt quyền.
- Bọc workspace bằng RequireAuth hiện có và role gate `roles.includes('APPRAISER')` lấy từ `/users/me`. Chưa có RequireRole dùng được thì bổ sung nhỏ sau khi thống nhất điểm tích hợp, không giả định file đã tồn tại. Tài khoản nhiều role dùng includes, không roles[0]. Backend vẫn quyết định quyền và ownership từng resource.
- Quyền staff thực tế theo membership `/api/v1/stores/my-store/staff/me`, không lấy merged permissions của `/users/me` để giả định quyền trên shop. Không tự sửa helpers store.
- Đăng ký email OTP đã chốt: đúng OTP kích hoạt ngay, người dùng tự đăng nhập; không quay về luồng mọi user chờ admin duyệt.

### Service, hook và cache

- Một Axios instance: `@/services/api/client`; `baseURL = VITE_API_BASE_URL || ''`. Service dùng full path đã xác minh, không thêm `/api/v1` toàn cục (Backend có nhiều prefix).
- Service params là object, JSDoc, GET truyền `{signal}` của Query xuống Axios. Return domain data sau `unwrap`; success null/204 không được coi là lỗi.
- Query key phải có userId và ID/filter/page liên quan. Ví dụ key đề xuất: `['appraiser', userId, 'assignments', {page, size}]`, `['appraiser', userId, 'assignment', assignmentId]`, `['appraiser', userId, 'reports', assignmentId]`. Tái sử dụng một factory, không ghép key khác nhau ở mỗi component.
- Không query trước khi session/role/params hợp lệ; dùng skipToken hoặc enabled đúng nghĩa. Không coi query disabled là empty success.
- Mutations retry:false, khóa double submit. Chỉ invalidate nhóm dữ liệu liên quan sau success; không reload trang hoặc queryClient.clear() cho mỗi mutation. Không optimistic “đã gửi/đã hoàn thành” cho report/action quan trọng.
- Callback muộn sau logout/đổi tài khoản không được set cache/navigate/toast dữ liệu của user cũ; dùng session ownership guard như `useUpdateMyStore`. Logout đã clear cache, không phục hồi nó từ request cũ.
- Nếu Backend lỗi, map `ApiError.status/code` sang i18n. ErrorMessage frontend là lời hướng dẫn người dùng, không phải nơi định nghĩa lại business rule Backend.

**Bẫy pagination:** appraisal controller dùng Pageable. Backend `config/PaginationConfig.java` đặt request page **1-based**, nhưng Spring Page response có `number` **0-based**. Source chỉ ra request page=1 là trang đầu; cần HTTP test page=1 và page=2 trước tích hợp. Dùng `normalizeSpringPage` cho response và kiểm tra adapter, **không chép `page - 1` của chat**: chat nhận int page thủ công nên khác. Không dùng normalizePagedResponse cho Spring Page; không tự chế totalElements khi thiếu.

Ví dụ pattern service **chỉ để triển khai sau khi endpoint được audit và ghi IMPLEMENTED trong doc 14**, không phải source đã có trong repo:

```js
import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'
import { normalizeSpringPage } from '@/services/api/pagination'

/** @param {{ page?: number, signal?: AbortSignal }} [options] */
export async function getMyAssignments({ page = 1, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisal-assignments/my-assignments', {
    params: { page, size: 20 },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}
```

Hook gọi service qua useQuery với key chứa userId/page, queryFn nhận signal và chỉ bật khi session APPRAISER hợp lệ; Page chỉ render query state. Không đặt request mẫu trên vào Page/useEffect hoặc gọi trước khi xác minh contract.

### UI, routing và i18n

- Import router từ `react-router`; RouterProvider từ `react-router/dom`. Một route table `src/app/router/routes.js`, lazy pages trả `{ Component: module.XxxPage }`, không tạo BrowserRouter lồng.
- Giữ `/appraiser/queue` làm điểm vào cũ nhưng mô tả đúng “Yêu cầu đang mở/Ứng tuyển”, không dựng nút claim không có contract. Các route mới đề xuất: `/appraiser/applications`, `/appraiser/invitations`, `/appraiser/assignments`, `/appraiser/assignments/:assignmentId`. Chốt và cập nhật doc 04 trước khi đăng ký. `/appraiser/requests/:requestId` nếu dùng là chi tiết request, không phải chi tiết assignment.
- MainLayout và kết nối chat đang hoạt động: không thay thế root layout/auth/global connection. StoreDashboardLayout mới là đề xuất, chưa có trong source; các route /store hiện dùng MainLayout. Chỉ thêm navigation Appraiser có role guard; không bật menu cho mọi USER.
- Mọi text/label/error/enum label qua i18n, vi trước và en đủ key, namespace common hiện có. Key mới gom dưới `appraiser.*`. Code/comments/JSDoc tiếng Anh, trao đổi với Chu tiếng Việt.
- Dùng tokens `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-accent`, success/warning/info; font Be Vietnam Pro + Playfair Display kế thừa. Không hard-code màu hex vào component, không đổi global palette để làm một trang.
- Tái sử dụng Button, ErrorState, EmptyState, ForbiddenState, PaginationBar, ImageWithFallback khi hợp contract. `src/components/ui` là generated; thêm shadcn bằng CLI, không sửa tay hoặc đổi hệ component.
- react-hook-form + zodResolver cho form, trim/validate theo DTO thật, label/htmlFor, aria-invalid/describedby, error role=alert. Form chỉ reset sau success, giữ draft khi lỗi. Loading/empty/error/403/not-found/pending phải tách rõ; table/card hoạt động trên mobile và keyboard.
- Chỉ render plain text hoặc link URL đã kiểm tra; không dangerouslySetInnerHTML cho báo cáo. Ngày từ ISO được format khi hiển thị; amount dùng formatter, không gửi chuỗi tiền đã format.

## 5. Làm lần lượt và đầu ra từng bước

1. **Baseline + audit contract.** Xác nhận ref với Chu; chạy các checks hiện có để biết baseline. Audit một endpoint tại một thời điểm, ghi vào doc 14: method/path, request/query, DTO/enums, permissions/ownership, success/error, pagination, source ref và HTTP/test evidence. Dùng tài khoản test APPRAISER/USER khác nhau và ID cùng/khác chủ; không dùng tài khoản thật để tự gửi hành động. Báo 5 điểm Backend ở mục 3. API chưa sẵn sàng: chỉ UI skeleton có TODO(doc14:...), không service giả.
2. **Một flow nhỏ đầu tiên: My assignments → detail.** Role gate, list paginated, refresh/deep link, trạng thái đủ. Đây là bước nên bắt đầu sau audit; dữ liệu fixture/assignment test nhờ Chu chuẩn bị, không tự nhận việc bằng endpoint bịa để có dữ liệu.
3. **Start → submit report → history.** Form đủ validation, khóa submit, lỗi giữ draft, history revision từ server. Có seller accept/reject qua dữ liệu test/flow Chu phụ trách; server mới quyết định COMPLETED.
4. **Market → apply → my applications → withdraw.** Chặn tự ứng tuyển request của mình ở UI và kiểm tra Backend thực sự chặn; xử lý deadline/duplicate/stale state từ response thật.
5. **Invitations → accept/reject → assignment.** Không giả định PATCH accept trả assignment; hiện controller trả ApiResponse<Void>. Sau success refetch invitations và assignments, không tự tạo assignment ID.
6. **Điểm tích hợp.** Đối chiếu seller flow với Chu, cập nhật trạng thái sau report review. Chỉ nối chat khi conversationId thật và quyền participant đã kiểm tra; tận dụng chat hiện có. Review/fee/payout là task riêng khi contract và nghiệp vụ đã rõ.

Mỗi task 3–5 dòng kế hoạch → một flow nhỏ → tests/checks → báo thay đổi, bằng chứng, blocker và bước tiếp. Không tạo toàn bộ service bằng phỏng đoán rồi mới test cuối.

## 6. Test, nghiệm thu và cách ghép code

- Schema/service unit tests kiểm tra body whitelist, full path, empty body, AbortSignal và adapter page 1/2. UI/hook/route tests mock ở service boundary, không gọi Backend trong unit test.
- Integration tests UI cho guest, USER không có APPRAISER, đúng role nhưng foreign assignment, successful list/detail/start/submit, failed submit giữ draft, double click, report rejected, expired request, logout khi request pending. Backend 403/409/400 không được chuyển thành success giả.
- Manual browser test bằng tài khoản test: deep link + refresh + back, mobile/keyboard, Network method/body, Console không lỗi, hai danh tính không lẫn cache. Mock pass chưa phải “đã tích hợp”.
- Chạy `npm run format`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run build`. Không bỏ/skipped tests hoặc nới assertions chỉ để xanh; ghi rõ lỗi baseline nếu có. `.prettierignore` hiện bỏ qua thư mục DOCS; format riêng file docs mình viết khi cần, không format lại toàn bộ docs.
- Tách branch riêng từ baseline đã chốt, gợi ý `codex/appraiser-workspace`; commit nhỏ Conventional Commits khi người phụ trách duyệt. AI không tự push/merge/force hoặc sửa lockfile để “giải quyết” conflict. Không mang dist/node_modules/.env.local/secrets vào thay đổi.
- File dễ conflict với Chu: `src/app/router/routes.js`, `src/app/layouts/MainLayout.jsx`, hai common.json, `src/index.css`, helpers/API/auth và docs 04/14. Báo trước, chỉ bổ sung hẹp; không chép đè nguyên file. Không import source bằng đường dẫn sang repo Admin.
- Bàn giao kèm base ref, commit/patch, file list, routes/i18n keys mới, contract đã xác minh, kết quả checks, ảnh/manual evidence và blocker Backend. Ghép vào baseline mới nhất rồi chạy lại checks, kiểm tra không làm hỏng store/product/chat/checkout.

## 7. Prompt đưa cho AI của bạn

> Bạn phụ trách Frontend Appraiser của Moldy Market. Đọc file HANDOFF-APPRAISER-FRONTEND.md này, AGENTS.md thực tế và moldy-task-start trước. Làm trong User Frontend đang có, JavaScript/JSX, không scaffold lại auth/router/design system. Quyết định auth cập nhật trong handoff thay thế snapshot token cũ. Backend appraisal hiện khác flow pricing/claim trong docs cũ: không gọi API trước khi audit và cập nhật doc 14. conversationId appraisal hiện có placeholder, không tự nối chat. Trước tiên xác nhận shared baseline và đề xuất task My assignments → detail; nêu contract/blocker và kế hoạch 3–5 dòng. Tái sử dụng client/unwrap/ApiError/query/session/i18n hiện có, cache theo user và ownership, không sửa Backend hoặc nghiệp vụ ngoài phạm vi khi chưa có Chu duyệt. Hoàn tất từng flow nhỏ, thêm tests có ý nghĩa và chạy format/lint/format:check/test/build. Không tự commit/push/merge, không đọc toàn bộ docs/Backend hoặc ghi đè thay đổi của người khác. Khi không đủ thông tin hãy chỉ rõ điều chưa xác minh, không tự tạo endpoint, DTO, permission hoặc trạng thái.
