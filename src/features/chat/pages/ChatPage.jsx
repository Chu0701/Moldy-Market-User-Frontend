import { MessageSquare, RefreshCw } from 'lucide-react'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { getPeerName } from '@/features/chat/chatIdentity'
import { ChatRealtimeContext } from '@/features/chat/chatRealtimeContext'
import { ChatListSkeleton } from '@/features/chat/components/ChatAvatar'
import { ChatHistory } from '@/features/chat/components/ChatHistory'
import { ConversationList } from '@/features/chat/components/ConversationList'
import { useConversations } from '@/features/chat/hooks/useChat'
import { cn } from '@/lib/utils'

const connectionDotClass = {
  connected: 'bg-success',
  connecting: 'bg-warning',
  disconnected: 'bg-destructive',
  failed: 'bg-destructive',
  idle: 'bg-muted-foreground',
}

export function ChatPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const { conversationId } = useParams()
  const productContext = location.state?.productContext ?? null
  const { userId, query } = useConversations()
  const realtime = useContext(ChatRealtimeContext)
  const connectionText = t(`chat.connection.${realtime.status}`)
  const isConnecting = realtime.status === 'connecting'
  const showReconnect = ['failed', 'disconnected'].includes(realtime.status)
  let content

  if (query.isPending) {
    content = (
      <div className="chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2 className="font-sans text-sm font-semibold">{t('chat.listTitle')}</h2>
          </div>
          <ChatListSkeleton label={t('chat.loadingConversations')} />
        </aside>
        <section className="chat-thread hidden items-center justify-center p-8 lg:flex">
          <EmptyState
            icon={MessageSquare}
            title={t('chat.chooseTitle')}
            description={t('chat.chooseDescription')}
            className="w-full max-w-sm border-dashed bg-transparent shadow-none"
          />
        </section>
      </div>
    )
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
          icon={MessageSquare}
          title={t(conversationId ? 'chat.notFoundTitle' : 'chat.emptyTitle')}
          description={t(conversationId ? 'chat.notFoundDescription' : 'chat.emptyDescription')}
        />
        {conversationId && (
          <Link to="/chat" className="text-sm underline underline-offset-4">
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
          className={cn('chat-sidebar', conversationId && 'hidden lg:flex')}
          aria-labelledby="chat-list-title"
        >
          <div className="chat-sidebar-header">
            <h2 id="chat-list-title" className="font-sans text-sm font-semibold">
              {t('chat.listTitle')}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('chat.refreshConversations')}
              title={t('chat.refreshConversations')}
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <RefreshCw
                className={cn('size-4', query.isFetching && 'animate-spin')}
                aria-hidden="true"
              />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <ConversationList conversations={query.data} userId={userId} />
          </div>
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
            productContext={productContext}
          />
        ) : conversationId ? (
          <section className="chat-thread items-center justify-center p-8">
            <div className="grid justify-items-center gap-4">
              <EmptyState
                icon={MessageSquare}
                title={t('chat.notFoundTitle')}
                description={t('chat.notFoundDescription')}
                className="w-full max-w-sm border-dashed bg-transparent shadow-none"
              />
              <Button asChild variant="outline" size="sm">
                <Link to="/chat">{t('chat.backToList')}</Link>
              </Button>
            </div>
          </section>
        ) : (
          <section className="chat-thread hidden items-center justify-center p-8 lg:flex">
            <EmptyState
              icon={MessageSquare}
              title={t('chat.chooseTitle')}
              description={t('chat.chooseDescription')}
              className="w-full max-w-sm border-dashed bg-transparent shadow-none"
            />
          </section>
        )}
      </div>
    )
  }

  return (
    <section className="chat-page" aria-labelledby="chat-page-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 id="chat-page-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('chat.title')}
          </h1>
          {query.isSuccess && (
            <span
              role="status"
              title={connectionText}
              className="relative inline-flex size-2.5 shrink-0"
            >
              {isConnecting && (
                <span className="absolute inline-flex size-full rounded-full bg-warning opacity-60 motion-safe:animate-ping" />
              )}
              <span
                className={cn(
                  'relative inline-flex size-2.5 rounded-full',
                  connectionDotClass[realtime.status] ?? 'bg-muted-foreground',
                )}
              />
              <span className="sr-only">{connectionText}</span>
            </span>
          )}
        </div>

        {query.isSuccess && showReconnect && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{connectionText}</span>
            <Button type="button" variant="outline" size="sm" onClick={realtime.reconnect}>
              {t('chat.reconnect')}
            </Button>
          </div>
        )}
      </div>
      {content}
    </section>
  )
}
