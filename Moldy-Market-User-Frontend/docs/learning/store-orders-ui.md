# Đơn hàng gian hàng — ghi chú triển khai

Ngày 2026-11-21. Frontend đã được trợ lý trực tiếp code theo lựa chọn mới của Chu, không còn bước chép frontend.

Luồng: Gian hàng → Đơn hàng gian hàng → lọc/phân trang → xem món và thông tin người nhận → owner xác nhận đơn COD. Staff cần STORE_WORKSPACE_ACCESS và ORDER_PROCESS của đúng gian hàng để vào trang; staff chỉ xem. Backend vẫn kiểm tra membership và chỉ owner được confirm. Không dùng sellerId của người đăng để quyết định quyền owner.

Service: src/services/orders/storeOrderService.js đọc PagedResponse của endpoint đã verify, chuẩn hóa bằng adapter sẵn có, từ chối page malformed hoặc row khác store. Hook đọc cache theo userId/storeId/page/status; owner lấy store từ /stores/my-store, staff dùng liên kết đã có trong session. Bộ lọc nằm trên URL, đổi status về page 1. Response 403/404 luôn ẩn dữ liệu cũ.

Xác nhận: native confirm dialog, khóa bấm đúp và khóa dùng chung khi có mutation. Ngay trước POST kiểm tra lại session, owner store và row mới nhất trong cache. Chỉ một POST tới endpoint seller confirm, không gửi body, không tự retry. Sau mọi kết quả, đọc lại danh sách đúng user/store; không lấy một OrderResponse để tự sửa mọi page. Không invalidate/xóa giỏ hoặc tự ghi nhận tiền COD. Chưa có paymentMethod/paymentStatus trong DTO, nên không hiển thị CONFIRMED như đã thanh toán.

UI: snapshot món và người nhận mở bằng details, không link vào trang /orders/:id của buyer. Loading, empty, retry, forbidden, invalid URL, owner chưa có store đều có trạng thái riêng. Dùng token CSS và component hiện có, không thêm dependency.

Kiểm chứng: Backend chính pass full Maven verify/package 283 tests (282 pass, một auth QA-010 disabled có sẵn). Frontend pass 398 tests/44 file, gồm 36 test mới về service, quyền, URL, owner/staff UI, xác nhận, race, GET lỗi sau POST, 403 và logout. Format check/lint/build đều pass. Chưa kiểm thử browser/HTTP thủ công với tài khoản thật; Chu kiểm tra bước dưới.

Thử thực tế:

1. Stop/Run lại Backend trong IntelliJ để nạp đủ controller/query và hai JSON handler mới.
2. Dùng buyer ngoài shop đặt COD. Đăng nhập owner → Gian hàng → Đơn hàng gian hàng; lọc Chờ gian hàng xác nhận và xác nhận đơn đó.
3. Buyer refresh Đơn mua để thấy CONFIRMED. Đây chưa phải thu tiền COD.
4. Staff có ORDER_PROCESS cùng shop phải xem được cả đơn đồng nghiệp nhưng không có nút xác nhận; staff không có quyền không được xem.
5. Thử lọc, sang trang, refresh và reload URL. Dữ liệu phải đúng shop; danh sách rỗng không phải lỗi.

Chưa làm UI admin giao hàng/thu tiền, hủy từng order COD, refund/dispute hoặc SePay Live. Không commit/push trong task.
