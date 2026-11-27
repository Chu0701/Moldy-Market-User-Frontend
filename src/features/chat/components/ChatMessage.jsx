import { CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ChatAvatar } from '@/features/chat/components/ChatAvatar'
import { ChatTime } from '@/features/chat/components/ChatTime'
import { ChatOfferCard } from '@/features/offers/components/ChatOfferCard'
import { cn } from '@/lib/utils'
import { getParticipantName } from '@/features/chat/chatIdentity'

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g
const URL_TEST_PATTERN = /^https?:\/\/[^\s]+$/

function renderMessageContent(text) {
  const parts = String(text).split(URL_SPLIT_PATTERN)
  return parts.map((part, index) => {
    if (!URL_TEST_PATTERN.test(part)) return part
    const trimmed = part.replace(/[.,!?;:)\]]+$/, '')
    const trailing = part.slice(trimmed.length)
    try {
      const parsed = new URL(trimmed)
      if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
        return (
          <span key={index}>
            <Link
              to={`${parsed.pathname}${parsed.search}${parsed.hash}`}
              className="underline underline-offset-2 break-all hover:opacity-80"
            >
              {trimmed}
            </Link>
            {trailing}
          </span>
        )
      }
      return (
        <span key={index}>
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all hover:opacity-80"
          >
            {trimmed}
          </a>
          {trailing}
        </span>
      )
    } catch {
      return part
    }
  })
}

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
  const isImageWithUrl = message.type === 'IMAGE' && Boolean(message.attachmentUrl)
  const content =
    message.type === 'TEXT'
      ? message.content || t('chat.emptyText')
      : isImageWithUrl
        ? message.content?.trim() || ''
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

      {message.offerId ? (
        isMine ? (
          <div className="flex flex-col items-end">
            <ChatOfferCard
              offerId={message.offerId}
              userId={userId}
              peerName={senderName}
              isMine
              fallbackText={content}
            />
            {isLastInGroup && (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                <ChatTime value={message.sentAt} mode="time" />
              </span>
            )}
          </div>
        ) : (
          <div className="chat-peer-row">
            <div className="chat-peer-avatar-slot">
              {isLastInGroup && <ChatAvatar name={senderName ?? t('chat.peer')} size="xs" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <ChatOfferCard
                offerId={message.offerId}
                userId={userId}
                peerName={senderName}
                isMine={false}
                fallbackText={content}
              />
              {isLastInGroup && (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                  <ChatTime value={message.sentAt} mode="time" />
                </span>
              )}
            </div>
          </div>
        )
      ) : isMine ? (
        <div className={cn('chat-message', bubbleShape, 'chat-message-own')}>
          {isImageWithUrl && (
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('chat.openImage')}
              className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={message.attachmentUrl}
                alt={t('chat.imageMessage')}
                loading="lazy"
                decoding="async"
                className="max-h-72 w-full max-w-[240px] rounded-xl object-cover"
              />
            </a>
          )}
          {content && (
            <p
              className={cn(
                'text-[14px] leading-relaxed whitespace-pre-wrap',
                isImageWithUrl && 'mt-1.5',
              )}
            >
              {renderMessageContent(content)}
            </p>
          )}
          {isLastInGroup && (
            <span className="mt-1 block text-right text-[11px] leading-none text-primary-foreground/65 tabular-nums">
              <ChatTime value={message.sentAt} mode="time" />
            </span>
          )}
        </div>
      ) : (
        <div className="chat-peer-row">
          <div className="chat-peer-avatar-slot">
            {isLastInGroup && <ChatAvatar name={senderName ?? t('chat.peer')} size="xs" />}
          </div>
          <div className={cn('chat-message', bubbleShape, 'chat-message-peer')}>
            {isImageWithUrl && (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('chat.openImage')}
                className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={message.attachmentUrl}
                  alt={t('chat.imageMessage')}
                  loading="lazy"
                  decoding="async"
                  className="max-h-72 w-full max-w-[240px] rounded-xl object-cover"
                />
              </a>
            )}
            {content && (
              <p
                className={cn(
                  'text-[14px] leading-relaxed whitespace-pre-wrap',
                  isImageWithUrl && 'mt-1.5',
                )}
              >
                {renderMessageContent(content)}
              </p>
            )}
            {isLastInGroup && (
              <span className="mt-1 block text-right text-[11px] leading-none text-muted-foreground tabular-nums">
                <ChatTime value={message.sentAt} mode="time" />
              </span>
            )}
          </div>
        </div>
      )}

      {isLastReadOwn && !message.offerId && (
        <p className="mt-1 inline-flex items-center justify-end gap-1 self-end text-[11px] text-muted-foreground">
          <CheckCheck className="size-3.5" aria-hidden="true" />
          <span>{t('chat.read')}</span>
        </p>
      )}
    </li>
  )
}
