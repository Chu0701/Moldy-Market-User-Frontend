# Inbox và lịch sử chat

Bước này dùng REST đã có để xem hội thoại và lịch sử, tải tin cũ và làm mới. Chưa kết nối WebSocket hoặc gửi tin; textarea/nút Gửi bị tắt và có thông báo. Không gọi endpoint đánh dấu đã đọc đang là stub. Backend giữ nguyên.

API chưa có tên/avatar người đối thoại. UI tạm dùng nhãn Hội thoại 1, 2… theo thứ tự danh sách và ngày tạo thực, không dựng tên người hay hiển thị UUID. Đây là nhãn giao diện tạm, sẽ thay bằng dữ liệu người đối thoại khi contract được bổ sung. Quy tắc nhắn chủ gian hàng vẫn giữ; chưa có nút tạo hội thoại từ sản phẩm vì thiếu người nhận đúng contract.

## 1. src/features/chat/hooks/useChat.js

Tạo file mới đúng tên và thư mục.

```js
import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { getConversationMessages, getConversations } from '@/services/chat/chatService'

export const chatKeys = {
  conversations: (userId) => ['chat', userId, 'conversations'],
  messages: (userId, conversationId) => ['chat', userId, 'messages', conversationId],
}

export function useConversations() {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined
  const query = useQuery({
    queryKey: chatKeys.conversations(userId),
    queryFn: userId ? ({ signal }) => getConversations({ signal }) : skipToken,
    select: (conversations) =>
      conversations.filter(
        (conversation) =>
          conversation.participant1Id === userId || conversation.participant2Id === userId,
      ),
    retry: false,
  })

  return { userId, query }
}

export function useConversationMessages(conversationId) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useInfiniteQuery({
    queryKey: chatKeys.messages(userId, conversationId),
    queryFn:
      userId && conversationId
        ? ({ pageParam, signal }) =>
            getConversationMessages({ conversationId, page: pageParam, signal })
        : skipToken,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    retry: false,
  })
}
```

## 2. src/features/chat/chatMessages.js

Tạo file mới đúng tên và thư mục.

```js
export function getChronologicalMessages(pages = []) {
  const byId = new Map()

  for (const page of pages) {
    for (const message of page.items) {
      if (!byId.has(message.id)) byId.set(message.id, message)
    }
  }

  return [...byId.values()].sort(
    (left, right) =>
      (Date.parse(left.sentAt) || 0) - (Date.parse(right.sentAt) || 0) || left.id - right.id,
  )
}
```

## 3. src/features/chat/components/ChatTime.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'

/** @param {{ value?: string }} props */
export function ChatTime({ value }) {
  const { t, i18n } = useTranslation()
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return <span>{t('chat.timeUnknown')}</span>

  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date)}
    </time>
  )
}
```

## 4. src/features/chat/components/ChatMessage.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'

import { ChatTime } from '@/features/chat/components/ChatTime'
import { cn } from '@/lib/utils'

const fallbackKeys = {
  IMAGE: 'chat.imageMessage',
  FILE: 'chat.fileMessage',
}

/** @param {{ message: object, userId: string }} props */
export function ChatMessage({ message, userId }) {
  const { t } = useTranslation()
  const isMine = message.senderId === userId
  const content =
    message.type === 'TEXT'
      ? message.content || t('chat.emptyText')
      : t(fallbackKeys[message.type] ?? 'chat.unsupportedMessage')

  return (
    <li className={cn('chat-message', isMine ? 'chat-message-own' : 'chat-message-peer')}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{t(isMine ? 'chat.you' : 'chat.peer')}</span>
        <ChatTime value={message.sentAt} />
      </div>
      <p className="whitespace-pre-wrap">{content}</p>
    </li>
  )
}
```

## 5. src/features/chat/components/ConversationList.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { ChatTime } from '@/features/chat/components/ChatTime'
import { cn } from '@/lib/utils'

/** @param {{ conversations: Array<object> }} props */
export function ConversationList({ conversations }) {
  const { t } = useTranslation()

  return (
    <ul className="grid gap-2" aria-label={t('chat.listLabel')}>
      {conversations.map((conversation, index) => (
        <li key={conversation.id}>
          <NavLink
            to={'/chat/' + encodeURIComponent(conversation.id)}
            aria-label={t('chat.openConversation', { number: index + 1 })}
            className={({ isActive }) =>
              cn('chat-room-link', isActive && 'bg-accent text-accent-foreground')
            }
          >
            <span className="font-medium">
              {t('chat.conversationTitle', { number: index + 1 })}
            </span>
            <span className="text-sm text-muted-foreground">{t('chat.identityPending')}</span>
            <span className="text-xs text-muted-foreground">
              {t('chat.createdAt')} <ChatTime value={conversation.createdAt} />
            </span>
            {conversation.status === 'CLOSED' && (
              <span className="text-sm">{t('chat.closed')}</span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
```

## 6. src/features/chat/components/ChatHistory.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { getChronologicalMessages } from '@/features/chat/chatMessages'
import { ChatMessage } from '@/features/chat/components/ChatMessage'
import { useConversationMessages } from '@/features/chat/hooks/useChat'

const statusKeys = { ACTIVE: 'chat.active', CLOSED: 'chat.closed' }

/** @param {{ conversation: object, userId: string, title: string }} props */
export function ChatHistory({ conversation, userId, title }) {
  const { t } = useTranslation()
  const query = useConversationMessages(conversation.id)
  const messages = getChronologicalMessages(query.data?.pages)
  let content
  let olderLabel = 'chat.loadOlder'
  if (query.isFetchingNextPage) olderLabel = 'chat.loadingOlder'
  else if (query.isFetchNextPageError) olderLabel = 'chat.retryOlder'

  if (query.isPending) {
    content = <p role="status">{t('chat.loadingMessages')}</p>
  } else if (query.error?.status === 403) {
    content = <ForbiddenState />
  } else if (query.isError && !query.data) {
    content = (
      <ErrorState
        title={t('chat.historyError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  } else {
    content = (
      <>
        {query.hasNextPage && (
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.fetchNextPage()}
          >
            {t(olderLabel)}
          </Button>
        )}
        {query.isFetchNextPageError && <p role="alert">{t('chat.olderError')}</p>}
        {query.isRefetchError && !query.isFetchNextPageError && (
          <p role="alert">{t('chat.refreshError')}</p>
        )}
        <p role="status" className="text-sm text-muted-foreground">
          {t('chat.loadedCount', { count: messages.length })}
        </p>

        {messages.length === 0 ? (
          <EmptyState
            title={t('chat.emptyHistory')}
            description={t('chat.emptyHistoryDescription')}
          />
        ) : (
          <ol className="chat-messages" aria-label={t('chat.historyLabel')}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} userId={userId} />
            ))}
          </ol>
        )}
      </>
    )
  }

  return (
    <section className="chat-thread" aria-labelledby="chat-thread-title">
      <Link to="/chat" className="underline underline-offset-4 lg:hidden">
        {t('chat.backToList')}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="chat-thread-title">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {t(statusKeys[conversation.status] ?? 'chat.statusUnknown')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t('chat.refreshMessages')}
        </Button>
      </div>
      {content}
      <form className="chat-compose" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="chat-message-draft">{t('chat.messageLabel')}</label>
        <textarea
          id="chat-message-draft"
          rows={2}
          disabled
          placeholder={t('chat.composerPlaceholder')}
        />
        <p id="chat-readonly-notice" className="text-sm text-muted-foreground">
          {t(conversation.status === 'CLOSED' ? 'chat.closedNotice' : 'chat.readOnlyNotice')}
        </p>
        <Button type="submit" disabled aria-describedby="chat-readonly-notice">
          {t('chat.send')}
        </Button>
      </form>
    </section>
  )
}
```

## 7. src/features/chat/pages/ChatPage.jsx

Tạo file mới đúng tên và thư mục.

```jsx
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { ChatHistory } from '@/features/chat/components/ChatHistory'
import { ConversationList } from '@/features/chat/components/ConversationList'
import { useConversations } from '@/features/chat/hooks/useChat'
import { cn } from '@/lib/utils'

export function ChatPage() {
  const { t } = useTranslation()
  const { conversationId } = useParams()
  const { userId, query } = useConversations()
  let content

  if (query.isPending) {
    content = <p role="status">{t('chat.loadingConversations')}</p>
  } else if (query.error?.status === 403) {
    content = <ForbiddenState />
  } else if (query.isError) {
    content = (
      <ErrorState
        title={t('chat.listError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  } else if (query.data.length === 0) {
    content = (
      <div className="grid justify-items-start gap-4">
        <EmptyState
          title={t(conversationId ? 'chat.notFoundTitle' : 'chat.emptyTitle')}
          description={t(conversationId ? 'chat.notFoundDescription' : 'chat.emptyDescription')}
        />
        {conversationId && (
          <Link to="/chat" className="underline underline-offset-4">
            {t('chat.backToList')}
          </Link>
        )}
      </div>
    )
  } else {
    const index = query.data.findIndex((conversation) => conversation.id === conversationId)
    const selected = query.data[index]

    content = (
      <div className="chat-layout">
        <aside
          className={cn('chat-sidebar', conversationId && 'hidden lg:grid')}
          aria-labelledby="chat-list-title"
        >
          <h2 id="chat-list-title">{t('chat.listTitle')}</h2>
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('chat.refreshConversations')}
          </Button>
          <ConversationList conversations={query.data} />
        </aside>
        {selected ? (
          <ChatHistory
            key={selected.id}
            conversation={selected}
            userId={userId}
            title={t('chat.conversationTitle', { number: index + 1 })}
          />
        ) : conversationId ? (
          <section className="chat-thread">
            <EmptyState
              title={t('chat.notFoundTitle')}
              description={t('chat.notFoundDescription')}
            />
            <Link to="/chat" className="underline underline-offset-4">
              {t('chat.backToList')}
            </Link>
          </section>
        ) : (
          <section className="chat-thread hidden lg:grid">
            <h2>{t('chat.chooseTitle')}</h2>
            <p className="text-muted-foreground">{t('chat.chooseDescription')}</p>
          </section>
        )}
      </div>
    )
  }

  return (
    <section className="chat-page" aria-labelledby="chat-page-title">
      <h1 id="chat-page-title">{t('chat.title')}</h1>
      {content}
    </section>
  )
}
```

## 8. Routes

Trong src/app/router/routes.js, thêm hai route sau trong nhóm RequireAuth đang chứa cart, checkout và orders, trước route my-products:

```jsx
              {
                path: 'chat',
                lazy: async () => ({
                  Component: (await import('@/features/chat/pages/ChatPage')).ChatPage,
                }),
              },
              {
                path: 'chat/:conversationId',
                lazy: async () => ({
                  Component: (await import('@/features/chat/pages/ChatPage')).ChatPage,
                }),
              },
```

## 9. Menu

Trong src/app/layouts/MainLayout.jsx, thêm ngay sau dòng menu orders trong visibleNavigation:

```js
{ to: '/chat', label: 'chat.title' },
```

## 10. Nội dung vi

Thêm key chat dưới đây vào object gốc của src/i18n/locales/vi/common.json. File chỉ có một object JSON gốc: không dán thêm cả object thứ hai sau dấu đóng cuối file. Giữ các key hiện có và thêm dấu phẩy đúng chỗ.

```json
{
  "chat": {
    "title": "Tin nhắn",
    "listTitle": "Hội thoại",
    "listLabel": "Danh sách hội thoại",
    "openConversation": "Mở hội thoại {{number}}",
    "conversationTitle": "Hội thoại {{number}}",
    "identityPending": "Chưa có tên người đối thoại",
    "createdAt": "Bắt đầu:",
    "timeUnknown": "Chưa có thời gian",
    "closed": "Đã đóng",
    "active": "Đang mở",
    "statusUnknown": "Chưa có thông tin trạng thái",
    "loadingMessages": "Đang tải lịch sử tin nhắn…",
    "historyError": "Chưa tải được lịch sử tin nhắn",
    "loadOlder": "Tải tin cũ",
    "loadingOlder": "Đang tải tin cũ…",
    "retryOlder": "Thử tải tin cũ lại",
    "olderError": "Chưa tải được tin cũ. Các tin đã tải vẫn được giữ.",
    "refreshError": "Chưa cập nhật được lịch sử. Các tin đã tải vẫn được giữ.",
    "loadedCount": "Đã tải {{count}} tin nhắn",
    "emptyHistory": "Chưa có tin nhắn",
    "emptyHistoryDescription": "Lịch sử của cuộc trò chuyện này hiện đang trống.",
    "historyLabel": "Lịch sử tin nhắn",
    "you": "Bạn",
    "peer": "Người đối thoại",
    "emptyText": "Tin nhắn không có nội dung",
    "imageMessage": "Tin nhắn hình ảnh",
    "fileMessage": "Tin nhắn tệp",
    "unsupportedMessage": "Chưa hỗ trợ hiển thị loại tin nhắn này.",
    "backToList": "Về danh sách hội thoại",
    "refreshMessages": "Làm mới tin nhắn",
    "messageLabel": "Nội dung tin nhắn",
    "composerPlaceholder": "Chức năng gửi tin đang được chuẩn bị",
    "readOnlyNotice": "Bạn có thể xem lịch sử; chức năng gửi tin đang được chuẩn bị.",
    "closedNotice": "Hội thoại đã đóng. Bạn có thể xem lịch sử.",
    "send": "Gửi",
    "loadingConversations": "Đang tải hội thoại…",
    "listError": "Chưa tải được hội thoại",
    "notFoundTitle": "Không tìm thấy hội thoại",
    "notFoundDescription": "Hội thoại không có trong danh sách của tài khoản hiện tại.",
    "emptyTitle": "Bạn chưa có hội thoại",
    "emptyDescription": "Các cuộc trò chuyện của bạn sẽ xuất hiện tại đây.",
    "refreshConversations": "Làm mới hội thoại",
    "chooseTitle": "Chọn một hội thoại",
    "chooseDescription": "Chọn hội thoại trong danh sách để xem lịch sử."
  }
}
```

## 11. Nội dung en

Thêm key chat dưới đây vào object gốc của src/i18n/locales/en/common.json. File chỉ có một object JSON gốc: không dán thêm cả object thứ hai sau dấu đóng cuối file. Giữ các key hiện có và thêm dấu phẩy đúng chỗ.

```json
{
  "chat": {
    "title": "Messages",
    "listTitle": "Conversations",
    "listLabel": "Conversation list",
    "openConversation": "Open conversation {{number}}",
    "conversationTitle": "Conversation {{number}}",
    "identityPending": "Participant name unavailable",
    "createdAt": "Started:",
    "timeUnknown": "Time unavailable",
    "closed": "Closed",
    "active": "Open",
    "statusUnknown": "Status unavailable",
    "loadingMessages": "Loading message history…",
    "historyError": "Unable to load message history",
    "loadOlder": "Load older messages",
    "loadingOlder": "Loading older messages…",
    "retryOlder": "Retry older messages",
    "olderError": "Could not load older messages. Loaded messages are kept.",
    "refreshError": "Could not refresh history. Loaded messages are kept.",
    "loadedCount": "Loaded messages: {{count}}",
    "emptyHistory": "No messages yet",
    "emptyHistoryDescription": "This conversation has no message history yet.",
    "historyLabel": "Message history",
    "you": "You",
    "peer": "Other participant",
    "emptyText": "Message has no content",
    "imageMessage": "Image message",
    "fileMessage": "File message",
    "unsupportedMessage": "This message type cannot be displayed yet.",
    "backToList": "Back to conversations",
    "refreshMessages": "Refresh messages",
    "messageLabel": "Message content",
    "composerPlaceholder": "Sending messages is being prepared",
    "readOnlyNotice": "You can view history. Sending messages is being prepared.",
    "closedNotice": "This conversation is closed. You can view its history.",
    "send": "Send",
    "loadingConversations": "Loading conversations…",
    "listError": "Unable to load conversations",
    "notFoundTitle": "Conversation not found",
    "notFoundDescription": "This conversation is not in the current account’s list.",
    "emptyTitle": "No conversations yet",
    "emptyDescription": "Your conversations will appear here.",
    "refreshConversations": "Refresh conversations",
    "chooseTitle": "Choose a conversation",
    "chooseDescription": "Choose a conversation from the list to view its history."
  }
}
```

## Đọc logic

- chatKeys có userId và conversationId để tách dữ liệu giữa tài khoản/phòng. Logout tiếp tục dùng cơ chế clear QueryClient hiện có.
- Chỉ mount ChatHistory khi conversationId nằm trong danh sách hội thoại của session. ID lạ không làm gọi history. Backend vẫn là nơi quyết định quyền participant.
- useInfiniteQuery bắt đầu page 1 ở Frontend, service chuyển sang page 0. Trang kế tiếp dựa trên page/hasNext đã normalize.
- getChronologicalMessages gộp các trang, bỏ trùng theo message.id rồi sắp từ cũ đến mới bằng sentAt và id. Không sửa mảng response gốc.
- REST history được scoped theo URL và query key. Generated MessageMapper hiện bỏ sót conversationId, nên UI không dựa vào field đó và không tự điền giả vào message. Trước khi nối realtime, Backend phải sửa mapping để trả conversationId; không đoán phòng từ socket message thiếu field này.
- Lỗi tải tin cũ giữ nội dung đã tải. Server trả 403 thì ẩn lịch sử và hiển thị forbidden. Đổi phòng không dùng placeholderData từ phòng cũ.
- Nội dung TEXT hiển thị bằng React text, không dùng dangerouslySetInnerHTML. IMAGE/FILE chỉ có nhãn loại tin ở bước này vì attachment chưa có mapping hoàn chỉnh.
- Nút làm mới là thao tác đọc; không có gửi tự động, read receipt, unread count hoặc online indicator giả.
- Desktop có sidebar và lịch sử; mobile mở lần lượt danh sách/phòng, có link quay lại. Chu tự thử giao diện sau khi chép.

## Kiểm tra sau khi chép

1. Đăng nhập, mở Tin nhắn. Không có hội thoại thì thấy trạng thái rỗng đúng dữ liệu thật.
2. Có hội thoại thì mở và xem lịch sử; tin TEXT phải hiển thị nguyên văn và theo thứ tự thời gian.
3. Tải tin cũ: tin trùng giữa các trang chỉ hiện một lần. Khi lỗi vẫn thấy lịch sử đã tải và có nút thử lại.
4. Đổi phòng hoặc logout trong lúc đang tải: không hiện tin phòng/tài khoản cũ.
5. ID hội thoại lạ không tải lịch sử. Nút Gửi vẫn tắt vì bước này chỉ xem lịch sử.

CSS và test được trợ lý thêm trực tiếp. Source, routes, menu, i18n chờ Chu chép; báo xong để kiểm tra repo chính.

Cập nhật 2026-11-20: Chu đã chép các phần. Khi kiểm tra đã bổ sung hook useConversations bị thiếu, import useTranslation trong ChatTime và chuyển nhóm chat của cả vi/en từ orders.chat ra object gốc. Inbox ở repo chính chỉ đọc, chưa có gửi tin hoặc kiểm thử HTTP thật.

## Ghi nhận khi kiểm tra

Bản sao kiểm tra đã được lắp đầy đủ code trong hướng dẫn: format:check, lint, build pass; toàn bộ 297/297 test (33 file) pass, gồm 16 test mới của inbox. Repo chính mới có CSS/test; chưa có source/routes/menu/i18n chat cho tới khi Chu chép nên chưa chạy được toàn bộ test ở trạng thái này. Chưa kiểm thử HTTP chat hoặc giao diện thật.

Test đăng ký cũ đôi lúc thấy nút Gửi lại sau 61 giây ở khung đầu: VerifyEmailForm khởi tạo now và retryAt bằng hai lần Date.now riêng, Math.ceil làm tròn lên khi lệch một mili giây. Test hiện chờ nhịp đếm về đúng 60 giây rồi kiểm tra disabled; không đổi logic auth trong task chat. Cần sửa riêng để dùng cùng mốc thời gian lúc khởi tạo bộ đếm.

Kiểm tra lại 2026-11-20: chờ nhịp đếm vẫn không ổn định dưới full suite. Test đăng ký nay mock Date.now bằng một mốc cố định và restore trong finally; vẫn kiểm tra nút 60 giây bị disabled, không sửa logic auth hoặc bỏ assertion.

Kết quả repo chính 2026-11-20: toàn bộ 297/297 test (33 file) pass; format/lint/build pass. Chưa kiểm thử HTTP chat, WebSocket hoặc giao diện thật. Inbox chỉ đọc đã có trong source chính.
