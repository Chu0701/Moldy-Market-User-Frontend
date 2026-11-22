import { apiClient } from '@/services/api/client'
import { normalizeSpringPage } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'

/** Acknowledges a displayed prefix, never messages that arrive afterwards. */
export async function markConversationRead({ conversationId, messageId }) {
  await apiClient.patch('/api/v1/conversations/' + encodeURIComponent(conversationId) + '/read', {
    messageId,
  })
}

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
