# Kế hoạch chuẩn bị shared baseline — 21/11/2026

> Publication update 22/11/2026: this document preserves the original planning inventory. Chu subsequently authorized commit/push to main in all three repos. Auth/cart Backend commits and both User Frontend application snapshots have now been prepared and tested separately; current publication state and exact refs are tracked in [SHARED-BASELINE.md](SHARED-BASELINE.md). Statements below saying no commits/publication exist refer to the original 21/11 planning checkpoint, not the current state. PostgreSQL must be restored before the remaining Backend integration publication can complete.

Chu đã duyệt việc review và chia các thay đổi local thành commit hợp lý trước khi hai dev Frontend bắt đầu. **Chưa commit, stage lại, merge hoặc push.** Đây là kế hoạch phân nhóm từ inventory Git và scoped diffs; chưa phải xác nhận từng snapshot trung gian đã build/test độc lập hoặc đã security review toàn bộ diff.

## Quyết định sản phẩm đã duyệt

- Admin MVP: auth/ADMIN guard → users → stores → moderation → categories.
- Appraiser không thẩm định hàng bản thân/shop sở hữu/shop đang làm staff, phải enforce ở apply/invitation/assignment.
- Admin chưa được bypass OTP để kích hoạt PENDING_VERIFICATION.
- Hai rule trên hiện là business approved, không có patch/test Backend mới trong task bàn giao này. Không đưa chúng vào baseline dưới nhãn “đã triển khai”.

## Các ref và trạng thái đã kiểm tra

- Backend: codex/selective-checkout-integration, HEAD dc11b09; 67 tracked files có unstaged diff, cùng nhiều source/tests/docs untracked. Có 8 file AM đã stage trước đó, index hiện chỉ giữ skeleton 4 dòng trong mỗi file; không được commit thẳng index vì đó không phải source hoàn chỉnh. Không reset/unstage các staged changes của người khác khi chưa thống nhất.
- User FE: codex/user-product-detail, HEAD 754cb90; checkout/payment/orders/chat và sửa staff vẫn chưa commit đầy đủ. Cần ghép các file mới với imports/router/i18n/CSS/tests liên quan.
- Admin FE: main, HEAD 2fc97d9; thay đổi hiện tại là handoff/matrix và local admin guidance; chưa có Admin application code để gom vào baseline tính năng.
- Baseline cần ghi tuple ref riêng cho cả ba repo; không có một SHA chung cho ba repo độc lập. HEAD cũ + working tree dirty chưa phải baseline để hai bạn chỉ git checkout là dùng được.

## Thứ tự commit Backend đề xuất

1. `feat(auth): complete email OTP verification and resend controls` — AuthController, AuthenticationService, EmailVerificationService/entity/repository/DTO, rate-limit rules, timeout mail không chứa credentials, auth tests và các hunk AUTH errors/UserRepository cần thiết. Giữ auth cookie đã chốt. Không thêm rule admin-bypass mới vì chưa có patch.
2. `fix(cart): enforce cart ownership and linked-store restrictions` — cart controller/DTO/entity/repository/service và CartServiceTest; các hunk CART errors. Bao gồm removePurchasedItems helper nếu checkout ở bước sau dùng nó; chưa bỏ giỏ trước payment success.
3. `feat(checkout): integrate reservations and payment order lifecycle` — order/payment/product reservation, expiry scheduler/listener, SePay verifier, SQL checkout, @EnableScheduling, errors ORDER/PROD và các regression/integration tests trực tiếp. Nhóm này có phụ thuộc hai chiều order/payment và shared ProductService: không tách theo folder máy móc. Đây là nhóm lớn; khi dựng snapshot cần thử chia tiếp “reservation contract” và “checkout/payment lifecycle” nếu cả hai snapshot compile/test được. Không dựng stub hoặc bỏ tests chỉ để ép thành commit nhỏ.
4. `fix(store): enforce staff workspace and product management access` — StoreStaffController/Service, store-product endpoints, personal-product read compatibility, ProductService/Repository hunk đọc, required storeId khi đăng tin, tests store/product. Tách các hunk reservation của ProductService/Repository vào bước 3, không chép cả file vào cả hai commit.
5. `feat(orders): expose scoped store orders and owner COD confirmation` — StoreOrderController/Service, query/mapper/storeId snapshot và store-order tests; giữ owner-only confirm. Phụ thuộc order lifecycle và staff workspace ở trên.
6. `fix(security): serialize authentication errors with the configured mapper` — CustomAuthenticationEntryPoint, CustomAccessDeniedHandler và tests 401/403 tương ứng. Có thể đặt sớm hơn nếu snapshot test phụ thuộc hai handler này; không thay status/code/message để làm tests xanh.
7. `feat(chat): complete participant policy and bounded read receipts` — toàn bộ chat source thay đổi/mới, ChatAccessPolicy, queues/STOMP guard, DTO/read cursors, migration chat và chat tests; PublicStoreResponse.ownerId, StoreStaffRepository batch lookup, UserRepository lock theo ID, CHAT errors là dependencies phải cùng có. Nếu chia thành TEXT/policy rồi read-unread thì phải dựng đúng source/test snapshot của từng phần; chưa có snapshot đó được xác minh trong task này.
8. `test: add remaining service regression coverage` — pom test dependencies và các untracked tests ngoài nhóm trên chỉ khi đã review từng file và xác nhận chúng không cần app patch bị bỏ sót. Không đưa toàn bộ src/test vào commit đầu tiên khi một số test cần DTO mới của commit sau.
9. `docs: record integrated backend contracts and rollout notes` — BACKEND-CHANGELOG, guides hiện hành và migration/rollout notes sau review nội dung. Các guide/code copy cũ trong docs/testing cần chọn lọc, giữ nhãn historical, không dùng thay source chính.

ErrorCode, UserRepository, ProductService/Repository/DTO và một số tests chạm nhiều feature: cần tách theo hunk/dependency bằng patch/index trong môi trường chuẩn bị biệt lập sau khi được phép. Không git add cả file sớm làm rò feature chưa hoàn chỉnh vào một commit khác.

## Thứ tự commit User Frontend đề xuất

1. `fix(store): use delegated staff permissions for workspace actions` — useMyStaffProfile/getStoreContext, store/product access hooks/pages, store/product services/tests, quyền PRODUCT_MANAGE_OWN trong form và các phần navigation/i18n/route tests tương ứng. Liên kết store-orders chưa có source ở bước này phải để bước 4, không để import/menu trỏ tới flow chưa commit.
2. `feat(orders): add buyer order history and detail views` — buyer order service/hooks/pages/status/date/items, routes/menu/CSS/i18n và OrdersFlow tests. Chỉ lấy phần buyer; các service/components cancel thuộc payment lifecycle nếu phụ thuộc checkout.
3. `feat(checkout): connect payment status cancellation and guarded submission` — checkout service/hooks/helpers/components/pages, form/page submit, cancel order service, route checkout/:id, i18n/tests/guides. Gồm link sang /orders đã có bước 2; không tách form submit khỏi mutation/service cần dùng.
4. `feat(orders): add store order list and owner COD confirmation` — store-order source/tests và links owner/staff, key/filter/permission states, i18n/guides. Phụ thuộc staff workspace bước 1 và buyer/shared order components bước 2.
5. `feat(chat): integrate store chat messaging and unread state` — src/features/chat, src/services/chat, store/product entry buttons, one global connection/context, routes/menu/badges, pagination adapter Spring Page, package.json+lock (STOMP/SockJS), proxy/test config và i18n/CSS/tests/guides. Không có Appraiser workspace trong commit này; không nối conversationId placeholder của appraisal.
6. `docs: add approved appraiser handoff and baseline plan` — handoff này và routing/page/matrix updates. Các mục trạng thái docs phải phản ánh đúng implementation local, chưa tự gọi là deployed/remote.

MainLayout, routes.js, routes.test.jsx, common.json vi/en và index.css chạm nhiều nhóm: phải chọn hunk đúng bước. Các flow tests hiện đã có mocks chat vì MainLayout dùng global connection; trước khi chat được đưa vào snapshot, giữ test boundary đúng snapshot thay vì copy mọi mock/import tương lai.

Admin Frontend có một docs commit riêng: `docs: add approved admin frontend handoff`. Không tạo commit tính năng auth/users chưa được viết. Guidance `admin/`/`user/` untracked cần review riêng trước chia sẻ; handoff đang phụ thuộc các skills/path này nên baseline phát hành phải kèm guidance phù hợp hoặc điều chỉnh đường dẫn cho đúng checkout.

## Loại trừ và kiểm tra trước khi xin duyệt commit thực tế

- Không dùng git add . hoặc add -A. Giữ nguyên staged state sẵn có cho đến khi thống nhất cách staging; không commit các skeleton đang stage nhầm với source hoàn chỉnh trong working tree.
- Không đưa .env/.env.local, .idea/workspace.xml, target/dist/node_modules, task logs, .checkout-integration-backup-20261120 hoặc installer docs/detailed-design/vbook-1.1.7-win-x64.msi vào baseline. Không xóa chúng để làm sạch status. File không thuộc patch ứng dụng phải review riêng.
- Inspect diff + untracked files của từng nhóm, rà secrets bằng kiểm tra có che giá trị; không in secret/config cá nhân ra báo cáo. Default/test constants phải phân biệt với credentials thật.
- Dựng các snapshot theo thứ tự trong vùng làm việc biệt lập được phép, build/test từng snapshot, kiểm tra imports/DTO/contracts và staged diff trước commit. Không dùng reset --hard/stash hoặc đổi branch trên working tree hiện tại.
- Frontend: format/lint/format:check/test/build. Backend: Maven verify với cấu hình local thích hợp, không commit secrets để CI test chạy. Kết quả whole-tree trước đó không chứng minh mỗi commit trung gian đều chạy được.
- Hai thay đổi mới về business chỉ ghi decision, chưa enforce: Appraiser own-shop restriction và admin OTP bypass. Ghi rõ trong bàn giao để dev không tưởng baseline đã sửa chúng.
- Trình Chu danh sách commit thực tế và bằng chứng checks trước commit. Push/merge có bước duyệt riêng; không coi việc duyệt 4 quyết định là quyền push.
- Sau phát hành mới cập nhật handoff với exact Backend/User/Admin SHAs được chia sẻ. Hai dev branch từ tuple đó; việc Admin port hạ tầng User vẫn là chọn lọc, không merge hai repo thành một.

Chưa có shared baseline mới được tạo trong task này. Bước tiếp theo là dựng snapshot chia commit theo kế hoạch và review từng nhóm; các điểm đang ghi “đề xuất/chưa xác minh” không được báo là đã hoàn thành.
