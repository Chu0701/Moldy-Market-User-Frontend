import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { ChatTime } from '@/features/chat/components/ChatTime'
import { cn } from '@/lib/utils'
import { getPeerName } from '@/features/chat/chatIdentity'
import { UnreadBadge } from './UnreadBadge'

/** @param {{ conversations: Array<object> }} props */
export function ConversationList({ conversations, userId }) {
  const { t } = useTranslation()

  return (
    <ul className="grid gap-2" aria-label={t('chat.listLabel')}>
      {conversations.map((conversation, index) => {
        const peerName = getPeerName(conversation, userId)
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
                cn('chat-room-link', isActive && 'bg-accent text-accent-foreground')
              }
            >
              <span className="font-medium">
                {peerName ?? t('chat.conversationTitle', { number: index + 1 })}
                <UnreadBadge count={conversation.unreadCount} />
              </span>
              {!peerName && (
                <span className="text-sm text-muted-foreground">{t('chat.identityPending')}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {t('chat.createdAt')} <ChatTime value={conversation.createdAt} />
              </span>
              {conversation.status === 'CLOSED' && (
                <span className="text-sm">{t('chat.closed')}</span>
              )}
              {conversation.status === 'ACTIVE' && conversation.canSend !== true && (
                <span className="text-sm">{t('chat.readOnly')}</span>
              )}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}
