import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useContext } from 'react'
import { ChatRealtimeContext } from '@/features/chat/chatRealtimeContext'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { ChatHistory } from '@/features/chat/components/ChatHistory'
import { ConversationList } from '@/features/chat/components/ConversationList'
import { useConversations } from '@/features/chat/hooks/useChat'
import { cn } from '@/lib/utils'
import { getPeerName } from '@/features/chat/chatIdentity'

export function ChatPage() {
  const { t } = useTranslation()
  const { conversationId } = useParams()
  const { userId, query } = useConversations()
  const realtime = useContext(ChatRealtimeContext)
  let content

  if (query.isPending) {
    content = <p role="status">{t('chat.loadingConversations')}</p>
  } else if (query.error?.status === 403) {
    content = <ForbiddenState />
  } else if (query.isError) {
    content = (
      <ErrorState
        title={t('chat.listError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  } else if (query.data.length === 0) {
    content = (
      <div className="grid justify-items-start gap-4">
        <EmptyState
          title={t(conversationId ? 'chat.notFoundTitle' : 'chat.emptyTitle')}
          description={t(conversationId ? 'chat.notFoundDescription' : 'chat.emptyDescription')}
        />
        {conversationId && (
          <Link to="/chat" className="underline underline-offset-4">
            {t('chat.backToList')}
          </Link>
        )}
      </div>
    )
  } else {
    const index = query.data.findIndex((conversation) => conversation.id === conversationId)
    const selected = query.data[index]

    content = (
      <div className="chat-layout">
        <aside
          className={cn('chat-sidebar', conversationId && 'hidden lg:grid')}
          aria-labelledby="chat-list-title"
        >
          <h2 id="chat-list-title">{t('chat.listTitle')}</h2>
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('chat.refreshConversations')}
          </Button>
          <ConversationList conversations={query.data} userId={userId} />
        </aside>
        {selected ? (
          <ChatHistory
            key={selected.id}
            conversation={selected}
            userId={userId}
            title={
              getPeerName(selected, userId) ?? t('chat.conversationTitle', { number: index + 1 })
            }
            realtime={realtime}
          />
        ) : conversationId ? (
          <section className="chat-thread">
            <EmptyState
              title={t('chat.notFoundTitle')}
              description={t('chat.notFoundDescription')}
            />
            <Link to="/chat" className="underline underline-offset-4">
              {t('chat.backToList')}
            </Link>
          </section>
        ) : (
          <section className="chat-thread hidden lg:grid">
            <h2>{t('chat.chooseTitle')}</h2>
            <p className="text-muted-foreground">{t('chat.chooseDescription')}</p>
          </section>
        )}
      </div>
    )
  }

  return (
    <section className="chat-page" aria-labelledby="chat-page-title">
      <h1 id="chat-page-title">{t('chat.title')}</h1>
      {query.isSuccess && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="text-sm text-muted-foreground">
            {t(`chat.connection.${realtime.status}`)}
          </p>
          {['failed', 'disconnected'].includes(realtime.status) && (
            <Button type="button" variant="outline" onClick={realtime.reconnect}>
              {t('chat.reconnect')}
            </Button>
          )}
        </div>
      )}
      {content}
    </section>
  )
}
