# Chat TEXT realtime — implementation local

Ngày 2026-11-21. Frontend do trợ lý trực tiếp code; Chu chép Backend rồi trợ lý sửa các lỗi chép và cài tests. Gửi/nhận TEXT trong hội thoại đã có đã được nối. Sau đó đã bổ sung nút Chat với gian hàng trên trang sản phẩm và storefront; DTO ownerId đã được Chu chép; bản sửa tên/policy tiếp theo do trợ lý sửa Backend trực tiếp theo quyền Chu cấp. Chu đã chọn nhắn chủ gian hàng, không nhắn staff đã đăng tin.

## Luồng dữ liệu

1. ChatPage tải danh sách hội thoại qua REST, rồi useChatRealtime mở một connection cho user/token hiện tại. Trước CONNECT, refetch query users/me để đi qua refresh interceptor đã có; không tự viết lại auth refresh.
2. chatConnection dùng @stomp/stompjs và bản browser bundle sockjs-client/dist/sockjs, kết nối endpoint /chat. JWT chỉ ở native CONNECT header. Không bật debug log hoặc đặt token trong URL.
3. Subscribe queue messages và errors của tài khoản. Gửi TEXT qua /app/conversations/{uuid}/send; Backend lấy sender từ principal, kiểm tra participant, khóa dòng hội thoại và commit message/lastMessageAt cùng transaction.
4. Composer giữ draft và khóa gửi trong lúc chờ. Echo đúng phòng/sender/content xác nhận server đã ghi nhận nội dung; trạng thái “Đã đọc” dùng peer cursor riêng, không suy từ echo. Một connection chỉ có một send đang chờ vì protocol chưa có request ID.
5. Frame hợp lệ kích hoạt tải lại REST history và inbox, thay vì optimistic append hoặc tự chế metadata phân trang. Message ID trùng được bỏ qua; dữ liệu hiển thị dùng adapter/getChronologicalMessages có sẵn.
6. Lỗi queue, mất kết nối hoặc hết 15 giây chờ echo giữ draft. Không tự gửi lại; người dùng cần đối chiếu lịch sử. Reconnect tải lại dữ liệu để bù tin bỏ lỡ. Protocol chưa có clientMessageId/idempotency key, không claim exactly-once.
7. Đổi token/logout đóng connection cũ. Callback muộn phải khớp token/user trong cache; không đưa dữ liệu của session cũ trở lại. CLOSED, thiếu quyền hoặc history lỗi không được gửi.

## File chính

- src/services/chat/chatConnection.js: transport, CONNECT headers, destinations, parse/validate frame, duplicate IDs và cleanup.
- src/features/chat/hooks/useChatRealtime.js: session ownership, pending send/timeout, invalidate cache và reconnect.
- src/features/chat/components/ChatComposer.jsx: draft, submit lock và thông báo lỗi đã dịch.
- ChatPage/ChatHistory: ghép trạng thái kết nối và composer vào inbox/history hiện có.
- vite.config.js: chỉ proxy /chat/info và /chat/{serverId}/{sessionId}/..., hỗ trợ WebSocket. Các route SPA /chat và /chat/{conversationId} không bị proxy sang Backend.

Vitest giới hạn 4 workers để không tạo quá nhiều jsdom cùng lúc trên máy đang mở IDE/Backend. Giữ nguyên tests, assertions và timeouts. Full suite trước đó gặp timeout 5 giây ở test điều hướng đơn hàng có sẵn khi chạy đồng thời Maven; không bỏ test hoặc tăng timeout để giấu lỗi.

## Chu kiểm tra giao diện

1. Restart Backend sau các sửa lỗi chép; restart Vite để dùng dependencies và proxy mới.
2. Dùng hai tài khoản ở hai browser context riêng, ví dụ cửa sổ thường và ẩn danh. Hai tab cùng origin dùng chung localStorage nên không phù hợp để đăng nhập hai tài khoản khác nhau.
3. Mở cùng hội thoại có sẵn. Chờ trạng thái Chat đã kết nối, gửi TEXT hai chiều; mỗi tin xuất hiện một lần, reload vẫn còn.
4. Thử TEXT trắng, bấm đúp Gửi, ngắt kết nối khi đang gửi và reconnect. Kiểm tra draft được giữ khi chưa xác định kết quả, không tự gửi lại. CLOSED không có quyền gửi; không có chức năng gửi ảnh/file hay đánh dấu đã đọc trong bước này.
5. Nếu inbox rỗng, sau khi chép DTO ownerId và restart Backend, mở sản phẩm hoặc gian hàng công khai rồi bấm Chat với gian hàng để bắt đầu cuộc trò chuyện. Không gán sellerId của staff làm người nhận thay thế. Guest đăng nhập rồi bấm lại; owner không tự chat; staff không dùng chat mua bán với owner của shop đang làm, nhưng được chat shop khác. Lịch sử nội bộ cũ chỉ đọc và không bị xóa. Nút có khóa double click và không tự retry POST. Conversation trả về phải đúng actor/owner; callback sau logout/unmount không được mở chat hoặc phục hồi inbox cũ.

Test automation chưa thay cho kiểm tra UI thật. Kết quả checks cuối được ghi ở doc 14 mục 5.2 và Backend change log. Không commit/push trong task này.

Tham khảo: [StompJS client lifecycle](https://stomp-js.github.io/guide/stompjs/using-stompjs-v5.html), [Spring token authentication](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/authentication-token-based.html).


## Tên và business policy mới

ConversationResponse có participant1Name/participant2Name, canSend và sendBlockedReason. Tên lấy batch từ User.fullName; ChatIdentity chọn đúng theo ID hiện tại cho inbox/header/sender, không mượn tên người khác hoặc email. Chu cho phép sửa Backend trực tiếp. ChatAccessPolicy được kiểm tra lại ở mỗi send; người nhận không tồn tại/bị khóa không được tạo hoặc gửi chat. Tạo chat hai chiều đồng thời dùng khóa user theo thứ tự ổn định; không xóa/merge hội thoại trùng cũ. Xem Backend docs/testing/CHAT-NAMES-AND-POLICY.md và read/unread bên dưới.

## Đọc/chưa đọc — 2026-11-21

Backend lưu hai mốc message ID, mỗi participant một mốc, và trả unreadCount riêng theo caller. PATCH read cần {messageId} của phòng; mốc chỉ tăng và cùng lock với send. Vì vậy đọc tới tin 42 không làm tin 43 đến sau bị mất unread. Tin mình gửi không tăng unread; phòng trống bằng 0. Read timestamp cũ vẫn được giữ nghĩa khi chuyển sang cursor.

MainLayout giữ một connection chung nên menu có badge cả ngoài trang chat. /user/queue/chat-reads chỉ phát sau commit; client refetch REST thay vì tự dựng receipt. Poll foreground 30 giây sửa trường hợp bỏ lỡ event. useChatRead chỉ ack bubble incoming mới nhất đã tải khi ít nhất 50% nằm trong viewport và document đang visible/focus. Mount phòng hoặc tab nền không đủ; lỗi có nút retry và không retry tự động. Một ack đang chạy giữ ID cũ, tin mới cần được quan sát riêng.

ChatMessage chỉ hiện “Đã đọc” cho tin mình gửi khi peer cursor của đúng phòng >= ID tin đó. Cursor của mình, giờ máy, hoặc echo gửi thành công không thể tạo read receipt. Không khẳng định từng bubble cũ đều đã được nhìn riêng: đây là mốc đã đọc của phòng.

Backend có migration nullable BIGINT V20261121__chat_read_cursors.sql; local ddl-auto=update đã chạy trong integration tests. DB dùng validate/none cần áp SQL trước deploy Backend rồi frontend. Guide hiện tại: Backend docs/testing/CHAT-READ-UNREAD.md. Full checks: Backend 314 tests (313 pass, 1 disabled cũ); FE 449/449 trong 49 file, format/lint/format:check/build pass. Chờ Chu kiểm tra UI bằng hai tài khoản, không commit/push.
