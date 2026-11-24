import { CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ChatTime } from '@/features/chat/components/ChatTime'
import { cn } from '@/lib/utils'
import { getParticipantName } from '@/features/chat/chatIdentity'

const fallbackKeys = {
  IMAGE: 'chat.imageMessage',
  FILE: 'chat.fileMessage',
}

/**
 * @param {{
 *   message: object,
 *   userId: string,
 *   conversation: object,
 *   targetRef?: import('react').Ref<HTMLLIElement>,
 *   showDateDivider?: boolean,
 *   isFirstInGroup?: boolean,
 *   isLastInGroup?: boolean,
 *   isLastReadOwn?: boolean,
 * }} props
 */
export function ChatMessage({
  message,
  userId,
  conversation,
  targetRef,
  showDateDivider = false,
  isFirstInGroup = true,
  isLastInGroup = true,
  isLastReadOwn = false,
}) {
  const { t } = useTranslation()
  const isMine = message.senderId === userId
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

  const bubbleShape = isMine
    ? cn(
        'rounded-2xl',
        !isFirstInGroup && 'rounded-tr-md',
        !isLastInGroup && 'rounded-br-md',
        isFirstInGroup && isLastInGroup && 'rounded-br-sm',
      )
    : cn(
        'rounded-2xl',
        !isFirstInGroup && 'rounded-tl-md',
        !isLastInGroup && 'rounded-bl-md',
        isFirstInGroup && isLastInGroup && 'rounded-bl-sm',
      )

  return (
    <li
      ref={targetRef}
      className={cn(
        'flex flex-col',
        isFirstInGroup ? 'mt-3.5 first:mt-0' : 'mt-1',
        showDateDivider && 'mt-4 first:mt-0',
      )}
    >
      {showDateDivider && (
        <div className="my-3 flex items-center justify-center" role="separator">
          <span className="rounded-full border border-border bg-surface-subtle px-3 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
            <ChatTime value={message.sentAt} mode="date" />
          </span>
        </div>
      )}

      {isFirstInGroup && <span className="sr-only">{senderLabel}</span>}

      <div
        className={cn(
          'chat-message',
          bubbleShape,
          isMine ? 'chat-message-own' : 'chat-message-peer',
        )}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{content}</p>
        {isLastInGroup && (
          <span
            className={cn(
              'mt-1 block text-right text-[11px] leading-none tabular-nums',
              isMine ? 'text-primary-foreground/65' : 'text-muted-foreground',
            )}
          >
            <ChatTime value={message.sentAt} mode="time" />
          </span>
        )}
      </div>

      {isLastReadOwn && (
        <p className="mt-1 inline-flex items-center justify-end gap-1 self-end text-[11px] text-muted-foreground">
          <CheckCheck className="size-3.5" aria-hidden="true" />
          <span>{t('chat.read')}</span>
        </p>
      )}
    </li>
  )
}
