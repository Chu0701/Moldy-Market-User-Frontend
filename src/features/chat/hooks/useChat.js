import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { getConversationMessages, getConversations } from '@/services/chat/chatService'

export const chatKeys = {
  conversations: (userId) => ['chat', userId, 'conversations'],
  messages: (userId, conversationId) => ['chat', userId, 'messages', conversationId],
}

export function useConversations({ poll = false, enabled = true } = {}) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId =
    hasAccessToken && profileQuery.isSuccess && enabled ? profileQuery.data?.id : undefined
  const query = useQuery({
    queryKey: chatKeys.conversations(userId),
    queryFn: userId ? ({ signal }) => getConversations({ signal }) : skipToken,
    select: (conversations) =>
      conversations.filter(
        (conversation) =>
          conversation.participant1Id === userId || conversation.participant2Id === userId,
      ),
    retry: false,
    refetchInterval: poll && userId ? 30000 : false,
    refetchIntervalInBackground: false,
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
