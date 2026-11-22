import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { ApiError } from '@/services/api/ApiError'
import { normalizeSpringPage } from '@/services/api/pagination'
import {
  getConversationMessages,
  getConversations,
  startConversation,
  markConversationRead,
} from './chatService'

afterEach(() => vi.restoreAllMocks())

test('acknowledges only the displayed message ID and accepts an empty 204 response', async () => {
  const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ status: 204 })
  await markConversationRead({ conversationId: 'room/1', messageId: 42 })
  expect(patch).toHaveBeenCalledExactlyOnceWith('/api/v1/conversations/room%2F1/read', {
    messageId: 42,
  })
})

function response(data) {
  return { status: 200, data: { success: true, code: 'SUCCESS', data } }
}

test('loads conversations using the existing REST client and cancellation signal', async () => {
  const conversations = [
    { id: 'conversation-id', participant1Id: 'buyer', participant2Id: 'owner' },
  ]
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response(conversations))
  const signal = new AbortController().signal
  await expect(getConversations({ signal })).resolves.toEqual(conversations)
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/conversations', { signal })
})

test('starts a conversation with only the verified target user field', async () => {
  const conversation = { id: 'conversation-id' }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue(response(conversation))
  await expect(
    startConversation({ targetUserId: 'store-owner', productId: 'ignored' }),
  ).resolves.toEqual(conversation)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/conversations', {
    targetUserId: 'store-owner',
  })
})

test('requests page zero for the first frontend page and keeps newest-first ordering', async () => {
  const content = [{ id: 2 }, { id: 1 }]
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
    response({
      content,
      number: 0,
      size: 20,
      totalElements: 22,
      totalPages: 2,
      last: false,
    }),
  )
  const signal = new AbortController().signal
  await expect(getConversationMessages({ conversationId: 'id/part', signal })).resolves.toEqual({
    items: content,
    page: 1,
    size: 20,
    totalElements: 22,
    totalPages: 2,
    hasNext: true,
  })
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/conversations/id%2Fpart/messages', {
    params: { page: 0, size: 20 },
    signal,
  })
})

test('requests the next backend page and preserves its last-page metadata', async () => {
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue(
    response({
      content: [{ id: 1 }],
      number: 1,
      size: 20,
      totalElements: 21,
      totalPages: 2,
      last: true,
    }),
  )
  const result = await getConversationMessages({ conversationId: 'conversation-id', page: 2 })
  expect(result.page).toBe(2)
  expect(result.hasNext).toBe(false)
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/conversations/conversation-id/messages', {
    params: { page: 1, size: 20 },
    signal: undefined,
  })
})

test.each([
  [0, false, 1, true],
  [1, true, 2, false],
])('normalizes Spring page %s without changing its item list', (number, last, page, hasNext) => {
  const content = [{ id: 10 }]
  expect(
    normalizeSpringPage({ content, number, last, size: 20, totalElements: 21, totalPages: 2 }),
  ).toEqual({ items: content, page, size: 20, totalElements: 21, totalPages: 2, hasNext })
})

test('keeps an empty history page empty without a next page', () => {
  expect(
    normalizeSpringPage({
      content: [],
      number: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }),
  ).toEqual({ items: [], page: 1, size: 20, totalElements: 0, totalPages: 0, hasNext: false })
})

test.each([getConversations, () => getConversationMessages({ conversationId: 'conversation-id' })])(
  'preserves forbidden history or conversation failures',
  async (request) => {
    const error = new ApiError({ status: 403, code: 'CHAT_NOT_PARTICIPANT', message: 'Forbidden' })
    vi.spyOn(apiClient, 'get').mockRejectedValue(error)
    await expect(request()).rejects.toBe(error)
  },
)
