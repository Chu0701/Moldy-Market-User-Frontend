# Chat — API nền tảng và contract cần thống nhất

Chu đã chọn khách nhắn chủ gian hàng, kể cả khi staff đăng sản phẩm. Giữ nguyên code Backend theo kế hoạch phối hợp với bạn cùng nhóm. Bước đầu này bổ sung lớp REST; chưa có giao diện gửi/nhận hoặc kết nối WebSocket.

## 1. Thêm adapter

Trong src/services/api/pagination.js, thêm hàm dưới cuối file. Giữ nguyên các hàm hiện tại.

```js
/** Normalizes Spring Page metadata to the frontend's one-based page numbering. */
export function normalizeSpringPage({ content, number, size, totalElements, totalPages, last }) {
  return {
    items: content,
    page: number + 1,
    size,
    totalElements,
    totalPages,
    hasNext: !last,
  }
}
```

## 2. Tạo service

Tạo src/services/chat/chatService.js với nội dung sau:

```js
import { apiClient } from '@/services/api/client'
import { normalizeSpringPage } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ signal?: AbortSignal }} [options] */
export async function getConversations({ signal } = {}) {
  const response = await apiClient.get('/api/v1/conversations', { signal })
  return unwrap(response)
}

/** @param {{ targetUserId: string }} participant */
export async function startConversation({ targetUserId }) {
  const response = await apiClient.post('/api/v1/conversations', { targetUserId })
  return unwrap(response)
}

/** @param {{ conversationId: string, page?: number, signal?: AbortSignal }} options */
export async function getConversationMessages({ conversationId, page = 1, signal }) {
  const response = await apiClient.get(
    '/api/v1/conversations/' + encodeURIComponent(conversationId) + '/messages',
    {
      params: { page: page - 1, size: 20 },
      signal,
    },
  )
  return normalizeSpringPage(unwrap(response))
}
```

## Đọc logic

- REST dùng Axios client hiện có, tự gắn token và xử lý refresh như các service khác.
- getConversations trả danh sách từ response envelope, không tự tạo hội thoại hay gọi endpoint đánh dấu đã đọc.
- startConversation chỉ gửi targetUserId. Caller sau này phải lấy đúng chủ gian hàng từ contract được Backend bổ sung. Không lấy sellerId của staff thay cho chủ.
- getConversationMessages nhận page bắt đầu từ 1 ở Frontend, chuyển thành page 0 của Backend. Mỗi trang yêu cầu 20 tin; đây là lựa chọn UI, không phải giới hạn tối đa Backend.
- normalizeSpringPage chuyển number 0 về page 1, content thành items và giữ nguyên thứ tự tin mới nhất trước. Việc sắp xếp hiển thị theo thời gian sẽ làm ở UI, không đảo dữ liệu trong service.
- Service chỉ unwrap dữ liệu và truyền lỗi lên. Quyền tham gia hội thoại vẫn do Backend kiểm tra.

## Đã xác minh trên main local dc11b09

- POST /api/v1/conversations nhận { targetUserId }, tạo hoặc trả hội thoại hiện có; truy vấn tìm cả hai chiều của cặp user.
- GET /api/v1/conversations trả ConversationResponse[], chỉ lấy hội thoại của user hiện tại.
- GET /api/v1/conversations/{id}/messages?page&size trả Spring Page<MessageResponse>, kiểm tra người tham gia.
- SockJS/STOMP có ở /chat. CONNECT nhận Authorization: Bearer <accessToken>; gửi tới /app/conversations/{conversationId}/send, nhận /user/queue/messages và /user/queue/errors.
- Lỗi STOMP thực tế là { code, errorMessage, timestamp }; code dùng ErrorCode.getCode(), còn REST dùng tên enum.

## Những điểm cần thống nhất với bạn làm Backend

Đây là yêu cầu/đề xuất contract, chưa phải các field hoặc behavior đã được triển khai. Trợ lý chưa sửa code Backend.

1. Cung cấp ownerId hoặc cơ chế phân giải người nhận chat của một store. PublicStoreResponse hiện chỉ có id, name, description, createdAt. Quy tắc đã chốt là khách nhắn chủ gian hàng.
2. Bổ sung tên hiển thị và avatar người đối thoại trong dữ liệu hội thoại cho hai bên tham gia. Hiện ConversationResponse chỉ có UUID hai participant, nên chưa đủ để làm inbox nhận biết được người nói chuyện. Cần thống nhất tên field trước khi Frontend đọc các field mới.
3. Nối PATCH /conversations/{id}/read với ConversationService.markAsRead và kiểm tra participant. Controller hiện chỉ trả 204, nên chưa thể dùng làm read receipt.
4. Khi lưu tin, cập nhật lastMessageAt và kiểm tra hội thoại còn ACTIVE. MessageService hiện chưa thực hiện hai việc này.
5. Kiểm tra tính duy nhất của cặp participant khi hai bên cùng tạo hội thoại, và validation content cho tin TEXT ở Backend. Frontend sẽ không tự gửi lại tin khi chưa chắc Backend đã lưu.
6. Sửa MessageMapper để map conversation.id sang conversationId. Generated MessageMapperImpl local hiện bỏ sót conversationId và attachment. REST history được scoped theo URL; socket phải có conversationId thật trước khi nối realtime.

## Kiểm tra repo chính

Chu đã chép adapter và service. Trợ lý sửa getConversationMessage thành getConversationMessages và thêm dấu / bị thiếu trước conversationId. Trước khi sửa, 3/9 test mới fail đúng phần tải lịch sử. Sau khi sửa, format/lint/build và toàn bộ 281/281 test pass trên repo chính. Chưa kiểm thử HTTP chat hoặc WebSocket thật; chưa có màn hình chat hay gửi tin trong ứng dụng.

## Bước tiếp theo

Lớp REST đã có trong repo chính; hook/inbox chỉ đọc đã chuẩn bị trong chat-inbox.md, chờ Chu chép source/routes/menu/i18n. Điểm vào chat từ sản phẩm chờ dữ liệu người nhận đúng quy tắc chủ gian hàng. Phần WebSocket cần thư viện STOMP/SockJS và cấu hình proxy riêng để đường dẫn kết nối không đụng route /chat của SPA. Cần đóng kết nối khi logout/đổi tài khoản, dùng token hiện tại khi reconnect và phân biệt gửi frame với tin đã được Backend lưu.
