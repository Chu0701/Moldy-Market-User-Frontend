import { ArrowLeft, MessageSquare, Package, RefreshCw, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { getChronologicalMessages } from '@/features/chat/chatMessages'
import { ChatAvatar, ChatMessagesSkeleton } from '@/features/chat/components/ChatAvatar'
import { ChatMessage } from '@/features/chat/components/ChatMessage'
import { getDateKey } from '@/features/chat/chatDate'
import { useConversationMessages } from '@/features/chat/hooks/useChat'
import { useChatRead } from '@/features/chat/hooks/useChatRead'
import { ChatPinnedOfferBar } from '@/features/offers/components/ChatPinnedOfferBar'
import { MakeOfferModal } from '@/features/offers/components/MakeOfferModal'
import { cn } from '@/lib/utils'
import { getProductById } from '@/services/products/productService'
import { ChatComposer } from './ChatComposer'

const GROUP_WINDOW_MS = 5 * 60 * 1000

function isWithinGroupWindow(prevSentAt, currSentAt) {
  if (!prevSentAt || !currSentAt) return false
  const prev = new Date(prevSentAt).getTime()
  const curr = new Date(currSentAt).getTime()
  if (Number.isNaN(prev) || Number.isNaN(curr)) return false
  return Math.abs(curr - prev) <= GROUP_WINDOW_MS
}

/** @param {{ conversation: object, userId: string, title: string, realtime: object, productContext?: { id: string, title: string, price: number, imageUrl?: string } | null }} props */
export function ChatHistory({ conversation, userId, title, realtime, productContext = null }) {
  const { t, i18n } = useTranslation()
  const query = useConversationMessages(conversation.id)
  const scrollRef = useRef(null)
  const [dismissedProductId, setDismissedProductId] = useState(null)
  const [sendingProductCard, setSendingProductCard] = useState(false)
  const [offerModalProduct, setOfferModalProduct] = useState(null)
  const [loadingOfferProduct, setLoadingOfferProduct] = useState(false)
  const activeProduct =
    productContext?.id && dismissedProductId !== productContext.id ? productContext : null
  const canSendNow =
    query.isSuccess &&
    !query.isRefetchError &&
    conversation.status === 'ACTIVE' &&
    conversation.canSend === true &&
    realtime.status === 'connected' &&
    !realtime.isPending

  async function handleSendProductInquiry() {
    if (!activeProduct || !canSendNow || sendingProductCard) return
    setSendingProductCard(true)
    try {
      const formattedPrice = new Intl.NumberFormat(i18n.resolvedLanguage, {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(Number(activeProduct.price ?? 0))
      const productUrl = `${window.location.origin}/products/${encodeURIComponent(activeProduct.id)}`
      const message = t('chat.productCard.quickMessage', {
        title: activeProduct.title,
        price: formattedPrice,
        url: productUrl,
      })
      await realtime.sendText(conversation.id, message)
      setDismissedProductId(activeProduct.id)
    } catch {
      // Keep card visible so user can retry or type manually.
    } finally {
      setSendingProductCard(false)
    }
  }
  const messages = getChronologicalMessages(query.data?.pages)
  const latestMessageId = messages.length > 0 ? messages[messages.length - 1].id : null
  const latestOfferId =
    [...messages].reverse().find((message) => Boolean(message.offerId))?.offerId ?? null
  const contextProductId =
    productContext?.id ??
    [...messages].reverse().find((message) => Boolean(message.attachedProductId))
      ?.attachedProductId ??
    null

  async function handleOpenOfferFromChat() {
    if (!contextProductId || loadingOfferProduct) return
    setLoadingOfferProduct(true)
    try {
      const loaded = await getProductById({ productId: contextProductId })
      if (loaded && loaded.status === 'ACTIVE' && loaded.allowOffer !== false) {
        setOfferModalProduct(loaded)
      }
    } catch {
      // Ignore if product is no longer available
    } finally {
      setLoadingOfferProduct(false)
    }
  }

  const latestIncoming = messages
    .filter(
      (message) =>
        message.senderId !== userId &&
        message.conversationId === conversation.id &&
        Number.isSafeInteger(message.id),
    )
    .reduce((latest, message) => Math.max(latest, message.id), 0)

  const peerCursor =
    conversation.participant1Id === userId
      ? conversation.lastReadMessageIdParticipant2
      : conversation.lastReadMessageIdParticipant1

  const lastReadOwnMessageId = messages.reduce((latest, message) => {
    const isMine = message.senderId === userId
    const isRead =
      isMine &&
      !message.offerId &&
      message.conversationId === conversation.id &&
      Number.isSafeInteger(peerCursor) &&
      Number.isSafeInteger(message.id) &&
      peerCursor >= message.id
    return isRead ? message.id : latest
  }, null)

  const read = useChatRead({
    conversation,
    userId,
    messageId: latestIncoming,
    enabled: query.isSuccess && !query.isRefetchError,
  })

  useEffect(() => {
    const container = scrollRef.current
    if (!container || latestMessageId == null) return
    container.scrollTop = container.scrollHeight
  }, [conversation.id, latestMessageId])

  const subtitleKey =
    conversation.status === 'CLOSED'
      ? 'chat.closed'
      : conversation.status === 'ACTIVE' && conversation.canSend !== true
        ? 'chat.readOnly'
        : null

  let olderLabel = 'chat.loadOlder'
  if (query.isFetchingNextPage) olderLabel = 'chat.loadingOlder'
  else if (query.isFetchNextPageError) olderLabel = 'chat.retryOlder'

  let content
  if (query.isPending) {
    content = <ChatMessagesSkeleton label={t('chat.loadingMessages')} />
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
      <div className="flex min-h-full flex-col">
        {query.hasNextPage && (
          <div className="mb-3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage()}
            >
              {t(olderLabel)}
            </Button>
          </div>
        )}
        {query.isFetchNextPageError && (
          <p role="alert" className="mb-3 text-center text-xs font-medium text-destructive">
            {t('chat.olderError')}
          </p>
        )}
        {query.isRefetchError && !query.isFetchNextPageError && (
          <p role="alert" className="mb-3 text-center text-xs font-medium text-destructive">
            {t('chat.refreshError')}
          </p>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <EmptyState
              icon={MessageSquare}
              title={t('chat.emptyHistory')}
              description={t('chat.emptyHistoryDescription')}
              className="w-full max-w-sm border-dashed bg-transparent shadow-none"
            />
          </div>
        ) : (
          <ol className="chat-messages mt-auto" aria-label={t('chat.historyLabel')}>
            {messages.map((message, index) => {
              const prev = messages[index - 1]
              const next = messages[index + 1]
              const currDateKey = getDateKey(message.sentAt)
              const prevDateKey = prev ? getDateKey(prev.sentAt) : null
              const nextDateKey = next ? getDateKey(next.sentAt) : null

              const showDateDivider = Boolean(currDateKey) && currDateKey !== prevDateKey
              const groupedWithPrev =
                !showDateDivider &&
                Boolean(prev) &&
                prev.senderId === message.senderId &&
                isWithinGroupWindow(prev.sentAt, message.sentAt)
              const groupedWithNext =
                Boolean(next) &&
                currDateKey === nextDateKey &&
                next.senderId === message.senderId &&
                isWithinGroupWindow(message.sentAt, next.sentAt)

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  userId={userId}
                  conversation={conversation}
                  targetRef={message.id === latestIncoming ? read.targetRef : undefined}
                  showDateDivider={showDateDivider}
                  isFirstInGroup={!groupedWithPrev}
                  isLastInGroup={!groupedWithNext}
                  isLastReadOwn={message.id === lastReadOwnMessageId}
                />
              )
            })}
          </ol>
        )}
      </div>
    )
  }

  return (
    <section className="chat-thread" aria-labelledby="chat-thread-title">
      <header className="chat-thread-header">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/chat"
            aria-label={t('chat.backToList')}
            title={t('chat.backToList')}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <ArrowLeft className="size-4.5" aria-hidden="true" />
          </Link>
          <ChatAvatar name={title} size="sm" />
          <div className="min-w-0">
            <h2 id="chat-thread-title" className="truncate font-sans text-sm font-semibold">
              {title}
            </h2>
            {subtitleKey && <p className="text-xs text-muted-foreground">{t(subtitleKey)}</p>}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('chat.refreshMessages')}
          title={t('chat.refreshMessages')}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
          className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        >
          <RefreshCw
            className={cn('size-4', query.isFetching && 'animate-spin')}
            aria-hidden="true"
          />
        </Button>
      </header>

      <ChatPinnedOfferBar offerId={latestOfferId} userId={userId} />

      <div ref={scrollRef} className="chat-viewport">
        {content}
      </div>

      <footer className="chat-thread-footer">
        {activeProduct && (
          <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-border bg-surface-subtle p-2.5">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {activeProduct.imageUrl ? (
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.title}
                  className="size-full object-cover"
                />
              ) : (
                <Package aria-hidden="true" className="size-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                {t('chat.productCard.heading')}
              </p>
              <Link
                to={`/products/${encodeURIComponent(activeProduct.id)}`}
                className="block truncate text-xs font-semibold text-foreground underline-offset-4 hover:underline sm:text-sm"
              >
                {activeProduct.title}
              </Link>
              <ProductPrice
                value={activeProduct.price}
                className="text-xs font-bold text-foreground tabular-nums"
              />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                disabled={!canSendNow || sendingProductCard}
                onClick={() => void handleSendProductInquiry()}
              >
                <Send aria-hidden="true" className="size-3.5" />
                <span>{t('chat.productCard.sendAction')}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                aria-label={t('actions.close')}
                onClick={() => setDismissedProductId(activeProduct.id)}
              >
                <X aria-hidden="true" className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
        {read.hasError && (
          <div
            role="alert"
            className="mb-2 flex flex-wrap items-center gap-2 text-xs text-destructive"
          >
            <span>{t('chat.readError')}</span>
            <Button type="button" variant="outline" size="xs" onClick={read.retry}>
              {t('chat.retryRead')}
            </Button>
          </div>
        )}
        <ChatComposer
          conversation={conversation}
          realtime={realtime}
          canSend={query.isSuccess && !query.isRefetchError}
          onOpenMakeOffer={contextProductId ? () => void handleOpenOfferFromChat() : undefined}
        />
      </footer>

      {offerModalProduct && (
        <MakeOfferModal product={offerModalProduct} onClose={() => setOfferModalProduct(null)} />
      )}
    </section>
  )
}
