import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { getPeerName } from '@/features/chat/chatIdentity'
import { getChronologicalMessages } from '@/features/chat/chatMessages'
import { ChatAvatar } from '@/features/chat/components/ChatAvatar'
import { ChatTime } from '@/features/chat/components/ChatTime'
import { chatKeys } from '@/features/chat/hooks/useChat'
import { cn } from '@/lib/utils'
import { UnreadBadge } from './UnreadBadge'

function getCachedLastMessage(queryClient, userId, conversationId) {
  if (!userId || !conversationId) return null
  const cached = queryClient.getQueryData(chatKeys.messages(userId, conversationId))
  if (!cached?.pages) return null
  const list = getChronologicalMessages(cached.pages)
  return list.length > 0 ? list[list.length - 1] : null
}

/** @param {{ conversations: Array<object>, userId?: string }} props */
export function ConversationList({ conversations, userId }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return (
    <ul className="grid gap-1" aria-label={t('chat.listLabel')}>
      {conversations.map((conversation, index) => {
        const peerName = getPeerName(conversation, userId)
        const displayName = peerName ?? t('chat.conversationTitle', { number: index + 1 })
        const cachedLast = getCachedLastMessage(queryClient, userId, conversation.id)
        const previewTimestamp =
          cachedLast?.sentAt || conversation.lastMessageAt || conversation.createdAt

        let previewText = conversation.lastMessageContent
        if (!previewText && cachedLast) {
          const raw =
            cachedLast.type === 'TEXT'
              ? cachedLast.content
              : cachedLast.type === 'IMAGE'
                ? t('chat.imageMessage')
                : t('chat.fileMessage')
          if (raw) {
            previewText = cachedLast.senderId === userId ? `${t('chat.you')}: ${raw}` : raw
          }
        }
        if (!previewText) {
          if (conversation.status === 'CLOSED') previewText = t('chat.closed')
          else if (conversation.status === 'ACTIVE' && conversation.canSend !== true)
            previewText = t('chat.readOnly')
          else if (!peerName) previewText = t('chat.identityPending')
          else
            previewText = t(
              conversation.lastMessageAt ? 'chat.previewFallback' : 'chat.emptyHistory',
            )
        }

        const hasUnread =
          Number.isSafeInteger(conversation.unreadCount) && conversation.unreadCount > 0

        return (
          <li key={conversation.id}>
            <NavLink
              to={'/chat/' + encodeURIComponent(conversation.id)}
              aria-label={
                peerName
                  ? t('chat.openNamedConversation', { name: peerName })
                  : t('chat.openConversation', { number: index + 1 })
              }
              className={({ isActive }) =>
                cn(
                  'chat-room-link',
                  isActive
                    ? 'border-foreground/15 bg-secondary text-foreground shadow-2xs'
                    : 'border-transparent hover:bg-surface-subtle',
                )
              }
            >
              <ChatAvatar name={displayName} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm text-foreground',
                      hasUnread ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {displayName}
                  </span>
                  {previewTimestamp && (
                    <ChatTime
                      value={previewTimestamp}
                      mode="compact"
                      className="shrink-0 text-[11px] text-muted-foreground tabular-nums"
                    />
                  )}
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-xs',
                      hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {previewText}
                  </span>
                  <UnreadBadge count={conversation.unreadCount} />
                </div>
              </div>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}
