import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { markConversationRead } from '@/services/chat/chatService'
import { getAccessToken } from '@/lib/tokenStorage'
import { meQueryKey } from '@/features/auth/hooks/useSession'
import { chatKeys } from './useChat'

function subscribeToAttention(listener) {
  window.addEventListener('focus', listener)
  window.addEventListener('blur', listener)
  document.addEventListener('visibilitychange', listener)
  return () => {
    window.removeEventListener('focus', listener)
    window.removeEventListener('blur', listener)
    document.removeEventListener('visibilitychange', listener)
  }
}
const hasAttention = () => document.visibilityState === 'visible' && document.hasFocus()

/** Attach targetRef only to the newest loaded incoming message in this room. */
export function useChatRead({ conversation, userId, messageId, enabled }) {
  const client = useQueryClient()
  const attentive = useSyncExternalStore(subscribeToAttention, hasAttention, () => false)
  const targetRef = useRef(null)
  const [visible, setVisible] = useState(null)
  const activeObserver = useRef(null)
  const [errorId, setErrorId] = useState(null)
  const [retry, setRetry] = useState(0)
  const attempted = useRef(null)
  const pending = useRef(false)
  const mounted = useRef(false)
  const cursor =
    conversation.participant1Id === userId
      ? conversation.lastReadMessageIdParticipant1
      : conversation.lastReadMessageIdParticipant2

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const target = targetRef.current
    if (!target || !messageId || !enabled || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (activeObserver.current !== observer) return
        setVisible(
          entry.isIntersecting && entry.intersectionRatio >= 0.5 ? { messageId, observer } : null,
        )
      },
      { threshold: 0.5 },
    )
    activeObserver.current = observer
    observer.observe(target)
    return () => {
      observer.disconnect()
      if (activeObserver.current === observer) activeObserver.current = null
    }
  }, [messageId, enabled])

  useEffect(() => {
    if (
      !enabled ||
      !attentive ||
      visible?.messageId !== messageId ||
      visible?.observer !== activeObserver.current ||
      !Number.isSafeInteger(messageId) ||
      messageId < 1 ||
      (Number.isSafeInteger(cursor) && cursor >= messageId)
    )
      return
    const token = getAccessToken()
    const key = `${userId}/${conversation.id}/${messageId}`
    const isCurrent = () =>
      mounted.current &&
      getAccessToken() === token &&
      client.getQueryData(meQueryKey)?.id === userId
    if (!token || !isCurrent() || pending.current || attempted.current === key) return
    attempted.current = key
    pending.current = true
    void markConversationRead({ conversationId: conversation.id, messageId })
      .then(() => {
        if (isCurrent()) {
          setErrorId(null)
          void client.invalidateQueries({ queryKey: chatKeys.conversations(userId), exact: true })
        }
      })
      .catch(() => {
        if (isCurrent()) setErrorId(messageId)
      })
      .finally(() => {
        pending.current = false
        // A newer visible incoming message may have arrived during this acknowledgement.
        if (isCurrent()) setRetry((value) => value + 1)
      })
  }, [client, userId, conversation.id, messageId, cursor, enabled, attentive, visible, retry])

  return {
    targetRef,
    hasError: errorId === messageId,
    retry: () => {
      attempted.current = null
      setErrorId(null)
      setRetry((value) => value + 1)
    },
  }
}
