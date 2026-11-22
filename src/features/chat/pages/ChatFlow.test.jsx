import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { routes } from '@/app/router/routes'
import i18n from '@/i18n'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { apiClient } from '@/services/api/client'
import {
  getConversations,
  getConversationMessages,
  startConversation,
  markConversationRead,
} from '@/services/chat/chatService'
import { getMe } from '@/services/users/userService'
import { connectChat } from '@/services/chat/chatConnection'

vi.mock('@/services/chat/chatConnection', () => ({ connectChat: vi.fn() }))

vi.mock('@/services/chat/chatService', () => ({
  getConversations: vi.fn(),
  getConversationMessages: vi.fn(),
  startConversation: vi.fn(),
  markConversationRead: vi.fn(),
}))
vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))
vi.mock('@/services/api/authRefreshInterceptor', () => ({
  waitForPendingRefresh: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/services/auth/authService', () => ({
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  registerAccount: vi.fn(),
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
}))
vi.mock('@/services/categories/categoryService', () => ({
  getCategoryTree: vi.fn().mockResolvedValue([]),
  getCategoryById: vi.fn(),
}))

const conversation = {
  id: 'conversation-1',
  participant1Id: 'chat-buyer',
  participant2Id: 'chat-owner',
  status: 'ACTIVE',
  canSend: true,
  createdAt: '2026-11-19T01:00:00Z',
}
const otherConversation = { ...conversation, id: 'conversation-2', participant2Id: 'other-owner' }
const oldMessage = {
  id: 1,
  conversationId: null,
  senderId: 'chat-owner',
  type: 'TEXT',
  content: 'Old message',
  sentAt: '2026-11-19T01:00:00Z',
}
const middleMessage = {
  ...oldMessage,
  id: 2,
  content: 'Middle message',
  sentAt: '2026-11-19T02:00:00Z',
}
const newMessage = {
  ...oldMessage,
  id: 3,
  senderId: 'chat-buyer',
  content: 'New message',
  sentAt: '2026-11-19T03:00:00Z',
}
const firstPage = {
  items: [newMessage, middleMessage],
  page: 1,
  size: 20,
  totalElements: 3,
  totalPages: 2,
  hasNext: true,
}
const olderPage = {
  items: [middleMessage, oldMessage],
  page: 2,
  size: 20,
  totalElements: 3,
  totalPages: 2,
  hasNext: false,
}
let router
let socketCallbacks
let transport
let queryClient

beforeEach(async () => {
  setAccessToken('test-access-token')
  vi.mocked(getMe)
    .mockReset()
    .mockResolvedValue({ id: 'chat-buyer', roles: ['USER'] })
  vi.mocked(getConversations).mockReset().mockResolvedValue([conversation, otherConversation])
  vi.mocked(getConversationMessages).mockReset().mockResolvedValue(firstPage)
  vi.mocked(startConversation).mockReset()
  vi.mocked(markConversationRead).mockReset().mockResolvedValue(undefined)
  socketCallbacks = undefined
  transport = { sendText: vi.fn(), close: vi.fn() }
  vi.mocked(connectChat)
    .mockReset()
    .mockImplementation((callbacks) => {
      socketCallbacks = callbacks
      return transport
    })
  vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Unexpected direct request'))
  vi.spyOn(apiClient, 'patch').mockRejectedValue(new Error('Read receipt must not be called'))
  await i18n.changeLanguage('vi')
})

afterEach(() => {
  vi.useRealTimers()
  clearAccessToken()
  router?.dispose()
  queryClient?.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('shows unread badges, acknowledges only visible incoming and waits for peer cursor to show Read', async () => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  let observe
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback) {
        observe = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.mocked(getConversations).mockResolvedValue([
    { ...conversation, unreadCount: 2, lastReadMessageIdParticipant1: 1 },
  ])
  vi.mocked(getConversationMessages).mockResolvedValue({
    ...firstPage,
    items: firstPage.items.map((message) => ({ ...message, conversationId: conversation.id })),
  })
  renderRoute('/chat/conversation-1')
  await screen.findByText('New message')
  expect(screen.getAllByLabelText('2 tin chưa đọc')).toHaveLength(2)
  expect(markConversationRead).not.toHaveBeenCalled()
  expect(screen.queryByText('Đã đọc')).not.toBeInTheDocument()
  await act(async () => observe([{ isIntersecting: true, intersectionRatio: 1 }]))
  await waitFor(() =>
    expect(markConversationRead).toHaveBeenCalledExactlyOnceWith({
      conversationId: conversation.id,
      messageId: 2,
    }),
  )
  await connect()
  vi.mocked(getConversations).mockResolvedValue([
    {
      ...conversation,
      unreadCount: 0,
      lastReadMessageIdParticipant1: 2,
      lastReadMessageIdParticipant2: 3,
    },
  ])
  await act(async () =>
    socketCallbacks.onRead({
      conversationId: conversation.id,
      readerId: 'chat-owner',
      messageId: 3,
    }),
  )
  await screen.findByText('Đã đọc')
  expect(screen.queryByLabelText('2 tin chưa đọc')).not.toBeInTheDocument()
})

test('keeps one live connection and updates the menu badge outside the chat page', async () => {
  renderRoute('/chat')
  await screen.findByRole('link', { name: 'Mở hội thoại 1' })
  await connect()
  await act(async () => router.navigate('/'))
  const activeConnections = vi.mocked(connectChat).mock.calls.length
  vi.mocked(getConversations).mockResolvedValue([{ ...conversation, unreadCount: 1 }])
  await act(async () =>
    socketCallbacks.onMessage({ ...oldMessage, conversationId: conversation.id }),
  )
  await screen.findByLabelText('1 tin chưa đọc')
  expect(connectChat).toHaveBeenCalledTimes(activeConnections)
  expect(router.state.location.pathname).toBe('/')
})

async function connect() {
  await waitFor(() => expect(socketCallbacks).toBeDefined())
  await act(async () => {
    expect(await socketCallbacks.authorize()).toBe('test-access-token')
    socketCallbacks.onState('connected')
  })
}

test('sends once, keeps the draft while pending, then clears only after the server echo', async () => {
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await connect()
  const draft = screen.getByLabelText('Nội dung tin nhắn')
  await user.type(draft, 'Xin chào')
  await user.dblClick(screen.getByRole('button', { name: 'Gửi' }))
  expect(transport.sendText).toHaveBeenCalledExactlyOnceWith('conversation-1', 'Xin chào')
  expect(draft).toHaveValue('Xin chào')
  expect(
    within(screen.getByRole('list', { name: 'Lịch sử tin nhắn' })).queryByText('Xin chào'),
  ).not.toBeInTheDocument()
  const echo = { ...newMessage, id: 4, conversationId: conversation.id, content: 'Xin chào' }
  vi.mocked(getConversationMessages).mockResolvedValue({
    ...firstPage,
    items: [echo, ...firstPage.items],
  })
  await act(async () => {
    await socketCallbacks.onMessage(echo)
  })
  await waitFor(() => expect(draft).toHaveValue(''))
  expect(await screen.findByText('Xin chào')).toBeInTheDocument()
})

test('incoming peer message refreshes history safely and a frame from another room does not clear this draft', async () => {
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await connect()
  await user.type(screen.getByLabelText('Nội dung tin nhắn'), 'My draft')
  const incoming = {
    ...middleMessage,
    id: 9,
    conversationId: conversation.id,
    content: '<script>hello</script>',
  }
  vi.mocked(getConversationMessages).mockResolvedValue({
    ...firstPage,
    items: [incoming, ...firstPage.items],
  })
  await act(async () => {
    await socketCallbacks.onMessage(incoming)
  })
  expect(await screen.findByText('<script>hello</script>')).toBeInTheDocument()
  await act(async () => {
    await socketCallbacks.onMessage({ ...incoming, conversationId: otherConversation.id })
  })
  expect(screen.getByLabelText('Nội dung tin nhắn')).toHaveValue('My draft')
})

test('server rejection preserves the draft and never automatically resends', async () => {
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await connect()
  await user.type(screen.getByLabelText('Nội dung tin nhắn'), 'Keep this')
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
  await act(async () => {
    socketCallbacks.onError({ code: 'COMMON_002' })
  })
  expect(await screen.findByRole('alert')).toHaveTextContent('Nội dung nháp vẫn được giữ')
  expect(screen.getByLabelText('Nội dung tin nhắn')).toHaveValue('Keep this')
  expect(transport.sendText).toHaveBeenCalledTimes(1)
})

test('disconnect during a send keeps the draft and reconnect reloads canonical history without resending', async () => {
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await connect()
  await user.type(screen.getByLabelText('Nội dung tin nhắn'), 'Maybe sent')
  await user.click(screen.getByRole('button', { name: 'Gửi' }))
  await act(async () => {
    socketCallbacks.onState('disconnected')
  })
  expect(await screen.findByRole('alert')).toHaveTextContent('kiểm tra lịch sử trước khi gửi lại')
  expect(screen.getByLabelText('Nội dung tin nhắn')).toHaveValue('Maybe sent')
  await connect()
  expect(transport.sendText).toHaveBeenCalledTimes(1)
})

test('a send confirmation timeout preserves the draft', async () => {
  renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await connect()
  vi.useFakeTimers()
  fireEvent.change(screen.getByLabelText('Nội dung tin nhắn'), { target: { value: 'No echo' } })
  fireEvent.submit(screen.getByLabelText('Nội dung tin nhắn').closest('form'))
  await act(async () => {
    vi.advanceTimersByTime(15001)
  })
  vi.useRealTimers()
  expect(await screen.findByRole('alert')).toHaveTextContent('kiểm tra lịch sử trước khi gửi lại')
  expect(screen.getByLabelText('Nội dung tin nhắn')).toHaveValue('No echo')
})

test('logout closes the transport and ignores late socket messages', async () => {
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await connect()
  const previous = socketCallbacks
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await screen.findByRole('button', { name: 'Đăng nhập' })
  await act(async () => {
    await previous.onMessage({
      ...newMessage,
      id: 7,
      conversationId: conversation.id,
      content: 'Late private message',
    })
  })
  expect(transport.close).toHaveBeenCalled()
  expect(
    queryClient.getQueryData(['chat', 'chat-buyer', 'messages', conversation.id]),
  ).toBeUndefined()
  expect(screen.queryByText('Late private message')).not.toBeInTheDocument()
})

test('token rotation replaces the connection and ignores callbacks from the previous token', async () => {
  renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await connect()
  const previous = socketCallbacks
  const count = vi.mocked(connectChat).mock.calls.length
  await act(async () => {
    setAccessToken('rotated-token')
  })
  await waitFor(() => expect(vi.mocked(connectChat).mock.calls.length).toBeGreaterThan(count))
  expect(transport.close).toHaveBeenCalled()
  await act(async () => {
    expect(await socketCallbacks.authorize()).toBe('rotated-token')
    socketCallbacks.onState('connected')
    await previous.onMessage({
      ...newMessage,
      id: 8,
      conversationId: conversation.id,
      content: 'Old-token frame',
    })
  })
  expect(screen.queryByText('Old-token frame')).not.toBeInTheDocument()
})

test('shows the real peer in the inbox, header and message sender labels', async () => {
  vi.mocked(getConversations).mockResolvedValue([
    { ...conversation, participant1Name: 'Chu', participant2Name: 'Nguyễn An' },
  ])
  const user = renderRoute('/chat')
  await user.click(
    await screen.findByRole(
      'link',
      { name: 'Mở cuộc trò chuyện với Nguyễn An' },
      { timeout: 4000 },
    ),
  )
  await screen.findByRole('heading', { name: 'Nguyễn An' })
  const messages = await screen.findByRole('list', { name: 'Lịch sử tin nhắn' })
  expect(within(messages).getByText('Nguyễn An')).toBeInTheDocument()
  expect(within(messages).getByText('Chu (Bạn)')).toBeInTheDocument()
  expect(screen.queryByText('Chưa có tên người đối thoại')).not.toBeInTheDocument()
})

test.each(['CHAT_STORE_MEMBER', 'CHAT_PARTICIPANT_UNAVAILABLE'])(
  'server policy %s makes an existing conversation read-only without hiding history',
  async (reason) => {
    vi.mocked(getConversations).mockResolvedValue([
      { ...conversation, canSend: false, sendBlockedReason: reason },
    ])
    renderRoute('/chat/conversation-1')
    await screen.findByText('New message', {}, { timeout: 4000 })
    await connect()
    expect(screen.getByRole('button', { name: 'Gửi' })).toBeDisabled()
    expect(screen.getByLabelText('Nội dung tin nhắn')).toBeDisabled()
    expect(
      screen.getByText(
        reason === 'CHAT_STORE_MEMBER'
          ? /Chủ shop và nhân viên không dùng chat mua bán/
          : /Tài khoản trong cuộc trò chuyện hiện không khả dụng/,
      ),
    ).toBeInTheDocument()
    expect(transport.sendText).not.toHaveBeenCalled()
  },
)

function renderRoute(path) {
  router = createMemoryRouter(routes, { initialEntries: [path] })
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

test('shows a genuinely empty inbox without requesting message history', async () => {
  vi.mocked(getConversations).mockResolvedValue([])
  renderRoute('/chat')
  await screen.findByText('Bạn chưa có hội thoại', {}, { timeout: 4000 })
  expect(getConversationMessages).not.toHaveBeenCalled()
  expect(startConversation).not.toHaveBeenCalled()
})

test('opens an owned conversation, renders text safely and keeps send/read receipt inactive', async () => {
  const unsafeText = '<img src=x onerror="alert(1)">'
  vi.mocked(getConversations).mockResolvedValue([
    conversation,
    {
      ...conversation,
      id: 'foreign',
      participant1Id: 'foreign-one',
      participant2Id: 'foreign-two',
    },
    otherConversation,
  ])
  vi.mocked(getConversationMessages).mockResolvedValue({
    ...firstPage,
    items: [{ ...newMessage, content: unsafeText }, middleMessage],
    hasNext: false,
  })
  const user = renderRoute('/chat')
  const link = await screen.findByRole('link', { name: 'Mở hội thoại 1' }, { timeout: 4000 })
  expect(screen.getAllByRole('link', { name: /Mở hội thoại/ })).toHaveLength(2)
  await user.click(link)
  await screen.findByText(unsafeText, {}, { timeout: 4000 })
  const thread = screen.getByRole('region', { name: 'Hội thoại 1' })
  expect(within(thread).queryByRole('img')).not.toBeInTheDocument()
  expect(within(thread).getByText('Bạn')).toBeInTheDocument()
  expect(within(thread).getByText('Người đối thoại')).toBeInTheDocument()
  expect(within(thread).getByRole('button', { name: 'Gửi' })).toBeDisabled()
  expect(within(thread).getByLabelText('Nội dung tin nhắn')).toBeDisabled()
  expect(apiClient.patch).not.toHaveBeenCalled()
  expect(apiClient.get).not.toHaveBeenCalled()
  expect(startConversation).not.toHaveBeenCalled()
  expect(
    queryClient.getQueryData(['chat', 'chat-buyer', 'messages', 'conversation-1']),
  ).toBeDefined()
})

test('loads older pages in chronological order and removes duplicate ids', async () => {
  vi.mocked(getConversationMessages)
    .mockResolvedValueOnce(firstPage)
    .mockResolvedValueOnce(olderPage)
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Tải tin cũ' }))
  await screen.findByText('Old message')
  const history = screen.getByRole('list', { name: 'Lịch sử tin nhắn' })
  expect(
    within(history)
      .getAllByRole('listitem')
      .map((item) => within(item).getByText(/^(Old|Middle|New) message$/).textContent),
  ).toEqual(['Old message', 'Middle message', 'New message'])
  expect(getConversationMessages.mock.calls.map(([options]) => options.page)).toEqual([1, 2])
  expect(screen.queryByRole('button', { name: 'Tải tin cũ' })).not.toBeInTheDocument()
})

test('keeps loaded messages after an older-page failure and retries the failed page', async () => {
  vi.mocked(getConversationMessages)
    .mockResolvedValueOnce(firstPage)
    .mockRejectedValueOnce({ status: 500 })
    .mockResolvedValueOnce(olderPage)
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Tải tin cũ' }))
  await screen.findByText('Chưa tải được tin cũ. Các tin đã tải vẫn được giữ.')
  expect(screen.getByText('New message')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Thử tải tin cũ lại' }))
  await screen.findByText('Old message')
})

test('does not request history for a conversation outside the current account list', async () => {
  renderRoute('/chat/foreign-conversation')
  await screen.findByText('Không tìm thấy hội thoại', {}, { timeout: 4000 })
  expect(getConversationMessages).not.toHaveBeenCalled()
})

test('does not show a late response from the previous conversation after switching rooms', async () => {
  let finishFirst
  vi.mocked(getConversationMessages).mockImplementation(({ conversationId }) =>
    conversationId === 'conversation-1'
      ? new Promise((resolve) => {
          finishFirst = resolve
        })
      : Promise.resolve({
          ...firstPage,
          items: [{ ...newMessage, content: 'Second room message' }],
          hasNext: false,
        }),
  )
  renderRoute('/chat/conversation-1')
  await screen.findByText('Đang tải lịch sử tin nhắn…', {}, { timeout: 4000 })
  await act(async () => {
    await router.navigate('/chat/conversation-2')
  })
  await screen.findByText('Second room message')
  await act(async () => {
    finishFirst(firstPage)
  })
  expect(screen.queryByText('New message')).not.toBeInTheDocument()
  expect(screen.getByText('Second room message')).toBeInTheDocument()
})

test('shows a forbidden history response instead of message content', async () => {
  vi.mocked(getConversationMessages).mockRejectedValue({ status: 403 })
  renderRoute('/chat/conversation-1')
  const alert = await screen.findByRole('alert', {}, { timeout: 4000 })
  expect(alert).toHaveTextContent(i18n.t('feedback.forbiddenTitle'))
  expect(screen.queryByText('New message')).not.toBeInTheDocument()
})

test('retries a failed inbox request', async () => {
  vi.mocked(getConversations)
    .mockRejectedValueOnce({ status: 500 })
    .mockResolvedValueOnce([conversation])
  const user = renderRoute('/chat')
  await screen.findByText('Chưa tải được hội thoại', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Thử lại' }))
  await screen.findByRole('link', { name: 'Mở hội thoại 1' })
})

test('redirects a guest without loading private chat data', async () => {
  clearAccessToken()
  renderRoute('/chat/conversation-1')
  await screen.findByRole('button', { name: 'Đăng nhập' }, { timeout: 4000 })
  expect(router.state.location.state.from).toBe('/chat/conversation-1')
  expect(getConversations).not.toHaveBeenCalled()
  expect(getConversationMessages).not.toHaveBeenCalled()
})

test('does not restore chat cache when a pending history finishes after logout', async () => {
  let finishHistory
  vi.mocked(getConversationMessages).mockReturnValue(
    new Promise((resolve) => {
      finishHistory = resolve
    }),
  )
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('Đang tải lịch sử tin nhắn…', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  await screen.findByRole('button', { name: 'Đăng nhập' })
  await act(async () => {
    finishHistory(firstPage)
  })
  expect(
    queryClient.getQueryData(['chat', 'chat-buyer', 'messages', 'conversation-1']),
  ).toBeUndefined()
  expect(screen.queryByText('New message')).not.toBeInTheDocument()
})

test('shows closed conversation history while keeping the composer disabled', async () => {
  vi.mocked(getConversations).mockResolvedValue([{ ...conversation, status: 'CLOSED' }])
  renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  const thread = screen.getByRole('region', { name: 'Hội thoại 1' })
  expect(within(thread).getByText('Đã đóng')).toBeInTheDocument()
  expect(within(thread).getByText('Hội thoại đã đóng. Bạn có thể xem lịch sử.')).toBeInTheDocument()
  expect(within(thread).getByRole('button', { name: 'Gửi' })).toBeDisabled()
})

test('preserves loaded history when a refresh fails', async () => {
  vi.mocked(getConversationMessages)
    .mockResolvedValueOnce({ ...firstPage, hasNext: false })
    .mockRejectedValueOnce({ status: 500 })
  const user = renderRoute('/chat/conversation-1')
  await screen.findByText('New message', {}, { timeout: 4000 })
  await user.click(screen.getByRole('button', { name: 'Làm mới tin nhắn' }))
  await screen.findByText('Chưa cập nhật được lịch sử. Các tin đã tải vẫn được giữ.')
  expect(screen.getByText('New message')).toBeInTheDocument()
})
