import { useTranslation } from 'react-i18next'

import { ChatTime } from '@/features/chat/components/ChatTime'
import { cn } from '@/lib/utils'
import { getParticipantName } from '@/features/chat/chatIdentity'

const fallbackKeys = {
  IMAGE: 'chat.imageMessage',
  FILE: 'chat.fileMessage',
}

/** @param {{ message: object, userId: string }} props */
export function ChatMessage({ message, userId, conversation, targetRef }) {
  const { t } = useTranslation()
  const isMine = message.senderId === userId
  const peerCursor =
    conversation.participant1Id === userId
      ? conversation.lastReadMessageIdParticipant2
      : conversation.lastReadMessageIdParticipant1
  const isRead =
    isMine &&
    message.conversationId === conversation.id &&
    Number.isSafeInteger(peerCursor) &&
    Number.isSafeInteger(message.id) &&
    peerCursor >= message.id
  const senderName = getParticipantName(conversation, message.senderId)
  const senderLabel = isMine
    ? senderName
      ? t('chat.namedSelf', { name: senderName })
      : t('chat.you')
    : (senderName ?? t('chat.peer'))
  const content =
    message.type === 'TEXT'
      ? message.content || t('chat.emptyText')
      : t(fallbackKeys[message.type] ?? 'chat.unsupportedMessage')

  return (
    <li
      ref={targetRef}
      className={cn('chat-message', isMine ? 'chat-message-own' : 'chat-message-peer')}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{senderLabel}</span>
        <ChatTime value={message.sentAt} />
      </div>
      <p className="whitespace-pre-wrap">{content}</p>
      {isRead && <p className="text-xs text-muted-foreground">{t('chat.read')}</p>}
    </li>
  )
}
