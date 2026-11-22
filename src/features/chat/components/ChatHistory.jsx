import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { getChronologicalMessages } from '@/features/chat/chatMessages'
import { ChatMessage } from '@/features/chat/components/ChatMessage'
import { useConversationMessages } from '@/features/chat/hooks/useChat'
import { ChatComposer } from './ChatComposer'
import { useChatRead } from '@/features/chat/hooks/useChatRead'

const statusKeys = { ACTIVE: 'chat.active', CLOSED: 'chat.closed' }

/** @param {{ conversation: object, userId: string, title: string }} props */
export function ChatHistory({ conversation, userId, title, realtime }) {
  const { t } = useTranslation()
  const query = useConversationMessages(conversation.id)
  const messages = getChronologicalMessages(query.data?.pages)
  const latestIncoming = messages
    .filter(
      (message) =>
        message.senderId !== userId &&
        message.conversationId === conversation.id &&
        Number.isSafeInteger(message.id),
    )
    .reduce((latest, message) => Math.max(latest, message.id), 0)
  const read = useChatRead({
    conversation,
    userId,
    messageId: latestIncoming,
    enabled: query.isSuccess && !query.isRefetchError,
  })
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
              <ChatMessage
                key={message.id}
                message={message}
                userId={userId}
                conversation={conversation}
                targetRef={message.id === latestIncoming ? read.targetRef : undefined}
              />
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
            {t(
              conversation.status === 'ACTIVE' && conversation.canSend !== true
                ? 'chat.readOnly'
                : (statusKeys[conversation.status] ?? 'chat.statusUnknown'),
            )}
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
      {read.hasError && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          <span>{t('chat.readError')}</span>
          <Button type="button" variant="outline" onClick={read.retry}>
            {t('chat.retryRead')}
          </Button>
        </div>
      )}
      <ChatComposer
        conversation={conversation}
        realtime={realtime}
        canSend={query.isSuccess && !query.isRefetchError}
      />
    </section>
  )
}
